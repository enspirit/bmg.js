import { AttrName, RelationOperand, Tuple } from "../types";
import { toOperationalOperand } from "./_helpers";

export const yByX = <T>(operand: RelationOperand<T>, y: AttrName<T>, x: AttrName<T>): Tuple<T> => {
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  const hash = {};
  for (const tuple of iterable) {
    hash[`${tuple[x]}`] = tuple[y];
  }
  return hash;
}
