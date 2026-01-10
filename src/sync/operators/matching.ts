import { RelationOperand, JoinKeys, Tuple } from "../../types";
import { toOperationalOperand, normalizeKeys, matchKey } from "./_helpers";

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
