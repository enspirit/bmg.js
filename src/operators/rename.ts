import { RelationOperand, Renaming, Tuple } from "../types";
import { toOperationalOperand, toRenamingFunc } from "./_helpers";

export const rename = (operand: RelationOperand, renaming: Renaming): RelationOperand => {
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  const renamingFunc = toRenamingFunc(renaming)
  const result: Tuple[] = [];
  for (const tuple of iterable) {
    const renamed = Object.keys(tuple).reduce((memo, attr) => {
      memo[renamingFunc(attr)] = tuple[attr];
      return memo;
    }, {})
    result.push(renamed);
  }
  return op.output(result)
}
