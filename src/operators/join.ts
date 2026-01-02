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

const mergeTuples = (left: Tuple, right: Tuple, keyMap: Record<AttrName, AttrName>): Tuple => {
  const result = { ...left };
  const rightKeys = new Set(Object.values(keyMap));
  for (const [attr, value] of Object.entries(right)) {
    if (!rightKeys.has(attr)) {
      result[attr] = value;
    }
  }
  return result;
}

export const join = (left: RelationOperand, right: RelationOperand, keys?: JoinKeys): RelationOperand => {
  const opLeft = toOperationalOperand(left);
  const opRight = toOperationalOperand(right);
  const leftTuples = [...opLeft.tuples()];
  const rightTuples = [...opRight.tuples()];
  const keyMap = normalizeKeys(keys, leftTuples, rightTuples);
  const result: Tuple[] = [];

  for (const leftTuple of leftTuples) {
    for (const rightTuple of rightTuples) {
      if (tuplesMatch(leftTuple, rightTuple, keyMap)) {
        result.push(mergeTuples(leftTuple, rightTuple, keyMap));
      }
    }
  }

  return opLeft.output(result);
}
