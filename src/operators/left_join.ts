import { RelationOperand, JoinKeys, Tuple, AttrName } from "../types";
import { toOperationalOperand } from "./_helpers";

const getCommonAttrs = (left: Tuple[], right: Tuple[]): AttrName[] => {
  if (left.length === 0 || right.length === 0) return [];
  const leftAttrs = new Set(Object.keys(left[0]));
  const rightAttrs = Object.keys(right[0]);
  return rightAttrs.filter(attr => leftAttrs.has(attr));
}

const normalizeKeys = (keys: JoinKeys | undefined, leftTuples: Tuple[], rightTuples: Tuple[]): Record<AttrName, AttrName> => {
  if (!keys) {
    const common = getCommonAttrs(leftTuples, rightTuples);
    return common.reduce((acc, attr) => {
      acc[attr] = attr;
      return acc;
    }, {} as Record<AttrName, AttrName>);
  }
  if (Array.isArray(keys)) {
    return keys.reduce((acc, attr) => {
      acc[attr] = attr;
      return acc;
    }, {} as Record<AttrName, AttrName>);
  }
  return keys;
}

const tuplesMatch = (left: Tuple, right: Tuple, keyMap: Record<AttrName, AttrName>): boolean => {
  for (const [leftAttr, rightAttr] of Object.entries(keyMap)) {
    if (left[leftAttr] !== right[rightAttr]) return false;
  }
  return true;
}

const getRightAttrs = (rightTuples: Tuple[], keyMap: Record<AttrName, AttrName>): AttrName[] => {
  if (rightTuples.length === 0) return [];
  const rightKeys = new Set(Object.values(keyMap));
  return Object.keys(rightTuples[0]).filter(attr => !rightKeys.has(attr));
}

const mergeTuples = (left: Tuple, right: Tuple | null, rightAttrs: AttrName[], keyMap: Record<AttrName, AttrName>): Tuple => {
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
        result.push(mergeTuples(leftTuple, rightTuple, rightAttrs, keyMap));
        matched = true;
      }
    }
    if (!matched) {
      result.push(mergeTuples(leftTuple, null, rightAttrs, keyMap));
    }
  }

  return opLeft.output(result);
}
