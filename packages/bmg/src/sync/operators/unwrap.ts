import { RelationOperand, AttrName, Tuple } from "../../types";
import { toOperationalOperand } from "./_helpers";

export const unwrap = (operand: RelationOperand, attr: AttrName): RelationOperand => {
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  const result: Tuple[] = [];

  for (const tuple of iterable) {
    const wrapped = tuple[attr] as Tuple;
    if (typeof wrapped !== 'object' || wrapped === null || Array.isArray(wrapped)) {
      throw new Error(`Attribute '${attr}' is not a tuple (object)`);
    }

    const unwrapped: Tuple = {};
    for (const [key, value] of Object.entries(tuple)) {
      if (key !== attr) {
        unwrapped[key] = value;
      }
    }

    result.push({
      ...unwrapped,
      ...wrapped
    });
  }

  return op.output(result);
}
