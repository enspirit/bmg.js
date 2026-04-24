/**
 * Compile a SQL AST to a parameterized SQL string.
 *
 * Walks the typed AST and produces { sql, params } where sql contains
 * dialect-specific placeholders and params is an array of bind values.
 */
import type {
  SqlExpr,
  SelectExpr,
  SelectItem,
  ScalarExpr,
  FromClause,
  TableSpec,
  OrderByTerm,
} from './ast';
import type { Predicate } from '@enspirit/predicate';
import type { SqlDialect } from './dialect';
import { PostgresDialect } from './dialect';

export interface CompiledSql {
  sql: string;
  params: unknown[];
}

interface CompileContext {
  dialect: SqlDialect;
  params: unknown[];
}

function addParam(ctx: CompileContext, value: unknown): string {
  ctx.params.push(value);
  return ctx.dialect.paramPlaceholder(ctx.params.length);
}

// ============================================================================
// Scalar expressions
// ============================================================================

function compileScalar(expr: ScalarExpr, ctx: CompileContext): string {
  switch (expr.kind) {
    case 'column_ref':
      return `${ctx.dialect.quoteIdentifier(expr.qualifier)}.${ctx.dialect.quoteIdentifier(expr.column)}`;

    case 'sql_literal':
      return addParam(ctx, expr.value);

    case 'aggregate': {
      const func = expr.func === 'distinct_count' ? 'COUNT' : expr.func.toUpperCase();
      if (!expr.expr) {
        return `${func}(*)`;
      }
      const inner = compileScalar(expr.expr, ctx);
      if (expr.func === 'distinct_count') {
        return `COUNT(DISTINCT ${inner})`;
      }
      return `${func}(${inner})`;
    }

    case 'func_call': {
      const args = expr.args.map(a => compileScalar(a, ctx)).join(', ');
      return `${expr.func.toUpperCase()}(${args})`;
    }

    case 'star':
      return `${ctx.dialect.quoteIdentifier(expr.qualifier)}.*`;
  }
}

// ============================================================================
// Predicates (from @enspirit/predicate)
//
// We compile predicates with qualified column names: attribute names in
// predicates map to column references using a qualifier lookup.
// ============================================================================

const COMPARISON_OPS: Record<string, string> = {
  eq: '=',
  neq: '<>',
  lt: '<',
  lte: '<=',
  gt: '>',
  gte: '>=',
};

/**
 * Compile a predicate to SQL.
 *
 * The `qualifyAttr` function maps attribute names to qualified SQL identifiers
 * (e.g., 'city' → '"t1"."city"'). If not provided, attributes are quoted directly.
 */
export function compilePredicate(
  predicate: Predicate,
  ctx: CompileContext,
  qualifyAttr?: (name: string) => string
): string {
  const qa = qualifyAttr ?? ((name: string) => ctx.dialect.quoteIdentifier(name));

  function compilePredicateScalar(expr: { kind: string; name?: string; value?: unknown }): string {
    if (expr.kind === 'attr') {
      const name = expr.name!;
      // Dotted names (e.g., 't1.sid') are pre-qualified — split and quote each part
      const dot = name.indexOf('.');
      if (dot >= 0) {
        const qualifier = name.substring(0, dot);
        const column = name.substring(dot + 1);
        return `${ctx.dialect.quoteIdentifier(qualifier)}.${ctx.dialect.quoteIdentifier(column)}`;
      }
      return qa(name);
    }
    return addParam(ctx, expr.value);
  }

  function walk(p: Predicate): string {
    switch (p.kind) {
      case 'eq':
      case 'neq':
      case 'lt':
      case 'lte':
      case 'gt':
      case 'gte': {
        if (p.right.kind === 'literal' && p.right.value === null) {
          const left = compilePredicateScalar(p.left);
          return p.kind === 'eq' ? `${left} IS NULL` : `${left} IS NOT NULL`;
        }
        if (p.left.kind === 'literal' && p.left.value === null) {
          const right = compilePredicateScalar(p.right);
          return p.kind === 'eq' ? `${right} IS NULL` : `${right} IS NOT NULL`;
        }
        const left = compilePredicateScalar(p.left);
        const right = compilePredicateScalar(p.right);
        return `${left} ${COMPARISON_OPS[p.kind]} ${right}`;
      }

      case 'in': {
        const left = compilePredicateScalar(p.left);
        if (p.values.length === 0) return '1 = 0';
        // SQL `IN (NULL, ...)` does not match NULL rows. Split null out:
        // `(col IS NULL OR col IN (non-nulls))`. Parens required because
        // the result is an implicit OR that must bind correctly inside
        // AND / NOT. Mirrors @enspirit/predicate's toSql.
        const hasNull = p.values.some(v => v === null);
        const nonNulls = p.values.filter(v => v !== null);
        if (!hasNull) {
          const placeholders = nonNulls.map(v => addParam(ctx, v)).join(', ');
          return `${left} IN (${placeholders})`;
        }
        if (nonNulls.length === 0) {
          return `${left} IS NULL`;
        }
        const placeholders = nonNulls.map(v => addParam(ctx, v)).join(', ');
        return `(${left} IS NULL OR ${left} IN (${placeholders}))`;
      }

      case 'and': {
        if (p.operands.length === 0) return '1 = 1';
        if (p.operands.length === 1) return walk(p.operands[0]);
        return p.operands.map(op => {
          const sql = walk(op);
          return op.kind === 'or' ? `(${sql})` : sql;
        }).join(' AND ');
      }

      case 'or': {
        if (p.operands.length === 0) return '1 = 0';
        if (p.operands.length === 1) return walk(p.operands[0]);
        return p.operands.map(op => {
          const sql = walk(op);
          return op.kind === 'and' ? `(${sql})` : sql;
        }).join(' OR ');
      }

      case 'not': {
        const inner = walk(p.operand);
        const needsParens = p.operand.kind === 'and' || p.operand.kind === 'or';
        return needsParens ? `NOT (${inner})` : `NOT ${inner}`;
      }

      case 'tautology':
        return '1 = 1';

      case 'contradiction':
        return '1 = 0';

      default: {
        // Extension: EXISTS subquery (used by processSemiJoin)
        const pAny = p as any;
        if (pAny.kind === 'exists' && pAny.subquery) {
          const subSql = compileExpr(pAny.subquery, ctx);
          return `EXISTS (${subSql})`;
        }
        return '1 = 1';
      }
    }
  }

  return walk(predicate);
}

// ============================================================================
// Table specs (FROM clause contents)
// ============================================================================

function compileTableSpec(spec: TableSpec, ctx: CompileContext): string {
  switch (spec.kind) {
    case 'table_ref':
      return `${ctx.dialect.quoteIdentifier(spec.table)} ${ctx.dialect.quoteIdentifier(spec.alias)}`;

    case 'subquery_ref': {
      const sub = compileExpr(spec.subquery, ctx, true);
      return `(${sub}) ${ctx.dialect.quoteIdentifier(spec.alias)}`;
    }

    case 'raw_subquery_ref': {
      if (spec.params) {
        for (const param of spec.params) ctx.params.push(param);
      }
      return `(${spec.sql}) ${ctx.dialect.quoteIdentifier(spec.alias)}`;
    }

    case 'inner_join': {
      const left = compileTableSpec(spec.left, ctx);
      const right = compileTableSpec(spec.right, ctx);
      const on = compilePredicate(spec.on, ctx, buildJoinQualifier(spec.left, spec.right, ctx));
      return `${left} JOIN ${right} ON ${on}`;
    }

    case 'left_join': {
      const left = compileTableSpec(spec.left, ctx);
      const right = compileTableSpec(spec.right, ctx);
      const on = compilePredicate(spec.on, ctx, buildJoinQualifier(spec.left, spec.right, ctx));
      return `${left} LEFT JOIN ${right} ON ${on}`;
    }

    case 'cross_join': {
      const left = compileTableSpec(spec.left, ctx);
      const right = compileTableSpec(spec.right, ctx);
      return `${left} CROSS JOIN ${right}`;
    }
  }
}

/**
 * Build a qualifier function for join ON predicates.
 * Attribute names in the predicate are qualified as qualifier.column.
 */
function buildJoinQualifier(left: TableSpec, _right: TableSpec, ctx: CompileContext): (name: string) => string {
  // For join predicates, attributes are already qualified in the predicate AST
  // via column_ref nodes. This function handles bare attr names by defaulting
  // to the left table qualifier.
  const leftAlias = getTableAlias(left);
  return (name: string) => {
    if (leftAlias) {
      return `${ctx.dialect.quoteIdentifier(leftAlias)}.${ctx.dialect.quoteIdentifier(name)}`;
    }
    return ctx.dialect.quoteIdentifier(name);
  };
}

function getTableAlias(spec: TableSpec): string | undefined {
  switch (spec.kind) {
    case 'table_ref':
    case 'subquery_ref':
    case 'raw_subquery_ref':
      return spec.alias;
    case 'inner_join':
    case 'left_join':
      return getTableAlias(spec.left);
    case 'cross_join':
      return getTableAlias(spec.left);
  }
}

// ============================================================================
// FROM clause
// ============================================================================

function compileFrom(from: FromClause, ctx: CompileContext): string {
  return `FROM ${compileTableSpec(from.tableSpec, ctx)}`;
}

// ============================================================================
// Select items
// ============================================================================

function compileSelectItem(item: SelectItem, ctx: CompileContext): string {
  const expr = compileScalar(item.expr, ctx);

  // Star expressions don't need an alias
  if (item.expr.kind === 'star') return expr;

  // If the expression naturally produces the alias name, skip AS
  if (item.expr.kind === 'column_ref' && item.expr.column === item.alias) {
    return expr;
  }

  return `${expr} AS ${ctx.dialect.quoteIdentifier(item.alias)}`;
}

// ============================================================================
// ORDER BY
// ============================================================================

function compileOrderBy(terms: OrderByTerm[], ctx: CompileContext): string {
  return terms.map(t => {
    const expr = compileScalar(t.expr, ctx);
    return `${expr} ${t.direction.toUpperCase()}`;
  }).join(', ');
}

// ============================================================================
// Main: compile a SqlExpr
// ============================================================================

function compileSelect(expr: SelectExpr, ctx: CompileContext): string {
  const parts: string[] = [];

  // SELECT [DISTINCT]
  parts.push(expr.quantifier === 'distinct' ? 'SELECT DISTINCT' : 'SELECT');

  // select list
  const items = expr.selectList.map(item => compileSelectItem(item, ctx)).join(', ');
  parts.push(items);

  // FROM
  if (expr.from) {
    parts.push(compileFrom(expr.from, ctx));
  }

  // WHERE
  if (expr.where) {
    const qualifier = expr.from ? buildSelectQualifier(expr, ctx) : undefined;
    parts.push('WHERE ' + compilePredicate(expr.where, ctx, qualifier));
  }

  // GROUP BY
  if (expr.groupBy && expr.groupBy.length > 0) {
    const cols = expr.groupBy.map(c => compileScalar(c, ctx)).join(', ');
    parts.push('GROUP BY ' + cols);
  }

  // ORDER BY
  if (expr.orderBy && expr.orderBy.length > 0) {
    parts.push('ORDER BY ' + compileOrderBy(expr.orderBy, ctx));
  }

  // LIMIT
  if (expr.limit !== undefined) {
    parts.push('LIMIT ' + expr.limit);
  }

  // OFFSET
  if (expr.offset !== undefined && expr.offset !== 0) {
    parts.push('OFFSET ' + expr.offset);
  }

  return parts.join(' ');
}

/**
 * Build a qualifier function for WHERE predicates in a SELECT.
 *
 * Resolves each attribute name to its underlying qualified column via
 * the select list:
 *   - A join can pull attrs from the right side → their qualifier is
 *     the right-side alias, not the FROM's primary alias.
 *   - After `rename` / `prefix` / `suffix`, an attribute's name in the
 *     relation's interface differs from its physical column name. SQL
 *     column aliases aren't visible in WHERE, so the predicate must
 *     reference the physical column.
 *
 * Falls back to `(fallback_alias, name)` for attrs not in the select
 * list (e.g., correlated refs from an outer query).
 */
function buildSelectQualifier(expr: SelectExpr, ctx: CompileContext): (name: string) => string {
  const fallback = expr.from ? getTableAlias(expr.from.tableSpec) : undefined;
  const lookup = new Map<string, { qualifier: string; column: string }>();
  for (const item of expr.selectList) {
    if (item.expr.kind === 'column_ref') {
      lookup.set(item.alias, { qualifier: item.expr.qualifier, column: item.expr.column });
    }
  }
  return (name: string) => {
    const hit = lookup.get(name);
    if (hit) {
      return `${ctx.dialect.quoteIdentifier(hit.qualifier)}.${ctx.dialect.quoteIdentifier(hit.column)}`;
    }
    if (fallback) {
      return `${ctx.dialect.quoteIdentifier(fallback)}.${ctx.dialect.quoteIdentifier(name)}`;
    }
    return ctx.dialect.quoteIdentifier(name);
  };
}

function compileSetOp(
  keyword: string,
  left: SqlExpr,
  right: SqlExpr,
  all: boolean,
  ctx: CompileContext
): string {
  const l = compileExpr(left, ctx, true);
  const r = compileExpr(right, ctx, true);
  const allStr = all ? ' ALL' : '';
  return `(${l}) ${keyword}${allStr} (${r})`;
}

function compileExpr(expr: SqlExpr, ctx: CompileContext, _parenthesize = false): string {
  switch (expr.kind) {
    case 'select':
      return compileSelect(expr, ctx);
    case 'union':
      return compileSetOp('UNION', expr.left, expr.right, expr.all, ctx);
    case 'except':
      return compileSetOp('EXCEPT', expr.left, expr.right, false, ctx);
    case 'intersect':
      return compileSetOp('INTERSECT', expr.left, expr.right, false, ctx);
  }
}

/**
 * Compile a SQL AST to a parameterized SQL string.
 *
 * @param expr - The SQL AST to compile
 * @param dialect - The SQL dialect to use (defaults to Postgres)
 * @returns An object with `sql` (the SQL string with placeholders) and `params` (the values)
 */
export function compile(expr: SqlExpr, dialect: SqlDialect = PostgresDialect): CompiledSql {
  const ctx: CompileContext = { dialect, params: [] };
  const sql = compileExpr(expr, ctx);
  return { sql, params: ctx.params };
}
