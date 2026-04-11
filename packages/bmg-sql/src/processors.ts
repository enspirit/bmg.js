/**
 * SQL AST processors.
 *
 * Each processor is a pure function that transforms a SqlExpr into a new SqlExpr.
 * They mirror the Ruby bmg SQL processors (Processor::Where, Processor::Clip, etc.)
 *
 * Key pattern: when an operation can't be applied directly to the current AST
 * (e.g., WHERE on a GROUP BY, or project on a UNION), wrap in a subquery first
 * via builder.fromSelf().
 */
import type {
  SqlExpr,
  SelectExpr,
  SelectItem,
  ColumnRef,
  TableSpec,
  FromClause,
} from './ast';
import type { Predicate } from '@enspirit/predicate';
import { and as predAnd } from '@enspirit/predicate';
import { SqlBuilder } from './builder';

// ============================================================================
// Helpers
// ============================================================================

/** Check if expression needs wrapping before further manipulation */
function needsSubquery(expr: SqlExpr): boolean {
  return expr.kind !== 'select';
}

/** Check if a SELECT has features that prevent direct modification */
function isComplex(expr: SelectExpr): boolean {
  return !!(expr.groupBy && expr.groupBy.length > 0) ||
    !!(expr.limit !== undefined) ||
    !!(expr.offset !== undefined && expr.offset !== 0) ||
    hasComputedAttributes(expr);
}

function hasComputedAttributes(expr: SelectExpr): boolean {
  return expr.selectList.some(item =>
    item.expr.kind === 'aggregate' ||
    item.expr.kind === 'func_call' ||
    item.expr.kind === 'sql_literal'
  );
}

/** Ensure we have a simple SELECT we can modify. Wraps set ops/complex queries. */
function ensureSelect(expr: SqlExpr, builder: SqlBuilder): SelectExpr {
  if (needsSubquery(expr)) return builder.fromSelf(expr);
  return expr as SelectExpr;
}

/** Get the primary table alias from a FROM clause */
function getPrimaryAlias(from?: FromClause): string | undefined {
  if (!from) return undefined;
  return getAlias(from.tableSpec);
}

function getAlias(spec: TableSpec): string | undefined {
  switch (spec.kind) {
    case 'table_ref':
    case 'subquery_ref':
      return spec.alias;
    case 'inner_join':
    case 'left_join':
    case 'cross_join':
      return getAlias(spec.left);
  }
}

// ============================================================================
// processWhere — restriction (WHERE clause)
// ============================================================================

/**
 * Add a WHERE predicate to a SQL expression.
 * If the expression already has a WHERE, merges with AND.
 * If the expression has GROUP BY or computed attributes, wraps in subquery first.
 */
export function processWhere(
  expr: SqlExpr,
  predicate: Predicate,
  builder: SqlBuilder
): SqlExpr {
  let select = ensureSelect(expr, builder);

  // If complex (GROUP BY, LIMIT, computed), wrap first
  if (isComplex(select)) {
    select = builder.fromSelf(select);
  }

  // Merge with existing WHERE
  const merged = select.where
    ? predAnd(select.where, predicate)
    : predicate;

  return { ...select, where: merged };
}

// ============================================================================
// processProject — projection (keep only specified columns)
// ============================================================================

/**
 * Project: keep only the specified columns in the select list.
 * Adds DISTINCT since projection may introduce duplicates.
 */
export function processProject(
  expr: SqlExpr,
  attrs: string[],
  builder: SqlBuilder
): SqlExpr {
  let select = ensureSelect(expr, builder);

  const attrSet = new Set(attrs);
  const filtered = select.selectList.filter(item => attrSet.has(item.alias));

  return {
    ...select,
    quantifier: 'distinct',
    selectList: filtered,
  };
}

/**
 * Allbut: remove the specified columns from the select list.
 * Adds DISTINCT since projection may introduce duplicates.
 */
export function processAllbut(
  expr: SqlExpr,
  attrs: string[],
  builder: SqlBuilder
): SqlExpr {
  let select = ensureSelect(expr, builder);

  const attrSet = new Set(attrs);
  const filtered = select.selectList.filter(item => !attrSet.has(item.alias));

  return {
    ...select,
    quantifier: 'distinct',
    selectList: filtered,
  };
}

// ============================================================================
// processRename — column aliasing
// ============================================================================

/**
 * Rename columns in the select list.
 * @param renaming - Map from old name to new name.
 */
export function processRename(
  expr: SqlExpr,
  renaming: Record<string, string>,
  builder: SqlBuilder
): SqlExpr {
  const select = ensureSelect(expr, builder);

  const renamed = select.selectList.map(item => {
    const newName = renaming[item.alias];
    if (newName) {
      return { ...item, alias: newName };
    }
    return item;
  });

  return { ...select, selectList: renamed };
}

// ============================================================================
// processExtend — add computed columns
// ============================================================================

/**
 * Extend: add new columns that are copies of existing columns.
 * Only supports attribute references (symbol-only, like Ruby).
 * @param extension - Map from new column name to source column name.
 */
export function processExtend(
  expr: SqlExpr,
  extension: Record<string, string>,
  builder: SqlBuilder
): SqlExpr {
  let select = ensureSelect(expr, builder);
  if (needsSubquery(expr)) {
    select = builder.fromSelf(expr);
  }

  const alias = getPrimaryAlias(select.from);
  if (!alias) return select;

  const newItems: SelectItem[] = Object.entries(extension).map(([newName, sourceCol]) => ({
    expr: { kind: 'column_ref' as const, qualifier: alias, column: sourceCol },
    alias: newName,
  }));

  return {
    ...select,
    selectList: [...select.selectList, ...newItems],
  };
}

// ============================================================================
// processConstants — add literal constant columns
// ============================================================================

/**
 * Constants: add literal value columns to every row.
 * @param constants - Map from column name to literal value.
 */
export function processConstants(
  expr: SqlExpr,
  constants: Record<string, unknown>,
  builder: SqlBuilder
): SqlExpr {
  let select = ensureSelect(expr, builder);
  if (needsSubquery(expr)) {
    select = builder.fromSelf(expr);
  }

  const newItems: SelectItem[] = Object.entries(constants).map(([name, value]) => ({
    expr: { kind: 'sql_literal' as const, value },
    alias: name,
  }));

  return {
    ...select,
    selectList: [...select.selectList, ...newItems],
  };
}

// ============================================================================
// processRequalify — regenerate table qualifiers
// ============================================================================

/**
 * Regenerate all table qualifiers in a SQL expression to avoid conflicts
 * when merging two expressions (e.g., for JOIN or set operations).
 */
export function processRequalify(
  expr: SqlExpr,
  builder: SqlBuilder
): SqlExpr {
  if (expr.kind !== 'select') {
    // For set operations, requalify each branch
    if (expr.kind === 'union') {
      return { ...expr, left: processRequalify(expr.left, builder), right: processRequalify(expr.right, builder) };
    }
    if (expr.kind === 'except') {
      return { ...expr, left: processRequalify(expr.left, builder), right: processRequalify(expr.right, builder) };
    }
    if (expr.kind === 'intersect') {
      return { ...expr, left: processRequalify(expr.left, builder), right: processRequalify(expr.right, builder) };
    }
    return expr;
  }

  // Build old→new qualifier map
  const qualMap = new Map<string, string>();
  function remap(old: string): string {
    if (!qualMap.has(old)) {
      qualMap.set(old, builder.qualify());
    }
    return qualMap.get(old)!;
  }

  // Requalify select list
  const selectList = expr.selectList.map(item => ({
    ...item,
    expr: requalifyScalar(item.expr, remap),
  }));

  // Requalify FROM
  const from = expr.from
    ? { tableSpec: requalifyTableSpec(expr.from.tableSpec, remap) }
    : undefined;

  // Requalify GROUP BY
  const groupBy = expr.groupBy?.map(c => requalifyColumnRef(c, remap));

  // Requalify ORDER BY
  const orderBy = expr.orderBy?.map(t => ({
    ...t,
    expr: requalifyColumnRef(t.expr, remap),
  }));

  // WHERE predicates reference attribute names, not qualifiers,
  // so they don't need requalification at this level

  return { ...expr, selectList, from, groupBy, orderBy };
}

function requalifyScalar(expr: SelectItem['expr'], remap: (old: string) => string): SelectItem['expr'] {
  switch (expr.kind) {
    case 'column_ref':
      return { ...expr, qualifier: remap(expr.qualifier) };
    case 'star':
      return { ...expr, qualifier: remap(expr.qualifier) };
    case 'aggregate':
      return expr.expr
        ? { ...expr, expr: requalifyScalar(expr.expr, remap) as ColumnRef }
        : expr;
    case 'func_call':
      return { ...expr, args: expr.args.map(a => requalifyScalar(a, remap)) };
    case 'sql_literal':
      return expr;
  }
}

function requalifyColumnRef(ref: ColumnRef, remap: (old: string) => string): ColumnRef {
  return { ...ref, qualifier: remap(ref.qualifier) };
}

function requalifyTableSpec(spec: TableSpec, remap: (old: string) => string): TableSpec {
  switch (spec.kind) {
    case 'table_ref':
      return { ...spec, alias: remap(spec.alias) };
    case 'subquery_ref':
      return { ...spec, alias: remap(spec.alias) };
    case 'inner_join':
      return {
        ...spec,
        left: requalifyTableSpec(spec.left, remap),
        right: requalifyTableSpec(spec.right, remap),
      };
    case 'left_join':
      return {
        ...spec,
        left: requalifyTableSpec(spec.left, remap),
        right: requalifyTableSpec(spec.right, remap),
      };
    case 'cross_join':
      return {
        ...spec,
        left: requalifyTableSpec(spec.left, remap),
        right: requalifyTableSpec(spec.right, remap),
      };
  }
}

// ============================================================================
// processJoin — INNER JOIN / LEFT JOIN
// ============================================================================

/**
 * Join two SQL expressions.
 * Merges select lists, FROM clauses, and WHERE clauses.
 */
export function processJoin(
  left: SqlExpr,
  right: SqlExpr,
  on: Predicate,
  joinKind: 'inner_join' | 'left_join',
  builder: SqlBuilder
): SqlExpr {
  // Ensure both are simple selects
  let leftSel = ensureSelect(left, builder);
  if (isComplex(leftSel)) leftSel = builder.fromSelf(leftSel);

  let rightSel = ensureSelect(right, builder);
  if (isComplex(rightSel)) rightSel = builder.fromSelf(rightSel);

  // Requalify right to avoid alias conflicts
  rightSel = processRequalify(rightSel, builder) as SelectExpr;

  // Merge select lists: keep all left columns, add right columns not in left
  const leftAliases = new Set(leftSel.selectList.map(i => i.alias));
  const rightNewItems = rightSel.selectList.filter(i => !leftAliases.has(i.alias));
  const mergedSelectList = [...leftSel.selectList, ...rightNewItems];

  // Build joined FROM clause
  if (!leftSel.from || !rightSel.from) {
    throw new Error('Cannot join expressions without FROM clauses');
  }

  const joinSpec: TableSpec = {
    kind: joinKind,
    left: leftSel.from.tableSpec,
    right: rightSel.from.tableSpec,
    on,
  };

  // Merge WHERE clauses
  let where: Predicate | undefined;
  if (leftSel.where && rightSel.where) {
    where = predAnd(leftSel.where, rightSel.where);
  } else {
    where = leftSel.where ?? rightSel.where;
  }

  return {
    kind: 'select',
    quantifier: leftSel.quantifier === 'distinct' || rightSel.quantifier === 'distinct'
      ? 'distinct' : 'all',
    selectList: mergedSelectList,
    from: { tableSpec: joinSpec },
    where,
  };
}

// ============================================================================
// processMerge — UNION / EXCEPT / INTERSECT
// ============================================================================

/**
 * Merge two SQL expressions with a set operation.
 */
export function processMerge(
  left: SqlExpr,
  right: SqlExpr,
  op: 'union' | 'except' | 'intersect',
  all: boolean,
  _builder: SqlBuilder
): SqlExpr {
  switch (op) {
    case 'union':
      return { kind: 'union', all, left, right };
    case 'except':
      return { kind: 'except', left, right };
    case 'intersect':
      return { kind: 'intersect', left, right };
  }
}
