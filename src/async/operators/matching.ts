import type { AsyncRelationOperand } from '../types';
import type { JoinKeys, Tuple } from '../../types';
import { normalizeKeys, matchKey } from '../../operators/_helpers';

/**
 * Semi-join: returns tuples from left that have a matching tuple in right.
 * Materializes right side first to build key set.
 */
export async function* matching<T, U>(
  left: AsyncRelationOperand<T>,
  right: AsyncRelationOperand<U>,
  keys?: JoinKeys
): AsyncIterable<Tuple> {
  // Materialize both sides to normalize keys (need sample tuples)
  const leftTuples: Tuple[] = [];
  const rightTuples: Tuple[] = [];

  for await (const tuple of left) {
    leftTuples.push(tuple as Tuple);
  }
  for await (const tuple of right) {
    rightTuples.push(tuple as Tuple);
  }

  const keyMap = normalizeKeys(keys, leftTuples, rightTuples);

  // Build right key set
  const rightKeys = new Set<string>();
  for (const tuple of rightTuples) {
    rightKeys.add(matchKey(tuple, keyMap, 'right'));
  }

  // Yield left tuples that match
  for (const tuple of leftTuples) {
    if (rightKeys.has(matchKey(tuple, keyMap, 'left'))) {
      yield tuple;
    }
  }
}
