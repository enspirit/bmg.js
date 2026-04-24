import { RelationOperand, JoinKeys, Tuple, AttrName } from "../../types";
import { toOperationalOperand, normalizeKeys, tuplesMatch } from "./_helpers";

const getRightAttrs = (rightTuples: Tuple[], keyMap: Record<AttrName, AttrName>): AttrName[] => {
  if (rightTuples.length === 0) return [];
  const rightKeys = new Set(Object.values(keyMap));
  return Object.keys(rightTuples[0]).filter(attr => !rightKeys.has(attr));
}

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
}

export const left_join = (
  left: RelationOperand,
  right: RelationOperand,
  keys?: JoinKeys,
  defaults?: Record<AttrName, unknown>,
): RelationOperand => {
  const opLeft = toOperationalOperand(left);
  const opRight = toOperationalOperand(right);
  const leftTuples = [...opLeft.tuples()];
  const rightTuples = [...opRight.tuples()];
  const keyMap = normalizeKeys(keys, leftTuples, rightTuples);
  const rightAttrs = getRightAttrs(rightTuples, keyMap);
  // When there are no right tuples, rightAttrs is empty — but if defaults
  // include attrs, we still need to add them (as every tuple is unmatched).
  const defaultAttrs = defaults ? Object.keys(defaults) : [];
  const effectiveRightAttrs = Array.from(new Set([...rightAttrs, ...defaultAttrs]));
  const result: Tuple[] = [];

  for (const leftTuple of leftTuples) {
    let matched = false;
    for (const rightTuple of rightTuples) {
      if (tuplesMatch(leftTuple, rightTuple, keyMap)) {
        result.push(mergeTuples(leftTuple, rightTuple, effectiveRightAttrs, defaults));
        matched = true;
      }
    }
    if (!matched) {
      result.push(mergeTuples(leftTuple, null, effectiveRightAttrs, defaults));
    }
  }

  return opLeft.output(result);
}
