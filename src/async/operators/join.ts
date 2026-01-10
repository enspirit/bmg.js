import type { AsyncRelationOperand } from '../types';
import type { JoinKeys, Tuple, AttrName } from '../../types';
import { normalizeKeys, tuplesMatch, projectOutKeys } from '../../operators/_helpers';

const mergeTuples = (left: Tuple, right: Tuple, keyMap: Record<AttrName, AttrName>): Tuple => {
  return { ...left, ...projectOutKeys(right, keyMap) };
};

/**
 * Natural join: combines tuples from left and right where join keys match.
 * Materializes both sides (needed for key detection and nested loop join).
 */
export async function* join<T, U>(
  left: AsyncRelationOperand<T>,
  right: AsyncRelationOperand<U>,
  keys?: JoinKeys
): AsyncIterable<Tuple> {
  // Materialize both sides
  const leftTuples: Tuple[] = [];
  const rightTuples: Tuple[] = [];

  for await (const tuple of left) {
    leftTuples.push(tuple as Tuple);
  }
  for await (const tuple of right) {
    rightTuples.push(tuple as Tuple);
  }

  const keyMap = normalizeKeys(keys, leftTuples, rightTuples);

  // Nested loop join
  for (const leftTuple of leftTuples) {
    for (const rightTuple of rightTuples) {
      if (tuplesMatch(leftTuple, rightTuple, keyMap)) {
        yield mergeTuples(leftTuple, rightTuple, keyMap);
      }
    }
  }
}
