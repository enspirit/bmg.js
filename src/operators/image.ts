import { RelationOperand, JoinKeys, Tuple, AttrName } from "../types";
import { toOperationalOperand, normalizeKeys, tuplesMatch, projectOutKeys } from "./_helpers";
import { MemoryRelation } from "@/Relation";

export const image = (left: RelationOperand, right: RelationOperand, as: AttrName, keys?: JoinKeys): RelationOperand => {
  const opLeft = toOperationalOperand(left);
  const opRight = toOperationalOperand(right);
  const leftTuples = [...opLeft.tuples()];
  const rightTuples = [...opRight.tuples()];
  const keyMap = normalizeKeys(keys, leftTuples, rightTuples);
  const result: Tuple[] = [];

  for (const leftTuple of leftTuples) {
    const matches: Tuple[] = [];
    for (const rightTuple of rightTuples) {
      if (tuplesMatch(leftTuple, rightTuple, keyMap)) {
        matches.push(projectOutKeys(rightTuple, keyMap));
      }
    }
    result.push({
      ...leftTuple,
      [as]: new MemoryRelation(matches)
    });
  }

  return opLeft.output(result);
}
