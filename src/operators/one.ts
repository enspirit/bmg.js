import { RelationOperand, Tuple } from "../types";
import { toOperationalOperand, error } from "./_helpers";

export const one = (operand: RelationOperand): Tuple => {
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  let tuple;
  for (const t of iterable) {
    if (tuple) {
      return error('More than one tuple found');
    } else {
      tuple = t;
    }
  }
  if (tuple) return tuple;
  return error('Relation is empty');
}
