export * from './sync/operators';
export * from './types';
export { LIB_DEFINITIONS } from './lib-definitions';
export { toText } from './writer';

import { MemoryRelation } from './sync/Relation';
import { isRelation } from './sync/operators';

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

/**
 * DEE - The relation with no attributes and exactly one tuple.
 * This is the identity element for natural join.
 */
export const DEE = new MemoryRelation<Record<string, never>>([{}]);

/**
 * DUM - The relation with no attributes and no tuples.
 * This is the identity element for union.
 */
export const DUM = new MemoryRelation<Record<string, never>>([]);
