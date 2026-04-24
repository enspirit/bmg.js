import type { AsyncRelationOperand } from '../types';
import type { Tuple } from '../../types';
import { tupleKey } from '../../sync/operators/_helpers';

/**
 * Set difference: returns tuples in left but not in right.
 * Materializes right side first, then streams left.
 */
export async function* minus<T>(
  left: AsyncRelationOperand<T>,
  right: AsyncRelationOperand<T>
): AsyncIterable<Tuple> {
  // Materialize right side into a set of keys
  const rightKeys = new Set<string>();
  for await (const tuple of right) {
    rightKeys.add(tupleKey(tuple as Tuple));
  }

  // Stream left, filtering out tuples present in right
  const seen = new Set<string>();
  for await (const tuple of left) {
    const key = tupleKey(tuple as Tuple);
    if (!rightKeys.has(key) && !seen.has(key)) {
      seen.add(key);
      yield tuple as Tuple;
    }
  }
}
