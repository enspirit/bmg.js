/**
 * Utility types for type transformations in relational operators.
 * These enable compile-time tracking of how operators transform tuple types.
 */

import type { Tuple } from './types';

// ============================================================================
// Rename Types
// ============================================================================

/** Map from old attribute names to new attribute names */
export type RenameMap<T> = { [K in keyof T]?: string };

/** Transform tuple type by renaming keys according to RenameMap */
export type Renamed<T, R extends RenameMap<T>> = {
  [K in keyof T as K extends keyof R ? (R[K] extends string ? R[K] : K) : K]: T[K];
};

// ============================================================================
// Prefix/Suffix Types
// ============================================================================

/** Prefix all keys except those in Except */
export type Prefixed<T, P extends string, Except extends keyof T = never> = {
  [K in keyof T as K extends Except ? K : `${P}${K & string}`]: T[K];
};

/** Suffix all keys except those in Except */
export type Suffixed<T, S extends string, Except extends keyof T = never> = {
  [K in keyof T as K extends Except ? K : `${K & string}${S}`]: T[K];
};

// ============================================================================
// Join Types
// ============================================================================

/** Extract common keys between two tuple types */
export type CommonKeys<L, R> = Extract<keyof L, keyof R>;

/** Result of inner join: L & R with R's common keys removed */
export type Joined<L, R> = L & Omit<R, CommonKeys<L, R>>;

/** Result of left join: L & optional R attributes (common keys removed) */
export type LeftJoined<L, R> = L & Partial<Omit<R, CommonKeys<L, R>>>;

// ============================================================================
// Wrap/Unwrap Types
// ============================================================================

/** Result of wrap: remove wrapped attrs, add nested object */
export type Wrapped<T, K extends keyof T, As extends string> =
  Omit<T, K> & Record<As, Pick<T, K>>;

/** Result of unwrap: remove object attr, spread its properties */
export type Unwrapped<T, K extends keyof T> =
  T[K] extends Record<string, unknown> ? Omit<T, K> & T[K] : Omit<T, K>;

// Note: Ungrouped is defined in types.ts since it references Relation

// ============================================================================
// Aggregator Result Types
// ============================================================================

/** Infer result type from aggregator specification */
export type AggregatorResult<A> =
  A extends 'count' ? number :
  A extends { op: 'count' } ? number :
  A extends { op: 'sum' | 'avg' | 'min' | 'max' } ? number | null :
  A extends { op: 'collect' } ? unknown[] :
  A extends (tuples: Tuple[]) => infer R ? R :
  unknown;

/** Map aggregator definitions to their result types */
export type AggregatorResults<Aggs extends Record<string, unknown>> = {
  [K in keyof Aggs]: AggregatorResult<Aggs[K]>;
};
