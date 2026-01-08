// Auto-generated from types.ts
// Run 'npm run generate:lib-definitions' to regenerate

export const LIB_DEFINITIONS = `
/**
 * Type definitions for Bmg.js relational algebra library.
 *
 * This file defines all types needed for type-safe relational operations:
 * - Base types (AttrName, Tuple)
 * - Utility types for transformations (Renamed, Prefixed, Joined, etc.)
 * - The Relation interface with all operators
 * - Helper types for predicates, extensions, aggregators, etc.
 */

// ============================================================================
// Base Types
// ============================================================================

/** Attribute name in a tuple */
type AttrName = string

/** A tuple is a record mapping attribute names to values */
type Tuple = Record<AttrName, unknown>

// ============================================================================
// Rename Types
// ============================================================================

/** Map from old attribute names to new attribute names */
type RenameMap<T> = { [K in keyof T]?: string };

/** Transform tuple type by renaming keys according to RenameMap */
type Renamed<T, R extends RenameMap<T>> = {
  [K in keyof T as K extends keyof R ? (R[K] extends string ? R[K] : K) : K]: T[K];
};

// ============================================================================
// Prefix/Suffix Types
// ============================================================================

/** Prefix all keys except those in Except */
type Prefixed<T, P extends string, Except extends keyof T = never> = {
  [K in keyof T as K extends Except ? K : \`\${P}\${K & string}\`]: T[K];
};

/** Suffix all keys except those in Except */
type Suffixed<T, S extends string, Except extends keyof T = never> = {
  [K in keyof T as K extends Except ? K : \`\${K & string}\${S}\`]: T[K];
};

// ============================================================================
// Join Types
// ============================================================================

/** Extract common keys between two tuple types */
type CommonKeys<L, R> = Extract<keyof L, keyof R>;

/** Result of inner join: L & R with R's common keys removed */
type Joined<L, R> = L & Omit<R, CommonKeys<L, R>>;

/** Result of left join: L & optional R attributes (common keys removed) */
type LeftJoined<L, R> = L & Partial<Omit<R, CommonKeys<L, R>>>;

/**
 * Typed join keys for array form: keys must exist on BOTH operands.
 * Example: suppliers.join(parts, ['city']) - 'city' must be a key of both.
 */
type TypedJoinKeysArray<L, R> = (keyof L & keyof R & string)[];

/**
 * Typed join keys for object form: maps left keys to right keys.
 * Example: suppliers.join(parts, { sid: 'supplier_id' })
 * - Left key (sid) must exist on L
 * - Right key (supplier_id) must exist on R
 */
type TypedJoinKeysObject<L, R> = { [K in keyof L & string]?: keyof R & string };

// ============================================================================
// Wrap/Unwrap Types
// ============================================================================

/** Result of wrap: remove wrapped attrs, add nested object */
type Wrapped<T, K extends keyof T, As extends string> =
  Omit<T, K> & Record<As, Pick<T, K>>;

/** Result of unwrap: remove object attr, spread its properties */
type Unwrapped<T, K extends keyof T> =
  T[K] extends Record<string, unknown> ? Omit<T, K> & T[K] : Omit<T, K>;

/** Result of ungroup: remove relation attr, flatten its tuple type */
type Ungrouped<T, K extends keyof T> =
  T[K] extends Relation<infer N> ? Omit<T, K> & N : Omit<T, K>;

// ============================================================================
// Aggregator Types
// ============================================================================

type AggregatorName = 'count' | 'sum' | 'min' | 'max' | 'avg' | 'collect'
type AggregatorSpec = { op: AggregatorName, attr: AttrName }
type AggregatorFunc = (tuples: Tuple[]) => unknown
type Aggregator = AggregatorName | AggregatorSpec | AggregatorFunc
type Aggregators = Record<AttrName, Aggregator>

/** Infer result type from aggregator specification */
type AggregatorResult<A> =
  A extends 'count' ? number :
  A extends { op: 'count' } ? number :
  A extends { op: 'sum' | 'avg' | 'min' | 'max' } ? number | null :
  A extends { op: 'collect' } ? unknown[] :
  A extends (tuples: Tuple[]) => infer R ? R :
  unknown;

/** Map aggregator definitions to their result types */
type AggregatorResults<Aggs extends Record<string, unknown>> = {
  [K in keyof Aggs]: AggregatorResult<Aggs[K]>;
};

// ============================================================================
// Predicate Types
// ============================================================================

/** Predicate function that receives a typed tuple */
type TypedPredicateFunc<T> = (t: T) => boolean

/** Predicate: either a partial tuple for equality matching, or a function */
type TypedPredicate<T> = Partial<T> | TypedPredicateFunc<T>

// Legacy predicate types (for backwards compatibility with standalone operators)
type PredicateFunc = ((t: Tuple) => any)
type Predicate = Tuple | PredicateFunc

// ============================================================================
// Extension Types
// ============================================================================

/** Extension function that receives a typed tuple */
type TypedExtensionFunc<T, R> = (tuple: T) => R

/** Extension definition: function returning value, or attribute name to copy */
type TypedExtension<T, E extends Record<string, unknown>> = {
  [K in keyof E]: TypedExtensionFunc<T, E[K]> | keyof T;
}

type ExtensionFunc = (tuple: Tuple) => unknown
type Extension = Record<AttrName, ExtensionFunc | AttrName>

// ============================================================================
// Other Helper Types
// ============================================================================

interface PrefixOptions {
  except?: AttrName[]
}

interface SuffixOptions {
  except?: AttrName[]
}

interface AutowrapOptions {
  separator?: string
}

type Renaming = RenamingObj | RenamingFunc
type RenamingFunc = (attr: AttrName) => AttrName
type RenamingObj = Record<AttrName, AttrName>

type JoinKeys = AttrName[] | Record<AttrName, AttrName>

type TransformFunc = (value: unknown) => unknown
type Transformation = TransformFunc | TransformFunc[] | Record<AttrName, TransformFunc | TransformFunc[]>

// ============================================================================
// Relation Interface
// ============================================================================

/**
 * Relation interface with generic type parameter for tuple type.
 * Default parameter \`Tuple\` ensures backwards compatibility.
 *
 * @typeParam T - The tuple type for this relation. Defaults to \`Tuple\` (Record<string, unknown>).
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
interface Relation<T = Tuple> {
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

  matching<R>(right: RelationOperand<R>, keys?: TypedJoinKeysArray<T, R> | TypedJoinKeysObject<T, R>): Relation<T>
  not_matching<R>(right: RelationOperand<R>, keys?: TypedJoinKeysArray<T, R> | TypedJoinKeysObject<T, R>): Relation<T>

  // === Join operators ===

  join<R>(right: RelationOperand<R>, keys?: TypedJoinKeysArray<T, R> | TypedJoinKeysObject<T, R>): Relation<Joined<T, R>>
  left_join<R>(right: RelationOperand<R>, keys?: TypedJoinKeysArray<T, R> | TypedJoinKeysObject<T, R>): Relation<LeftJoined<T, R>>
  cross_product<R>(right: RelationOperand<R>): Relation<T & R>
  cross_join<R>(right: RelationOperand<R>): Relation<T & R>

  // === Nesting operators ===

  image<R, As extends string>(right: RelationOperand<R>, as: As, keys?: TypedJoinKeysArray<T, R> | TypedJoinKeysObject<T, R>): Relation<T & Record<As, Relation<Omit<R, keyof T & keyof R>>>>
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
// Operands
// ============================================================================

type RelationOperand<T = Tuple> = Relation<T> | T[]

interface OperationalOperand<T = Tuple> {
  tuples(): Iterable<T>
  output(tuples: T[]): RelationOperand<T>
}

// ============================================================================
// Bmg Function Declaration
// ============================================================================

/** Create a relation from an array of tuples */
declare function Bmg<T>(tuples: T[]): Relation<T>
declare namespace Bmg {
  function isRelation(op: unknown): boolean
}
`
