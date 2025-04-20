import { MemoryRelation } from "@/Relation";

export const isRelation = (op) => {
  return op.constructor === MemoryRelation;
}
