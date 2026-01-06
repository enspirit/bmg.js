import { RelationOperand, JoinKeys, Tuple, AttrName } from "../types";
import { toOperationalOperand, normalizeKeys, tuplesMatch, projectOutKeys } from "./_helpers";

const mergeTuples = (left: Tuple, right: Tuple, keyMap: Record<AttrName, AttrName>): Tuple => {
  return { ...left, ...projectOutKeys(right, keyMap) };
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
