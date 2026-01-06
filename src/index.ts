export * from './operators';
export * from './types';
export * from './utility-types';

import { MemoryRelation } from './Relation';
import { isRelation } from './operators';

/**
 * Creates a new in-memory relation from an array of tuples.
 *
 * @typeParam T - The tuple type. Inferred from input or explicitly provided.
 *
 * @example
 * // Untyped usage (backwards compatible)
 * const r = Bmg([{ id: 1, name: 'Alice' }]);
 *
 * @example
 * // Typed usage with explicit type parameter
 * interface Person { id: number; name: string }
 * const r = Bmg<Person>([{ id: 1, name: 'Alice' }]);
 * r.project(['id']);  // Autocomplete suggests 'id' | 'name'
 *
 * @example
 * // Type is inferred from input
 * const r = Bmg([{ id: 1, name: 'Alice' }] as const);
 */
export function Bmg<T>(tuples: T[]): MemoryRelation<T> {
  return new MemoryRelation<T>(tuples);
}

Bmg.isRelation = isRelation;
