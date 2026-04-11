import {
  allbut,
  autowrap,
  constants,
  cross_product,
  exclude,
  extend,
  group,
  image,
  intersect,
  isEqual,
  join,
  left_join,
  matching,
  minus,
  not_matching,
  one,
  prefix,
  project,
  rename,
  restrict,
  suffix,
  summarize,
  where,
  transform,
  ungroup,
  union,
  unwrap,
  wrap,
  yByX,
} from "../operators";
import type {
  AttrName,
  AutowrapOptions,
  GroupOptions,
  WrapOptions,
  Relation,
  RelationOperand,
  TextOptions,
  Transformation,
  Tuple,
  TypedPredicate,
  TypedExtension,
  RenameMap,
  Renamed,
  Prefixed,
  Suffixed,
  Joined,
  LeftJoined,
  Wrapped,
  Unwrapped,
  Ungrouped,
  AggregatorResults,
  TypedJoinKeysArray,
  TypedJoinKeysObject,
} from "../../types";
import { toText } from "../../writer";

/**
 * In-memory implementation of the Relation interface.
 *
 * @typeParam T - The tuple type for this relation. Defaults to `Tuple` (Record<string, unknown>).
 */
export class MemoryRelation<T = Tuple> implements Relation<T> {

  constructor(private tuples: T[]) {
    this.tuples = tuples;
  }

  // === Type-preserving operators ===

  restrict(p: TypedPredicate<T>): Relation<T> {
    return restrict(this as any, p as any) as unknown as Relation<T>;
  }

  where(p: TypedPredicate<T>): Relation<T> {
    return where(this as any, p as any) as unknown as Relation<T>;
  }

  exclude(p: TypedPredicate<T>): Relation<T> {
    return exclude(this as any, p as any) as unknown as Relation<T>;
  }

  // === Projection operators ===

  project<K extends keyof T>(attrs: K[]): Relation<Pick<T, K>> {
    return project(this as any, attrs as AttrName[]) as unknown as Relation<Pick<T, K>>;
  }

  allbut<K extends keyof T>(attrs: K[]): Relation<Omit<T, K>> {
    return allbut(this as any, attrs as AttrName[]) as unknown as Relation<Omit<T, K>>;
  }

  // === Extension operators ===

  extend<E extends Record<string, unknown>>(e: TypedExtension<T, E>): Relation<T & E> {
    return extend(this as any, e as any) as unknown as Relation<T & E>;
  }

  constants<C extends Tuple>(consts: C): Relation<T & C> {
    return constants(this as any, consts) as unknown as Relation<T & C>;
  }

  // === Rename operators ===

  rename<R extends RenameMap<T>>(r: R): Relation<Renamed<T, R>> {
    return rename(this as any, r as any) as unknown as Relation<Renamed<T, R>>;
  }

  prefix<P extends string, Ex extends keyof T = never>(pfx: P, options?: { except?: Ex[] }): Relation<Prefixed<T, P, Ex>> {
    return prefix(this as any, pfx, options as any) as unknown as Relation<Prefixed<T, P, Ex>>;
  }

  suffix<S extends string, Ex extends keyof T = never>(sfx: S, options?: { except?: Ex[] }): Relation<Suffixed<T, S, Ex>> {
    return suffix(this as any, sfx, options as any) as unknown as Relation<Suffixed<T, S, Ex>>;
  }

  // === Set operators ===

  union(right: RelationOperand<T>): Relation<T> {
    return union(this as any, right as any) as unknown as Relation<T>;
  }

  minus(right: RelationOperand<T>): Relation<T> {
    return minus(this as any, right as any) as unknown as Relation<T>;
  }

  intersect(right: RelationOperand<T>): Relation<T> {
    return intersect(this as any, right as any) as unknown as Relation<T>;
  }

  // === Semi-join operators ===

  matching<R>(right: RelationOperand<R>, keys?: TypedJoinKeysArray<T, R> | TypedJoinKeysObject<T, R>): Relation<T> {
    return matching(this as any, right as any, keys as any) as unknown as Relation<T>;
  }

  not_matching<R>(right: RelationOperand<R>, keys?: TypedJoinKeysArray<T, R> | TypedJoinKeysObject<T, R>): Relation<T> {
    return not_matching(this as any, right as any, keys as any) as unknown as Relation<T>;
  }

  // === Join operators ===

  join<R>(right: RelationOperand<R>, keys?: TypedJoinKeysArray<T, R> | TypedJoinKeysObject<T, R>): Relation<Joined<T, R>> {
    return join(this as any, right as any, keys as any) as unknown as Relation<Joined<T, R>>;
  }

  left_join<R>(right: RelationOperand<R>, keys?: TypedJoinKeysArray<T, R> | TypedJoinKeysObject<T, R>): Relation<LeftJoined<T, R>> {
    return left_join(this as any, right as any, keys as any) as unknown as Relation<LeftJoined<T, R>>;
  }

  cross_product<R>(right: RelationOperand<R>): Relation<T & R> {
    return cross_product(this as any, right as any) as unknown as Relation<T & R>;
  }

  cross_join<R>(right: RelationOperand<R>): Relation<T & R> {
    return cross_product(this as any, right as any) as unknown as Relation<T & R>;
  }

  // === Nesting operators ===

  image<R, As extends string>(right: RelationOperand<R>, as: As, keys?: TypedJoinKeysArray<T, R> | TypedJoinKeysObject<T, R>): Relation<T & Record<As, Relation<Omit<R, keyof T & keyof R>>>> {
    return image(this as any, right as any, as, keys as any) as unknown as Relation<T & Record<As, Relation<Omit<R, keyof T & keyof R>>>>;
  }

  group<K extends keyof T, As extends string>(attrs: K[], as: As): Relation<Omit<T, K> & Record<As, Relation<Pick<T, K>>>>
  group<K extends keyof T, As extends string>(attrs: K[], as: As, options: { allbut: true }): Relation<Pick<T, K> & Record<As, Relation<Omit<T, K>>>>
  group<K extends keyof T, As extends string>(attrs: K[], as: As, options?: GroupOptions): Relation<Tuple>
  group<K extends keyof T, As extends string>(attrs: K[], as: As, options?: GroupOptions): Relation<any> {
    return group(this as any, attrs as AttrName[], as, options) as unknown as Relation<any>;
  }

  ungroup<K extends keyof T>(attr: K): Relation<Ungrouped<T, K>> {
    return ungroup(this as any, attr as AttrName) as unknown as Relation<Ungrouped<T, K>>;
  }

  wrap<K extends keyof T, As extends string>(attrs: K[], as: As): Relation<Wrapped<T, K, As>>
  wrap<K extends keyof T, As extends string>(attrs: K[], as: As, options: { allbut: true }): Relation<Pick<T, K> & Record<As, Omit<T, K>>>
  wrap<K extends keyof T, As extends string>(attrs: K[], as: As, options?: WrapOptions): Relation<Tuple>
  wrap<K extends keyof T, As extends string>(attrs: K[], as: As, options?: WrapOptions): Relation<any> {
    return wrap(this as any, attrs as AttrName[], as, options) as unknown as Relation<any>;
  }

  unwrap<K extends keyof T>(attr: K): Relation<Unwrapped<T, K>> {
    return unwrap(this as any, attr as AttrName) as unknown as Relation<Unwrapped<T, K>>;
  }

  // === Aggregation ===

  summarize<By extends keyof T, Aggs extends Record<string, unknown>>(by: By[], aggs: Aggs): Relation<Pick<T, By> & AggregatorResults<Aggs>> {
    return summarize(this as any, by as AttrName[], aggs as any) as unknown as Relation<Pick<T, By> & AggregatorResults<Aggs>>;
  }

  // === Transform ===

  transform(t: Transformation): Relation<T> {
    return transform(this as any, t) as unknown as Relation<T>;
  }

  // === Dynamic ===

  autowrap(options?: AutowrapOptions): Relation<Tuple> {
    return autowrap(this as any, options) as Relation<Tuple>;
  }

  // === Non-relational ===

  one(): T {
    return one(this as any) as T;
  }

  toArray(): T[] {
    return this.tuples;
  }

  yByX<Y extends keyof T, X extends keyof T>(y: Y, x: X): Record<T[X] & PropertyKey, T[Y]> {
    return yByX(this as any, y as AttrName, x as AttrName) as Record<T[X] & PropertyKey, T[Y]>;
  }

  isEqual(right: any): boolean {
    return isEqual(this as any, right as any);
  }

  // === Display ===

  toText(options?: TextOptions): string {
    return toText(this as any, options);
  }

}
