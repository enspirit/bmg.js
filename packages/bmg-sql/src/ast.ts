/**
 * SQL AST types as TypeScript discriminated unions.
 *
 * Mirrors the Ruby bmg SQL grammar (grammar.sexp.yml) but using
 * typed interfaces instead of S-expressions.
 */
import type { Predicate } from '@enspirit/predicate';

// ============================================================================
// Top-level query expression
// ============================================================================

/** A complete SQL query: SELECT, set operations, or WITH */
export type SqlExpr =
  | SelectExpr
  | UnionExpr
  | ExceptExpr
  | IntersectExpr;

// ============================================================================
// SELECT expression
// ============================================================================

export interface SelectExpr {
  kind: 'select';
  quantifier: 'all' | 'distinct';
  selectList: SelectItem[];
  from?: FromClause;
  where?: Predicate;
  groupBy?: ColumnRef[];
  orderBy?: OrderByTerm[];
  limit?: number;
  offset?: number;
}

// ============================================================================
// Select list items
// ============================================================================

export interface SelectItem {
  expr: ScalarExpr;
  alias: string;
}

/** Scalar expression in a select list or elsewhere */
export type ScalarExpr =
  | ColumnRef
  | SqlLiteral
  | AggregateExpr
  | FuncCallExpr
  | StarExpr;

/** Reference to a qualified column: qualifier.column */
export interface ColumnRef {
  kind: 'column_ref';
  qualifier: string;   // table alias (e.g., 't1')
  column: string;      // column name
}

/** A literal value embedded in the query */
export interface SqlLiteral {
  kind: 'sql_literal';
  value: unknown;
}

/** Aggregate function: COUNT, SUM, AVG, MIN, MAX */
export interface AggregateExpr {
  kind: 'aggregate';
  func: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct_count';
  expr?: ScalarExpr;  // absent for COUNT(*)
}

/** General function call */
export interface FuncCallExpr {
  kind: 'func_call';
  func: string;
  args: ScalarExpr[];
}

/** Qualifier.* (select all columns from a table) */
export interface StarExpr {
  kind: 'star';
  qualifier: string;
}

// ============================================================================
// FROM clause
// ============================================================================

export interface FromClause {
  tableSpec: TableSpec;
}

/** What can appear in a FROM clause */
export type TableSpec =
  | TableRef
  | SubqueryRef
  | InnerJoin
  | LeftJoin
  | CrossJoin;

/** A simple table reference: table_name AS alias */
export interface TableRef {
  kind: 'table_ref';
  table: string;
  alias: string;
}

/** A subquery with an alias */
export interface SubqueryRef {
  kind: 'subquery_ref';
  subquery: SqlExpr;
  alias: string;
}

// ============================================================================
// Join expressions
// ============================================================================

export interface InnerJoin {
  kind: 'inner_join';
  left: TableSpec;
  right: TableSpec;
  on: Predicate;
}

export interface LeftJoin {
  kind: 'left_join';
  left: TableSpec;
  right: TableSpec;
  on: Predicate;
}

export interface CrossJoin {
  kind: 'cross_join';
  left: TableSpec;
  right: TableSpec;
}

// ============================================================================
// Set operations
// ============================================================================

export interface UnionExpr {
  kind: 'union';
  all: boolean;
  left: SqlExpr;
  right: SqlExpr;
}

export interface ExceptExpr {
  kind: 'except';
  left: SqlExpr;
  right: SqlExpr;
}

export interface IntersectExpr {
  kind: 'intersect';
  left: SqlExpr;
  right: SqlExpr;
}

// ============================================================================
// ORDER BY
// ============================================================================

export interface OrderByTerm {
  expr: ColumnRef;
  direction: 'asc' | 'desc';
}
