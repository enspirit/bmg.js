import type { AsyncRelationOperand } from '../types';
import type { Ordering, PageOptions, Tuple } from '../../types';

const DEFAULT_PAGE_SIZE = 20;

const compareTuples = (a: Tuple, b: Tuple, ordering: Ordering): number => {
  for (const entry of ordering) {
    const [attr, dir] = Array.isArray(entry) ? entry : [entry, 'asc' as const];
    const av = a[attr];
    const bv = b[attr];
    if (av === bv) continue;
    if (av == null) return dir === 'asc' ? -1 : 1;
    if (bv == null) return dir === 'asc' ? 1 : -1;
    const cmp = (av as any) < (bv as any) ? -1 : 1;
    return dir === 'asc' ? cmp : -cmp;
  }
  return 0;
};

/**
 * Async page: materializes all tuples, sorts, slices to the page.
 * Order is preserved when iterated via toArray() or async iteration.
 */
export async function* page<T>(
  operand: AsyncRelationOperand<T>,
  ordering: Ordering,
  pageNumber: number,
  options?: PageOptions,
): AsyncIterable<T> {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const tuples: T[] = [];
  for await (const tuple of operand) tuples.push(tuple);
  tuples.sort((a, b) => compareTuples(a as Tuple, b as Tuple, ordering));
  const offset = (pageNumber - 1) * pageSize;
  const slice = tuples.slice(offset, offset + pageSize);
  for (const t of slice) yield t;
}
