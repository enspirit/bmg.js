export * from './operators';

import { MemoryRelation } from './Relation/Memory';

export const Bmg = (tuples) => {
  return new MemoryRelation(tuples);
}

Bmg.isRelation = (op) => {
  return op.constructor === MemoryRelation;
}
