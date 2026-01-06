import { MemoryRelation } from "@/Relation";

export const isRelation = (op) => {
  return op != null && op.constructor === MemoryRelation;
}
