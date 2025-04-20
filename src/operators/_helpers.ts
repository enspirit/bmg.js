import { OperationalOperand, Relation, RelationOperand } from "@/types";
import { MemoryRelation } from '@/Relation';
import { isRelation } from "./isRelation";

export const toOperationalOperand = (operand: RelationOperand): OperationalOperand => {
  if (Array.isArray(operand)) {
    return {
      tuples: () => operand,
      output: (tuples) => tuples,
    };
  } else if (isRelation(operand)) {
    return {
      tuples: () => (operand as Relation).toArray(),
      output: (tuples) => new MemoryRelation(tuples),
    };
  } else {
    throw `Unable to iterate ${operand}`
  }
}

export const error = (msg: string) => {
  throw(msg);
}
