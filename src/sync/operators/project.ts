import { RelationOperand, AttrName, Tuple } from "../../types";
import { toOperationalOperand, deduplicate } from "./_helpers";

export const project = (operand: RelationOperand, attrs: AttrName[]): RelationOperand => {
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  const result: Tuple[] = [];
  for (const tuple of iterable) {
    const projected = attrs.reduce((memo, attr) => {
      if (attr in tuple) {
        memo[attr] = tuple[attr];
      }
      return memo;
    }, {} as Tuple);
    result.push(projected);
  }
  return op.output(deduplicate(result));
}
