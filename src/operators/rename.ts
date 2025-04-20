import { RelationOperand, RenamedTuple, Renaming } from "../types";
import { toOperationalOperand, toRenamingFunc } from "./_helpers";

export const rename = <T, R extends Renaming<T>>(operand: RelationOperand<T>, renaming: R): RelationOperand<T> => {
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  const renamingFunc = toRenamingFunc(renaming)
  const result: RenamedTuple<T, R>[] = [];
  for (const tuple of iterable) {
    const renamed: RenamedTuple<T, R> = Object.keys(tuple)
      .reduce((memo, attr) => {
        memo[renamingFunc(attr)] = tuple[attr];
        return memo;
      }, {} as RenamedTuple<T, R>)
    result.push(renamed);
  }
  return op.output(result)
}
