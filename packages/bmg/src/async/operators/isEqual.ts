import type { AsyncRelationOperand } from '../types';
import type { Tuple } from '../../types';
import { toAsyncOperationalOperand } from './_helpers';
import { tupleKey } from '../../sync/operators/_helpers';

/**
 * Compares two async relations for equality.
 * Two relations are equal if they contain the exact same set of tuples.
 * Terminal operation - returns a Promise.
 */
export const isEqual = async <T, U>(
  left: AsyncRelationOperand<T>,
  right: AsyncRelationOperand<U>
): Promise<boolean> => {
  const opLeft = toAsyncOperationalOperand(left);
  const opRight = toAsyncOperationalOperand(right);

  const leftKeys = new Set<string>();
  for await (const tuple of opLeft.tuples()) {
    leftKeys.add(tupleKey(tuple as Tuple));
  }

  const rightKeys = new Set<string>();
  for await (const tuple of opRight.tuples()) {
    rightKeys.add(tupleKey(tuple as Tuple));
  }

  if (leftKeys.size !== rightKeys.size) {
    return false;
  }

  for (const key of leftKeys) {
    if (!rightKeys.has(key)) {
      return false;
    }
  }

  return true;
};
