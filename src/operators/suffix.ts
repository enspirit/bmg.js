import { RelationOperand, SuffixOptions } from "../types";
import { rename } from "./rename";

export const suffix = (operand: RelationOperand, sfx: string, options?: SuffixOptions): RelationOperand => {
  const except = new Set(options?.except ?? []);
  return rename(operand, (attr) => except.has(attr) ? attr : `${attr}${sfx}`);
}
