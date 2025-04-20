import { OperationalOperand, Relation, RelationOperand } from "@/types";
import { Bmg } from "..";

export const toOperationalOperand = (operand: RelationOperand): OperationalOperand => {
  if (Array.isArray(operand)) {
    return {
      tuples: () => operand,
      output: (tuples) => tuples,
    };
  } else if (Bmg.isRelation(operand)) {
    return {
      tuples: () => (operand as Relation).toArray(),
      output: (tuples) => Bmg(tuples),
    };
  } else {
    throw `Unable to iterate ${operand}`
  }
}

export const error = (msg: string) => {
  throw(msg);
}
