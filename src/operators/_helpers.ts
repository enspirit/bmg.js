import { OperationalOperand, Relation, RelationOperand, Renaming, RenamingFunc, Tuple } from "@/types";
import { MemoryRelation } from '@/Relation';
import { isRelation } from "./isRelation";

export const toOperationalOperand = <T>(operand: RelationOperand<T>): OperationalOperand<T> => {
  if (Array.isArray(operand)) {
    return {
      tuples: () => operand,
      output: (tuples) => tuples,
    };
  } else if (isRelation(operand)) {
    return {
      tuples: () => (operand as Relation<T>).toArray(),
      output: (tuples: Tuple<T>[]) => new MemoryRelation<T>(tuples),
    };
  } else {
    throw `Unable to iterate ${operand}`
  }
}

export const toRenamingFunc = <T, R extends Renaming<T>>(renaming: R): RenamingFunc<T> => {
  if (typeof(renaming) === 'function') {
    return renaming;
  } else {
    return (attr: keyof R) => renaming[attr] || attr;
  }
}

export const error = (msg: string) => {
  throw(msg);
}
