import type { AsyncRelationOperand } from '../types';
import type { JoinKeys, Tuple, AttrName } from '../../types';
import { normalizeKeys, tuplesMatch, projectOutKeys } from '../../sync/operators/_helpers';
import { MemoryRelation } from '../../sync/Relation';

/**
 * Adds a relation-valued attribute with matching tuples from right.
 * Each left tuple gets a nested relation of matching right tuples.
 * Materializes both sides.
 */
export async function* image<T, U>(
  left: AsyncRelationOperand<T>,
  right: AsyncRelationOperand<U>,
  as: AttrName,
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

  for (const leftTuple of leftTuples) {
    const matches: Tuple[] = [];
    for (const rightTuple of rightTuples) {
      if (tuplesMatch(leftTuple, rightTuple, keyMap)) {
        matches.push(projectOutKeys(rightTuple, keyMap));
      }
    }
    yield {
      ...leftTuple,
      [as]: new MemoryRelation(matches)
    };
  }
}
