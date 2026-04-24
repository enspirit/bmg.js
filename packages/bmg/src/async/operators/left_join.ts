import type { AsyncRelationOperand } from '../types';
import type { JoinKeys, Tuple, AttrName } from '../../types';
import { normalizeKeys, tuplesMatch } from '../../sync/operators/_helpers';

const getRightAttrs = (rightTuples: Tuple[], keyMap: Record<AttrName, AttrName>): AttrName[] => {
  if (rightTuples.length === 0) return [];
  const rightKeys = new Set(Object.values(keyMap));
  return Object.keys(rightTuples[0]).filter(attr => !rightKeys.has(attr));
};

const mergeTuples = (
  left: Tuple,
  right: Tuple | null,
  rightAttrs: AttrName[],
  defaults?: Record<AttrName, unknown>,
): Tuple => {
  const result = { ...left };
  for (const attr of rightAttrs) {
    const v = right ? right[attr] : null;
    if ((v === null || v === undefined) && defaults && attr in defaults) {
      result[attr] = defaults[attr];
    } else {
      result[attr] = v;
    }
  }
  return result;
};

/**
 * Left outer join: combines tuples, keeping all left tuples.
 * Non-matching left tuples have null for right attributes, unless a
 * `defaults` map provides a substitute (matches the LEFT JOIN +
 * COALESCE semantics). Materializes both sides.
 */
export async function* left_join<T, U>(
  left: AsyncRelationOperand<T>,
  right: AsyncRelationOperand<U>,
  keys?: JoinKeys,
  defaults?: Record<AttrName, unknown>,
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
  const defaultAttrs = defaults ? Object.keys(defaults) : [];
  const effectiveRightAttrs = Array.from(new Set([...rightAttrs, ...defaultAttrs]));

  for (const leftTuple of leftTuples) {
    let matched = false;
    for (const rightTuple of rightTuples) {
      if (tuplesMatch(leftTuple, rightTuple, keyMap)) {
        yield mergeTuples(leftTuple, rightTuple, effectiveRightAttrs, defaults);
        matched = true;
      }
    }
    if (!matched) {
      yield mergeTuples(leftTuple, null, effectiveRightAttrs, defaults);
    }
  }
}
