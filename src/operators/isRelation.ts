import { MemoryRelation } from "@/Relation";
import { Relation } from "@/types";

export const isRelation = (op: unknown): op is Relation => {
  return op != null && (op as object).constructor === MemoryRelation;
}
