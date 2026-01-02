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

const matchKey = (tuple: Tuple, keyMap: Record<AttrName, AttrName>, side: 'left' | 'right'): string => {
  const attrs = side === 'left' ? Object.keys(keyMap) : Object.values(keyMap);
  const values = attrs.map(attr => JSON.stringify(tuple[attr]));
  return values.join('|');
}

export const matching = (left: RelationOperand, right: RelationOperand, keys?: JoinKeys): RelationOperand => {
  const opLeft = toOperationalOperand(left);
  const opRight = toOperationalOperand(right);
  const leftTuples = [...opLeft.tuples()];
  const rightTuples = [...opRight.tuples()];
  const keyMap = normalizeKeys(keys, leftTuples, rightTuples);

  const rightKeys = new Set<string>();
  for (const tuple of rightTuples) {
    rightKeys.add(matchKey(tuple, keyMap, 'right'));
  }

  const result: Tuple[] = [];
  for (const tuple of leftTuples) {
    if (rightKeys.has(matchKey(tuple, keyMap, 'left'))) {
      result.push(tuple);
    }
  }

  return opLeft.output(result);
}
