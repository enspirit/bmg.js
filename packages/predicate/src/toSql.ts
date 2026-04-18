/**
 * Compile a predicate to a parameterized SQL string.
 *
 * Returns { sql, params } where sql contains $1, $2, ... placeholders
 * and params is an array of values to bind.
 */
import type { Predicate, ScalarExpr } from './types';

export interface SqlDialect {
  /** Quote an identifier (table/column name) */
  quoteIdentifier(name: string): string;
  /** Parameter placeholder for the nth parameter (1-based) */
  paramPlaceholder(index: number): string;
}

export const PostgresDialect: SqlDialect = {
  quoteIdentifier: (name) => `"${name.replace(/"/g, '""')}"`,
  paramPlaceholder: (index) => `$${index}`,
};

export const SqliteDialect: SqlDialect = {
  quoteIdentifier: (name) => `"${name.replace(/"/g, '""')}"`,
  paramPlaceholder: (_index) => '?',
};

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

function compileScalar(expr: ScalarExpr, ctx: CompileContext): string {
  switch (expr.kind) {
    case 'attr':
      return ctx.dialect.quoteIdentifier(expr.name);
    case 'literal':
      return addParam(ctx, expr.value);
  }
}

const COMPARISON_OPS: Record<string, string> = {
  eq: '=',
  neq: '<>',
  lt: '<',
  lte: '<=',
  gt: '>',
  gte: '>=',
};

function compilePredicate(predicate: Predicate, ctx: CompileContext): string {
  switch (predicate.kind) {
    case 'eq':
    case 'neq':
    case 'lt':
    case 'lte':
    case 'gt':
    case 'gte': {
      // Special case: eq/neq with NULL
      if (predicate.right.kind === 'literal' && predicate.right.value === null) {
        const left = compileScalar(predicate.left, ctx);
        return predicate.kind === 'eq'
          ? `${left} IS NULL`
          : `${left} IS NOT NULL`;
      }
      if (predicate.left.kind === 'literal' && predicate.left.value === null) {
        const right = compileScalar(predicate.right, ctx);
        return predicate.kind === 'eq'
          ? `${right} IS NULL`
          : `${right} IS NOT NULL`;
      }
      const left = compileScalar(predicate.left, ctx);
      const right = compileScalar(predicate.right, ctx);
      return `${left} ${COMPARISON_OPS[predicate.kind]} ${right}`;
    }

    case 'in': {
      const left = compileScalar(predicate.left, ctx);
      if (predicate.values.length === 0) {
        return '1 = 0'; // contradiction
      }
      // SQL `IN (NULL, ...)` does not match NULL rows (NULL IN NULL is
      // UNKNOWN). Split null out: `(col IS NULL OR col IN (non-nulls))`.
      // Parens are necessary because the result is an implicit OR that
      // must bind correctly inside AND / NOT. Stable partition preserves
      // original ordering of non-null values.
      const hasNull = predicate.values.some(v => v === null);
      const nonNulls = predicate.values.filter(v => v !== null);
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
      if (predicate.operands.length === 0) return '1 = 1';
      if (predicate.operands.length === 1) return compilePredicate(predicate.operands[0], ctx);
      const parts = predicate.operands.map(op => {
        const sql = compilePredicate(op, ctx);
        // Parenthesize OR sub-expressions inside AND
        return op.kind === 'or' ? `(${sql})` : sql;
      });
      return parts.join(' AND ');
    }

    case 'or': {
      if (predicate.operands.length === 0) return '1 = 0';
      if (predicate.operands.length === 1) return compilePredicate(predicate.operands[0], ctx);
      const parts = predicate.operands.map(op => {
        const sql = compilePredicate(op, ctx);
        // Parenthesize AND sub-expressions inside OR
        return op.kind === 'and' ? `(${sql})` : sql;
      });
      return parts.join(' OR ');
    }

    case 'not': {
      const inner = compilePredicate(predicate.operand, ctx);
      // Parenthesize compound expressions
      const needsParens = predicate.operand.kind === 'and' || predicate.operand.kind === 'or';
      return needsParens ? `NOT (${inner})` : `NOT ${inner}`;
    }

    case 'tautology':
      return '1 = 1';

    case 'contradiction':
      return '1 = 0';
  }
}

/**
 * Compile a predicate to a parameterized SQL expression.
 *
 * @param predicate - The predicate AST to compile
 * @param dialect - The SQL dialect to use (defaults to Postgres)
 * @returns An object with `sql` (the SQL string with placeholders) and `params` (the values)
 */
export function toSql(predicate: Predicate, dialect: SqlDialect = PostgresDialect): CompiledSql {
  const ctx: CompileContext = { dialect, params: [] };
  const sql = compilePredicate(predicate, ctx);
  return { sql, params: ctx.params };
}
