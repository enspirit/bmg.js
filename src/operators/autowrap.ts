import { AutowrapOptions, RelationOperand, Tuple } from "../types";
import { toOperationalOperand, deduplicate } from "./_helpers";

export const autowrap = (operand: RelationOperand, options?: AutowrapOptions): RelationOperand => {
  const sep = options?.separator ?? '_';
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  const result: Tuple[] = [];

  for (const tuple of iterable) {
    const wrapped: Tuple = {};
    for (const [attr, value] of Object.entries(tuple)) {
      const parts = attr.split(sep);
      if (parts.length === 1) {
        wrapped[attr] = value;
      } else {
        const [prefix, ...rest] = parts;
        wrapped[prefix] = wrapped[prefix] ?? {};
        (wrapped[prefix] as Tuple)[rest.join(sep)] = value;
      }
    }
    result.push(wrapped);
  }

  return op.output(deduplicate(result));
}
