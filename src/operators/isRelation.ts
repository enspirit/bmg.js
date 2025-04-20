import { MemoryRelation } from "@/Relation";
import { Relation } from "@/types";

export const isRelation = <T>(op: any): op is Relation<T>  => {
  return op.constructor === MemoryRelation;
}
