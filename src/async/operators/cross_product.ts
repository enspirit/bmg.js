import type { AsyncRelationOperand } from '../types';
import type { Tuple } from '../../types';
import { tupleKey } from '../../sync/operators/_helpers';

/**
 * Cartesian product: combines every left tuple with every right tuple.
 * Left attributes override right on clash. Removes duplicates.
 * Materializes both sides.
 */
export async function* cross_product<T, U>(
  left: AsyncRelationOperand<T>,
  right: AsyncRelationOperand<U>
): AsyncIterable<Tuple> {
  // Materialize both sides
  const leftTuples: Tuple[] = [];
  const rightTuples: Tuple[] = [];

  for await (const tuple of left) {
    leftTuples.push(tuple as Tuple);
  }
  for await (const tuple of right) {
    rightTuples.push(tuple as Tuple);
  }

  // Cartesian product with deduplication
  const seen = new Set<string>();
  for (const l of leftTuples) {
    for (const r of rightTuples) {
      const combined = { ...r, ...l };
      const key = tupleKey(combined);
      if (!seen.has(key)) {
        seen.add(key);
        yield combined;
      }
    }
  }
}

export { cross_product as cross_join };
