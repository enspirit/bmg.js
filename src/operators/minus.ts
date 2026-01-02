import { RelationOperand, Tuple } from "../types";
import { toOperationalOperand, tupleKey } from "./_helpers";

export const minus = (left: RelationOperand, right: RelationOperand): RelationOperand => {
  const opLeft = toOperationalOperand(left);
  const opRight = toOperationalOperand(right);

  const rightKeys = new Set<string>();
  for (const tuple of opRight.tuples()) {
    rightKeys.add(tupleKey(tuple));
  }

  const seen = new Set<string>();
  const result: Tuple[] = [];
  for (const tuple of opLeft.tuples()) {
    const key = tupleKey(tuple);
    if (!rightKeys.has(key) && !seen.has(key)) {
      seen.add(key);
      result.push(tuple);
    }
  }

  return opLeft.output(result);
}
