import type { AsyncRelationOperand, AsyncOperationalOperand, AsyncRelation } from '../async-types';
import type { Tuple } from '../types';
import { tupleKey } from '../operators/_helpers';

/**
 * Type guard to check if a value implements AsyncRelation.
 */
export const isAsyncRelation = <T>(value: unknown): value is AsyncRelation<T> => {
  return (
    value !== null &&
    typeof value === 'object' &&
    'restrict' in value &&
    'project' in value &&
    'one' in value &&
    Symbol.asyncIterator in value
  );
};

/**
 * Converts an AsyncRelationOperand to an AsyncOperationalOperand
 * that provides a uniform interface for async iteration and output.
 */
export const toAsyncOperationalOperand = <T>(
  operand: AsyncRelationOperand<T>
): AsyncOperationalOperand<T> => {
  if (isAsyncRelation<T>(operand)) {
    return {
      tuples: () => operand,
      output: (tuples) => tuples,
    };
  } else if (Symbol.asyncIterator in operand) {
    return {
      tuples: () => operand as AsyncIterable<T>,
      output: (tuples) => tuples,
    };
  } else {
    throw new Error(`Unable to iterate ${operand}`);
  }
};

/**
 * Async generator that removes duplicate tuples.
 * Uses tupleKey() for equality comparison.
 */
export async function* deduplicateAsync<T>(
  source: AsyncIterable<T>
): AsyncGenerator<T> {
  const seen = new Set<string>();
  for await (const tuple of source) {
    const key = tupleKey(tuple as Tuple);
    if (!seen.has(key)) {
      seen.add(key);
      yield tuple;
    }
  }
}

export const error = (msg: string): never => {
  throw new Error(msg);
};
