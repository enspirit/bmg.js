import { AttrName, RelationOperand, Tuple } from "../types";
import { toOperationalOperand } from "./_helpers";

export const yByX = (operand: RelationOperand, y: AttrName, x: AttrName): Tuple => {
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  const hash = {};
  for (const tuple of iterable) {
    hash[`${tuple[x]}`] = tuple[y];
  }
  return hash;
}
