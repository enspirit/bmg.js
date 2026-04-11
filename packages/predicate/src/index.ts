// Types
export type {
  Predicate,
  ScalarExpr,
  AttrRef,
  Literal,
  EqPredicate,
  NeqPredicate,
  LtPredicate,
  LtePredicate,
  GtPredicate,
  GtePredicate,
  ComparisonPredicate,
  InPredicate,
  AndPredicate,
  OrPredicate,
  NotPredicate,
  Tautology,
  Contradiction,
} from './types';

// Builder
export {
  Pred,
  attr,
  literal,
  eq,
  neq,
  lt,
  lte,
  gt,
  gte,
  isIn,
  and,
  or,
  not,
  tautology,
  contradiction,
  fromObject,
} from './builder';

// Evaluation
export { evaluate, toFunction } from './evaluate';

// SQL compilation
export { toSql, PostgresDialect, SqliteDialect } from './toSql';
export type { SqlDialect, CompiledSql } from './toSql';

// Type guards
export { isPredicate, isScalarExpr } from './guards';
