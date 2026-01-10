import type { AsyncRelationOperand } from '../types';
import type { JoinKeys, Tuple, AttrName } from '../../types';
import { normalizeKeys, tuplesMatch } from '../../sync/operators/_helpers';

const getRightAttrs = (rightTuples: Tuple[], keyMap: Record<AttrName, AttrName>): AttrName[] => {
  if (rightTuples.length === 0) return [];
  const rightKeys = new Set(Object.values(keyMap));
  return Object.keys(rightTuples[0]).filter(attr => !rightKeys.has(attr));
};

const mergeTuples = (left: Tuple, right: Tuple | null, rightAttrs: AttrName[]): Tuple => {
  const result = { ...left };
  for (const attr of rightAttrs) {
    result[attr] = right ? right[attr] : null;
  }
  return result;
};

/**
 * Left outer join: combines tuples, keeping all left tuples.
 * Non-matching left tuples have null for right attributes.
 * Materializes both sides.
 */
export async function* left_join<T, U>(
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
  const rightAttrs = getRightAttrs(rightTuples, keyMap);

  for (const leftTuple of leftTuples) {
    let matched = false;
    for (const rightTuple of rightTuples) {
      if (tuplesMatch(leftTuple, rightTuple, keyMap)) {
        yield mergeTuples(leftTuple, rightTuple, rightAttrs);
        matched = true;
      }
    }
    if (!matched) {
      yield mergeTuples(leftTuple, null, rightAttrs);
    }
  }
}
