import { RelationOperand, Extension, Tuple } from "../../types";
import { toOperationalOperand } from "./_helpers";

export const extend = (operand: RelationOperand, extension: Extension): RelationOperand => {
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  const result: Tuple[] = [];
  for (const tuple of iterable) {
    const extended = { ...tuple };
    for (const [attr, spec] of Object.entries(extension)) {
      if (typeof spec === 'function') {
        extended[attr] = spec(tuple);
      } else {
        extended[attr] = tuple[spec];
      }
    }
    result.push(extended);
  }
  return op.output(result);
}
