export * from './operators';

import { MemoryRelation } from './Relation';
import { isRelation } from './operators';

export const Bmg = <T>(tuples: T[]) => {
  return new MemoryRelation(tuples);
}
Bmg.isRelation = isRelation;
