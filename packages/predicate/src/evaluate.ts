/**
 * Evaluate a predicate against a JS object (tuple).
 */
import type { Predicate, ScalarExpr } from './types';

/** Resolve a scalar expression against a tuple */
function resolveScalar(expr: ScalarExpr, tuple: Record<string, unknown>): unknown {
  switch (expr.kind) {
    case 'attr':
      return tuple[expr.name];
    case 'literal':
      return expr.value;
  }
}

/** Evaluate a predicate against a tuple. Returns true if the tuple satisfies the predicate. */
export function evaluate(predicate: Predicate, tuple: Record<string, unknown>): boolean {
  switch (predicate.kind) {
    case 'eq': {
      const l = resolveScalar(predicate.left, tuple);
      const r = resolveScalar(predicate.right, tuple);
      return l === r;
    }
    case 'neq': {
      const l = resolveScalar(predicate.left, tuple);
      const r = resolveScalar(predicate.right, tuple);
      return l !== r;
    }
    case 'lt': {
      const l = resolveScalar(predicate.left, tuple) as number;
      const r = resolveScalar(predicate.right, tuple) as number;
      return l < r;
    }
    case 'lte': {
      const l = resolveScalar(predicate.left, tuple) as number;
      const r = resolveScalar(predicate.right, tuple) as number;
      return l <= r;
    }
    case 'gt': {
      const l = resolveScalar(predicate.left, tuple) as number;
      const r = resolveScalar(predicate.right, tuple) as number;
      return l > r;
    }
    case 'gte': {
      const l = resolveScalar(predicate.left, tuple) as number;
      const r = resolveScalar(predicate.right, tuple) as number;
      return l >= r;
    }
    case 'in': {
      const l = resolveScalar(predicate.left, tuple);
      return predicate.values.includes(l);
    }
    case 'match': {
      const l = resolveScalar(predicate.left, tuple);
      if (typeof l !== 'string') return false;
      if (predicate.caseSensitive === false) {
        return l.toUpperCase().includes(predicate.pattern.toUpperCase());
      }
      return l.includes(predicate.pattern);
    }
    case 'and':
      return predicate.operands.every(op => evaluate(op, tuple));
    case 'or':
      return predicate.operands.some(op => evaluate(op, tuple));
    case 'not':
      return !evaluate(predicate.operand, tuple);
    case 'tautology':
      return true;
    case 'contradiction':
      return false;
  }
}

/**
 * Convert a predicate to a JS filter function.
 * Useful for passing to Array.filter() or integrating with existing code.
 */
export function toFunction(predicate: Predicate): (tuple: Record<string, unknown>) => boolean {
  return (tuple) => evaluate(predicate, tuple);
}
