import { RelationOperand, Renaming, Tuple } from "../types";
import { toOperationalOperand, toRenamingFunc } from "./_helpers";

export const rename = <T, R extends Renaming<T>>(operand: RelationOperand<T>, renaming: R): RelationOperand<T> => {
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  const renamingFunc = toRenamingFunc(renaming)
  const result: Tuple<T>[] = [];
  for (const tuple of iterable) {
    const renamed: Tuple<T> = Object.keys(tuple)
      .reduce((memo, attr) => {
        memo[renamingFunc(attr)] = tuple[attr];
        return memo;
      }, {} as Tuple<T>)
    result.push(renamed);
  }
  return op.output(result)
}
