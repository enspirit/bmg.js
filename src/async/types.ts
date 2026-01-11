import type { Tuple, TypedPredicate, Relation, TypedExtension, RenameMap, Renamed, Prefixed, Suffixed, Transformation, JoinKeys, AttrName, Aggregators, AutowrapOptions, TextOptions, GroupOptions } from '../types';

/**
 * Async version of the Relation interface.
 * Operations are lazy - they build a pipeline that executes only when
 * a terminal method (one(), toArray()) is awaited.
 *
 * @typeParam T - The tuple type for this relation.
 */
export interface AsyncRelation<T = Tuple> {
  // === Type-preserving operators ===

  restrict(p: TypedPredicate<T>): AsyncRelation<T>
  where(p: TypedPredicate<T>): AsyncRelation<T>
  exclude(p: TypedPredicate<T>): AsyncRelation<T>

  // === Projection operators ===

  project<K extends keyof T>(attrs: K[]): AsyncRelation<Pick<T, K>>
  allbut<K extends keyof T>(attrs: K[]): AsyncRelation<Omit<T, K>>

  // === Extension operators ===

  extend<E extends Record<string, unknown>>(e: TypedExtension<T, E>): AsyncRelation<T & E>
  constants<C extends Tuple>(consts: C): AsyncRelation<T & C>

  // === Rename operators ===

  rename<R extends RenameMap<T>>(r: R): AsyncRelation<Renamed<T, R>>
  prefix<P extends string, Ex extends keyof T = never>(pfx: P, options?: { except?: Ex[] }): AsyncRelation<Prefixed<T, P, Ex>>
  suffix<S extends string, Ex extends keyof T = never>(sfx: S, options?: { except?: Ex[] }): AsyncRelation<Suffixed<T, S, Ex>>
  transform(t: Transformation): AsyncRelation<T>

  // === Set operations ===

  union(other: AsyncRelationOperand<T>): AsyncRelation<T>
  minus(other: AsyncRelationOperand<T>): AsyncRelation<T>
  intersect(other: AsyncRelationOperand<T>): AsyncRelation<T>

  // === Semi-joins ===

  matching<U = Tuple>(other: AsyncRelationOperand<U>, keys?: JoinKeys): AsyncRelation<T>
  not_matching<U = Tuple>(other: AsyncRelationOperand<U>, keys?: JoinKeys): AsyncRelation<T>

  // === Joins ===

  join<U = Tuple>(other: AsyncRelationOperand<U>, keys?: JoinKeys): AsyncRelation<T & U>
  left_join<U = Tuple>(other: AsyncRelationOperand<U>, keys?: JoinKeys): AsyncRelation<T & Partial<U>>
  cross_product<U = Tuple>(other: AsyncRelationOperand<U>): AsyncRelation<T & U>
  cross_join<U = Tuple>(other: AsyncRelationOperand<U>): AsyncRelation<T & U>

  // === Nesting/Grouping ===

  group<K extends keyof T>(attrs: K[], as: AttrName, options?: GroupOptions): AsyncRelation<Tuple>
  ungroup(attr: AttrName): AsyncRelation<Tuple>
  wrap<K extends keyof T>(attrs: K[], as: AttrName): AsyncRelation<Omit<T, K> & Record<string, Pick<T, K>>>
  unwrap(attr: AttrName): AsyncRelation<Tuple>
  image<U = Tuple>(other: AsyncRelationOperand<U>, as: AttrName, keys?: JoinKeys): AsyncRelation<T & Record<string, Relation<U>>>
  summarize<K extends keyof T>(by: K[], aggs: Aggregators): AsyncRelation<Pick<T, K> & Tuple>
  autowrap(options?: AutowrapOptions): AsyncRelation<Tuple>

  // === Terminal operations (return Promises) ===

  one(): Promise<T>
  toArray(): Promise<T[]>
  toRelation(): Promise<Relation<T>>
  yByX(y: AttrName, x: AttrName): Promise<Tuple>
  toText(options?: TextOptions): Promise<string>

  // === Async iteration ===

  [Symbol.asyncIterator](): AsyncIterator<T>
}

/**
 * What can be passed as an operand to async operators.
 */
export type AsyncRelationOperand<T = Tuple> = AsyncRelation<T> | AsyncIterable<T>

/**
 * Async version of OperationalOperand for internal use by operators.
 */
export interface AsyncOperationalOperand<T = Tuple> {
  tuples(): AsyncIterable<T>
  output(tuples: AsyncIterable<T>): AsyncRelationOperand<T>
}
