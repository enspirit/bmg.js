import type { AsyncRelationOperand } from '../types';
import type { AttrName, Tuple, GroupOptions } from '../../types';
import { MemoryRelation } from '../../sync/Relation';

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
 *
 * With `options.allbut: true`, the attrs specify which attributes to KEEP
 * at the top level, and all others are grouped into the nested relation.
 */
export async function* group<T>(
  operand: AsyncRelationOperand<T>,
  attrs: AttrName[],
  as: AttrName,
  options?: GroupOptions
): AsyncIterable<Tuple> {
  // Materialize all tuples
  const tuples: Tuple[] = [];
  for await (const tuple of operand) {
    tuples.push(tuple as Tuple);
  }

  if (tuples.length === 0) {
    return;
  }

  const allAttrs = Object.keys(tuples[0]);
  const attrSet = new Set(attrs);

  // With allbut: attrs are the ones to KEEP at top level (group all others)
  // Without allbut: attrs are the ones to GROUP into nested relation
  const byAttrs = options?.allbut
    ? attrs.filter(a => allAttrs.includes(a))  // Keep these at top level
    : allAttrs.filter(a => !attrSet.has(a));   // Keep non-grouped at top level

  const groupedAttrs = options?.allbut
    ? allAttrs.filter(a => !attrSet.has(a))    // Group non-specified into nested
    : attrs.filter(a => allAttrs.includes(a)); // Group specified into nested

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
    groups.get(key)!.nested.push(pickAttrs(tuple, groupedAttrs));
  }

  // Yield results with nested relations
  for (const { base, nested } of groups.values()) {
    yield {
      ...base,
      [as]: new MemoryRelation(nested)
    };
  }
}
