import type { AsyncRelationOperand } from '../types';
import type { AttrName, Tuple, GroupOptions } from '../../types';
import { MemoryRelation } from '../../sync/Relation';
import { groupTuples } from '../../sync/operators/_helpers';

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

  const result = groupTuples(tuples, attrs, options);
  if (!result) return;

  for (const { base, nested } of result.groups.values()) {
    yield {
      ...base,
      [as]: new MemoryRelation(nested)
    };
  }
}
