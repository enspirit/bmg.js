import { RelationOperand, Tuple } from "../types";
import { toOperationalOperand } from "./_helpers";

const tupleKey = (tuple: Tuple): string => {
  return JSON.stringify(Object.entries(tuple).sort(([a], [b]) => a.localeCompare(b)));
}

export const minus = (left: RelationOperand, right: RelationOperand): RelationOperand => {
  const opLeft = toOperationalOperand(left);
  const opRight = toOperationalOperand(right);

  const rightKeys = new Set<string>();
  for (const tuple of opRight.tuples()) {
    rightKeys.add(tupleKey(tuple));
  }

  const result: Tuple[] = [];
  for (const tuple of opLeft.tuples()) {
    if (!rightKeys.has(tupleKey(tuple))) {
      result.push(tuple);
    }
  }

  return opLeft.output(result);
}
