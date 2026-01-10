import type { AsyncRelationOperand } from '../types';
import type { Predicate } from '../../types';
import { toPredicateFunc } from '../../support/toPredicateFunc';
import { toAsyncOperationalOperand } from './_helpers';

/**
 * Async generator that filters tuples based on a predicate.
 */
async function* restrictGen<T>(
  source: AsyncIterable<T>,
  predicate: (t: T) => boolean
): AsyncGenerator<T> {
  for await (const tuple of source) {
    if (predicate(tuple)) {
      yield tuple;
    }
  }
}

/**
 * Filters tuples that match the predicate.
 */
export const restrict = <T>(
  operand: AsyncRelationOperand<T>,
  p: Predicate
): AsyncIterable<T> => {
  const op = toAsyncOperationalOperand(operand);
  const f = toPredicateFunc(p) as (t: T) => boolean;
  return restrictGen(op.tuples(), f);
};

/**
 * Alias for restrict.
 */
export const where = restrict;

/**
 * Async generator that excludes tuples based on a predicate.
 */
async function* excludeGen<T>(
  source: AsyncIterable<T>,
  predicate: (t: T) => boolean
): AsyncGenerator<T> {
  for await (const tuple of source) {
    if (!predicate(tuple)) {
      yield tuple;
    }
  }
}

/**
 * Filters tuples that do NOT match the predicate.
 */
export const exclude = <T>(
  operand: AsyncRelationOperand<T>,
  p: Predicate
): AsyncIterable<T> => {
  const op = toAsyncOperationalOperand(operand);
  const f = toPredicateFunc(p) as (t: T) => boolean;
  return excludeGen(op.tuples(), f);
};
