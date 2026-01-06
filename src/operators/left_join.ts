import { RelationOperand, JoinKeys, Tuple, AttrName } from "../types";
import { toOperationalOperand, normalizeKeys, tuplesMatch } from "./_helpers";

const getRightAttrs = (rightTuples: Tuple[], keyMap: Record<AttrName, AttrName>): AttrName[] => {
  if (rightTuples.length === 0) return [];
  const rightKeys = new Set(Object.values(keyMap));
  return Object.keys(rightTuples[0]).filter(attr => !rightKeys.has(attr));
}

const mergeTuples = (left: Tuple, right: Tuple | null, rightAttrs: AttrName[]): Tuple => {
  const result = { ...left };
  for (const attr of rightAttrs) {
    result[attr] = right ? right[attr] : null;
  }
  return result;
}

export const left_join = (left: RelationOperand, right: RelationOperand, keys?: JoinKeys): RelationOperand => {
  const opLeft = toOperationalOperand(left);
  const opRight = toOperationalOperand(right);
  const leftTuples = [...opLeft.tuples()];
  const rightTuples = [...opRight.tuples()];
  const keyMap = normalizeKeys(keys, leftTuples, rightTuples);
  const rightAttrs = getRightAttrs(rightTuples, keyMap);
  const result: Tuple[] = [];

  for (const leftTuple of leftTuples) {
    let matched = false;
    for (const rightTuple of rightTuples) {
      if (tuplesMatch(leftTuple, rightTuple, keyMap)) {
        result.push(mergeTuples(leftTuple, rightTuple, rightAttrs));
        matched = true;
      }
    }
    if (!matched) {
      result.push(mergeTuples(leftTuple, null, rightAttrs));
    }
  }

  return opLeft.output(result);
}
