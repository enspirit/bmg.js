import { BaseAsyncRelation } from './Base';
import type { AsyncRelation, AsyncRelationOperand } from '../async-types';
import { isEqual as isEqualOp } from '../async-operators/isEqual';

export { BaseAsyncRelation };

/**
 * Creates a new async relation from an AsyncIterable source.
 *
 * @typeParam T - The tuple type. Inferred from input or explicitly provided.
 *
 * @example
 * // From an async iterable
 * const suppliers = AsyncBmg(fetchSuppliersFromDB());
 *
 * @example
 * // Chained operations (lazy - no execution yet)
 * const query = AsyncBmg(source)
 *   .restrict({ city: 'London' })
 *   .project(['sid', 'name']);
 *
 * // Terminal operation triggers execution
 * const results = await query.toArray();
 */
export function AsyncBmg<T>(source: AsyncIterable<T>): AsyncRelation<T> {
  return new BaseAsyncRelation<T>(source);
}

AsyncBmg.isEqual = <T, U>(left: AsyncRelationOperand<T>, right: AsyncRelationOperand<U>): Promise<boolean> => {
  return isEqualOp(left, right);
};
