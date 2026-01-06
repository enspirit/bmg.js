import type {
  RenameMap, Renamed,
  Prefixed, Suffixed,
  Joined, LeftJoined,
  Wrapped, Unwrapped,
  AggregatorResults
} from './utility-types';

// ============================================================================
// Group/Ungroup Types (defined here due to Relation dependency)
// ============================================================================

/** Result of ungroup: remove relation attr, flatten its tuple type */
export type Ungrouped<T, K extends keyof T> =
  T[K] extends Relation<infer N> ? Omit<T, K> & N : Omit<T, K>;

export type AttrName = string
export type Tuple = Record<AttrName, unknown>

export interface PrefixOptions {
  except?: AttrName[]
}

export interface SuffixOptions {
  except?: AttrName[]
}

export interface AutowrapOptions {
  separator?: string
}

// ============================================================================
// Typed Predicates
// ============================================================================

/** Predicate function that receives a typed tuple */
export type TypedPredicateFunc<T> = (t: T) => boolean

/** Predicate: either a partial tuple for equality matching, or a function */
export type TypedPredicate<T> = Partial<T> | TypedPredicateFunc<T>

// ============================================================================
// Typed Extensions
// ============================================================================

/** Extension function that receives a typed tuple */
export type TypedExtensionFunc<T, R> = (tuple: T) => R

/** Extension definition: function returning value, or attribute name to copy */
export type TypedExtension<T, E extends Record<string, unknown>> = {
  [K in keyof E]: TypedExtensionFunc<T, E[K]> | keyof T;
}

// ============================================================================
// Generic Relation Interface
// ============================================================================

/**
 * Relation interface with generic type parameter for tuple type.
 * Default parameter `Tuple` ensures backwards compatibility.
 *
 * @typeParam T - The tuple type for this relation. Defaults to `Tuple` (Record<string, unknown>).
 *
 * @example
 * // Untyped usage (backwards compatible)
 * const r = Bmg([{ id: 1 }]);  // Relation<Tuple>
 *
 * @example
 * // Typed usage with full type safety
 * interface Person { id: number; name: string }
 * const r = Bmg<Person>([{ id: 1, name: 'Alice' }]);
 * r.project(['id']);  // Relation<{ id: number }>
 */
export interface Relation<T = Tuple> {
  // === Type-preserving operators ===

  restrict(p: TypedPredicate<T>): Relation<T>
  where(p: TypedPredicate<T>): Relation<T>
  exclude(p: TypedPredicate<T>): Relation<T>

  // === Projection operators ===

  project<K extends keyof T>(attrs: K[]): Relation<Pick<T, K>>
  allbut<K extends keyof T>(attrs: K[]): Relation<Omit<T, K>>

  // === Extension operators ===

  extend<E extends Record<string, unknown>>(e: TypedExtension<T, E>): Relation<T & E>
  constants<C extends Tuple>(consts: C): Relation<T & C>

  // === Rename operators ===

  rename<R extends RenameMap<T>>(r: R): Relation<Renamed<T, R>>
  prefix<P extends string, Ex extends keyof T = never>(pfx: P, options?: { except?: Ex[] }): Relation<Prefixed<T, P, Ex>>
  suffix<S extends string, Ex extends keyof T = never>(sfx: S, options?: { except?: Ex[] }): Relation<Suffixed<T, S, Ex>>

  // === Set operators (require same type) ===

  union(right: RelationOperand<T>): Relation<T>
  minus(right: RelationOperand<T>): Relation<T>
  intersect(right: RelationOperand<T>): Relation<T>

  // === Semi-join operators (preserve left type) ===

  matching<R>(right: RelationOperand<R>, keys?: JoinKeys): Relation<T>
  not_matching<R>(right: RelationOperand<R>, keys?: JoinKeys): Relation<T>

  // === Join operators ===

  join<R>(right: RelationOperand<R>, keys?: JoinKeys): Relation<Joined<T, R>>
  left_join<R>(right: RelationOperand<R>, keys?: JoinKeys): Relation<LeftJoined<T, R>>
  cross_product<R>(right: RelationOperand<R>): Relation<T & R>
  cross_join<R>(right: RelationOperand<R>): Relation<T & R>

  // === Nesting operators ===

  image<R, As extends string>(right: RelationOperand<R>, as: As, keys?: JoinKeys): Relation<T & Record<As, Relation<Omit<R, keyof T & keyof R>>>>
  group<K extends keyof T, As extends string>(attrs: K[], as: As): Relation<Omit<T, K> & Record<As, Relation<Pick<T, K>>>>
  ungroup<K extends keyof T>(attr: K): Relation<Ungrouped<T, K>>
  wrap<K extends keyof T, As extends string>(attrs: K[], as: As): Relation<Wrapped<T, K, As>>
  unwrap<K extends keyof T>(attr: K): Relation<Unwrapped<T, K>>

  // === Aggregation ===

  summarize<By extends keyof T, Aggs extends Aggregators>(by: By[], aggs: Aggs): Relation<Pick<T, By> & AggregatorResults<Aggs>>

  // === Transform ===

  transform(t: Transformation): Relation<T>

  // === Dynamic (loses type precision) ===

  autowrap(options?: AutowrapOptions): Relation<Tuple>

  // === Non-relational ===

  one(): T
  yByX<Y extends keyof T, X extends keyof T>(y: Y, x: X): Record<T[X] & PropertyKey, T[Y]>
  toArray(): T[]
  isEqual(right: any): boolean
}

// ============================================================================
// Operands and Helpers
// ============================================================================

export type RelationOperand<T = Tuple> = Relation<T> | T[]

export interface OperationalOperand<T = Tuple> {
  tuples(): Iterable<T>
  output(tuples: T[]): RelationOperand<T>
}

// Legacy predicate types (for backwards compatibility with standalone operators)
export type PredicateFunc = ((t: Tuple) => any)
export type Predicate = Tuple | PredicateFunc

export type Renaming = RenamingObj | RenamingFunc
export type RenamingFunc = (attr: AttrName) => AttrName
export type RenamingObj = Record<AttrName, AttrName>

export type ExtensionFunc = (tuple: Tuple) => unknown
export type Extension = Record<AttrName, ExtensionFunc | AttrName>

export type JoinKeys = AttrName[] | Record<AttrName, AttrName>

export type AggregatorName = 'count' | 'sum' | 'min' | 'max' | 'avg' | 'collect'
export type AggregatorSpec = { op: AggregatorName, attr: AttrName }
export type AggregatorFunc = (tuples: Tuple[]) => unknown
export type Aggregator = AggregatorName | AggregatorSpec | AggregatorFunc
export type Aggregators = Record<AttrName, Aggregator>

export type TransformFunc = (value: unknown) => unknown
export type Transformation = TransformFunc | TransformFunc[] | Record<AttrName, TransformFunc | TransformFunc[]>

// Re-export utility types for convenience
export type { RenameMap, Renamed, Prefixed, Suffixed, Joined, LeftJoined, Wrapped, Unwrapped } from './utility-types';
// Ungrouped is defined in this file (not utility-types) due to Relation dependency
