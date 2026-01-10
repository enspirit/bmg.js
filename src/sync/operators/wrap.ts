import { RelationOperand, AttrName, Tuple } from "../../types";
import { toOperationalOperand } from "./_helpers";

export const wrap = (operand: RelationOperand, attrs: AttrName[], as: AttrName): RelationOperand => {
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  const wrappedSet = new Set(attrs);
  const result: Tuple[] = [];

  for (const tuple of iterable) {
    const wrapped: Tuple = {};
    const remaining: Tuple = {};

    for (const [key, value] of Object.entries(tuple)) {
      if (wrappedSet.has(key)) {
        wrapped[key] = value;
      } else {
        remaining[key] = value;
      }
    }

    result.push({
      ...remaining,
      [as]: wrapped
    });
  }

  return op.output(result);
}
