import { RelationOperand, Tuple } from "../../types";
import { toOperationalOperand, tupleKey } from "./_helpers";

export const union = (left: RelationOperand, right: RelationOperand): RelationOperand => {
  const opLeft = toOperationalOperand(left);
  const opRight = toOperationalOperand(right);
  const seen = new Set<string>();
  const result: Tuple[] = [];

  for (const tuple of opLeft.tuples()) {
    const key = tupleKey(tuple);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(tuple);
    }
  }

  for (const tuple of opRight.tuples()) {
    const key = tupleKey(tuple);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(tuple);
    }
  }

  return opLeft.output(result);
}
