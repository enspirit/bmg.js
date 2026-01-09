import type { AsyncRelationOperand } from '../async-types';
import type { Tuple } from '../types';
import { tupleKey } from '../operators/_helpers';

/**
 * Combines tuples from two relations, removing duplicates.
 */
export async function* union<T>(
  left: AsyncRelationOperand<T>,
  right: AsyncRelationOperand<T>
): AsyncIterable<Tuple> {
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
