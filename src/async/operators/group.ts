import type { AsyncRelationOperand } from '../types';
import type { AttrName, Tuple } from '../../types';
import { MemoryRelation } from '../../Relation';

const groupKey = (tuple: Tuple, byAttrs: AttrName[]): string => {
  const keyParts = byAttrs.map(attr => JSON.stringify(tuple[attr]));
  return keyParts.join('|');
};

const pickAttrs = (tuple: Tuple, attrs: AttrName[]): Tuple => {
  return attrs.reduce((acc, attr) => {
    acc[attr] = tuple[attr];
    return acc;
  }, {} as Tuple);
};

/**
 * Groups specified attributes into a nested relation.
 * Materializes all tuples to perform grouping.
 */
export async function* group<T>(
  operand: AsyncRelationOperand<T>,
  attrs: AttrName[],
  as: AttrName
): AsyncIterable<Tuple> {
  // Materialize all tuples
  const tuples: Tuple[] = [];
  for await (const tuple of operand) {
    tuples.push(tuple as Tuple);
  }

  if (tuples.length === 0) {
    return;
  }

  // Determine which attributes to keep at the top level (all except grouped ones)
  const allAttrs = Object.keys(tuples[0]);
  const groupedSet = new Set(attrs);
  const byAttrs = allAttrs.filter(a => !groupedSet.has(a));

  // Group tuples
  const groups = new Map<string, { base: Tuple; nested: Tuple[] }>();
  for (const tuple of tuples) {
    const key = groupKey(tuple, byAttrs);
    if (!groups.has(key)) {
      groups.set(key, {
        base: pickAttrs(tuple, byAttrs),
        nested: []
      });
    }
    groups.get(key)!.nested.push(pickAttrs(tuple, attrs));
  }

  // Yield results with nested relations
  for (const { base, nested } of groups.values()) {
    yield {
      ...base,
      [as]: new MemoryRelation(nested)
    };
  }
}
