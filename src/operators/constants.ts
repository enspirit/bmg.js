import { RelationOperand, Tuple } from "../types";
import { toOperationalOperand } from "./_helpers";

export const constants = (operand: RelationOperand, consts: Tuple): RelationOperand => {
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  const result: Tuple[] = [];
  for (const tuple of iterable) {
    result.push({ ...tuple, ...consts });
  }
  return op.output(result)
}
