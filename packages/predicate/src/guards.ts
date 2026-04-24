/**
 * Type guards for predicate AST nodes.
 */
import type { Predicate, ScalarExpr } from './types';

const PREDICATE_KINDS = new Set([
  'eq', 'neq', 'lt', 'lte', 'gt', 'gte',
  'in', 'match', 'and', 'or', 'not',
  'tautology', 'contradiction',
]);

/** Check if a value is a predicate AST node */
export function isPredicate(value: unknown): value is Predicate {
  if (typeof value !== 'object' || value === null) return false;
  return PREDICATE_KINDS.has((value as { kind?: string }).kind ?? '');
}

const SCALAR_KINDS = new Set(['attr', 'literal']);

/** Check if a value is a scalar expression AST node */
export function isScalarExpr(value: unknown): value is ScalarExpr {
  if (typeof value !== 'object' || value === null) return false;
  return SCALAR_KINDS.has((value as { kind?: string }).kind ?? '');
}
