import type { AsyncRelationOperand } from '../types';
import type { Tuple, UnionOptions } from '../../types';
import { tupleKey } from '../../sync/operators/_helpers';

/**
 * Combines tuples from two relations. By default removes duplicates;
 * with `{ all: true }` (UNION ALL), concatenates without deduplication.
 */
export async function* union<T>(
  left: AsyncRelationOperand<T>,
  right: AsyncRelationOperand<T>,
  options?: UnionOptions,
): AsyncIterable<Tuple> {
  if (options?.all) {
    for await (const tuple of left) yield tuple as Tuple;
    for await (const tuple of right) yield tuple as Tuple;
    return;
  }

  const seen = new Set<string>();

  for await (const tuple of left) {
    const key = tupleKey(tuple as Tuple);
    if (!seen.has(key)) {
      seen.add(key);
      yield tuple as Tuple;
    }
  }

  for await (const tuple of right) {
    const key = tupleKey(tuple as Tuple);
    if (!seen.has(key)) {
      seen.add(key);
      yield tuple as Tuple;
    }
  }
}
