export * from './operators';

import { MemoryRelation } from './Relation';
import { isRelation } from './operators';

export const Bmg = (tuples) => {
  return new MemoryRelation(tuples);
}
Bmg.isRelation = isRelation;
