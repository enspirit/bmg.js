import { RelationOperand, Tuple, UnionOptions } from "../../types";
import { toOperationalOperand, tupleKey } from "./_helpers";

export const union = (
  left: RelationOperand,
  right: RelationOperand,
  options?: UnionOptions,
): RelationOperand => {
  const opLeft = toOperationalOperand(left);
  const opRight = toOperationalOperand(right);
  const result: Tuple[] = [];

  if (options?.all) {
    // UNION ALL: concatenate without deduplication. Caller is
    // responsible for the relation invariant.
    for (const tuple of opLeft.tuples()) result.push(tuple);
    for (const tuple of opRight.tuples()) result.push(tuple);
    return opLeft.output(result);
  }

  const seen = new Set<string>();

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
