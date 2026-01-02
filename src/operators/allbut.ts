import { RelationOperand, AttrName, Tuple } from "../types";
import { toOperationalOperand } from "./_helpers";

export const allbut = (operand: RelationOperand, attrs: AttrName[]): RelationOperand => {
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  const excluded = new Set(attrs);
  const result: Tuple[] = [];
  for (const tuple of iterable) {
    const projected = Object.keys(tuple).reduce((memo, attr) => {
      if (!excluded.has(attr)) {
        memo[attr] = tuple[attr];
      }
      return memo;
    }, {} as Tuple);
    result.push(projected);
  }
  return op.output(result);
}
