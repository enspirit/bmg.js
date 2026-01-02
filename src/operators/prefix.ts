import { PrefixOptions, RelationOperand } from "../types";
import { rename } from "./rename";

export const prefix = (operand: RelationOperand, pfx: string, options?: PrefixOptions): RelationOperand => {
  const except = new Set(options?.except ?? []);
  return rename(operand, (attr) => except.has(attr) ? attr : `${pfx}${attr}`);
}
