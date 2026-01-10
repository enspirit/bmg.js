import type { AsyncRelation, AsyncRelationOperand } from '../types';
import type { Tuple, TypedPredicate, TypedExtension, AttrName, Relation, RenameMap, Renamed, Prefixed, Suffixed, Transformation, JoinKeys, Aggregators, AutowrapOptions, TextOptions } from '../../types';
import { MemoryRelation } from '../../Relation';
import {
  restrict as restrictOp,
  where as whereOp,
  exclude as excludeOp,
} from '../operators/restrict';
import {
  project as projectOp,
  allbut as allbutOp,
} from '../operators/project';
import { extend as extendOp } from '../operators/extend';
import { constants as constantsOp } from '../operators/constants';
import { rename as renameOp } from '../operators/rename';
import { prefix as prefixOp } from '../operators/prefix';
import { suffix as suffixOp } from '../operators/suffix';
import { transform as transformOp } from '../operators/transform';
import { union as unionOp } from '../operators/union';
import { minus as minusOp } from '../operators/minus';
import { intersect as intersectOp } from '../operators/intersect';
import { matching as matchingOp } from '../operators/matching';
import { not_matching as notMatchingOp } from '../operators/not_matching';
import { join as joinOp } from '../operators/join';
import { left_join as leftJoinOp } from '../operators/left_join';
import { cross_product as crossProductOp } from '../operators/cross_product';
import { group as groupOp } from '../operators/group';
import { ungroup as ungroupOp } from '../operators/ungroup';
import { wrap as wrapOp } from '../operators/wrap';
import { unwrap as unwrapOp } from '../operators/unwrap';
import { image as imageOp } from '../operators/image';
import { summarize as summarizeOp } from '../operators/summarize';
import { autowrap as autowrapOp } from '../operators/autowrap';
import { yByX as yByXOp } from '../operators/yByX';
import { one as oneOp } from '../operators/one';
import { toArray as toArrayOp } from '../operators/toArray';
import { toText as toTextSync } from '../../writer';

/**
 * Base implementation of AsyncRelation using lazy evaluation.
 * Each operator returns a new BaseAsyncRelation wrapping the transformed iterable.
 */
export class BaseAsyncRelation<T = Tuple> implements AsyncRelation<T> {
  constructor(private source: AsyncIterable<T>) {}

  // === Type-preserving operators ===

  restrict(p: TypedPredicate<T>): AsyncRelation<T> {
    return new BaseAsyncRelation(restrictOp(this.source, p as any));
  }

  where(p: TypedPredicate<T>): AsyncRelation<T> {
    return new BaseAsyncRelation(whereOp(this.source, p as any));
  }

  exclude(p: TypedPredicate<T>): AsyncRelation<T> {
    return new BaseAsyncRelation(excludeOp(this.source, p as any));
  }

  // === Projection operators ===

  project<K extends keyof T>(attrs: K[]): AsyncRelation<Pick<T, K>> {
    return new BaseAsyncRelation(
      projectOp(this.source, attrs as AttrName[])
    ) as unknown as AsyncRelation<Pick<T, K>>;
  }

  allbut<K extends keyof T>(attrs: K[]): AsyncRelation<Omit<T, K>> {
    return new BaseAsyncRelation(
      allbutOp(this.source, attrs as AttrName[])
    ) as unknown as AsyncRelation<Omit<T, K>>;
  }

  // === Extension operators ===

  extend<E extends Record<string, unknown>>(e: TypedExtension<T, E>): AsyncRelation<T & E> {
    return new BaseAsyncRelation(
      extendOp(this.source, e as any)
    ) as unknown as AsyncRelation<T & E>;
  }

  constants<C extends Tuple>(consts: C): AsyncRelation<T & C> {
    return new BaseAsyncRelation(
      constantsOp(this.source, consts)
    ) as unknown as AsyncRelation<T & C>;
  }

  // === Rename operators ===

  rename<R extends RenameMap<T>>(r: R): AsyncRelation<Renamed<T, R>> {
    return new BaseAsyncRelation(
      renameOp(this.source, r as any)
    ) as unknown as AsyncRelation<Renamed<T, R>>;
  }

  prefix<P extends string, Ex extends keyof T = never>(pfx: P, options?: { except?: Ex[] }): AsyncRelation<Prefixed<T, P, Ex>> {
    return new BaseAsyncRelation(
      prefixOp(this.source, pfx, options as any)
    ) as unknown as AsyncRelation<Prefixed<T, P, Ex>>;
  }

  suffix<S extends string, Ex extends keyof T = never>(sfx: S, options?: { except?: Ex[] }): AsyncRelation<Suffixed<T, S, Ex>> {
    return new BaseAsyncRelation(
      suffixOp(this.source, sfx, options as any)
    ) as unknown as AsyncRelation<Suffixed<T, S, Ex>>;
  }

  transform(t: Transformation): AsyncRelation<T> {
    return new BaseAsyncRelation(
      transformOp(this.source, t)
    ) as unknown as AsyncRelation<T>;
  }

  // === Set operations ===

  union(other: AsyncRelationOperand<T>): AsyncRelation<T> {
    return new BaseAsyncRelation(
      unionOp(this.source, other)
    ) as unknown as AsyncRelation<T>;
  }

  minus(other: AsyncRelationOperand<T>): AsyncRelation<T> {
    return new BaseAsyncRelation(
      minusOp(this.source, other)
    ) as unknown as AsyncRelation<T>;
  }

  intersect(other: AsyncRelationOperand<T>): AsyncRelation<T> {
    return new BaseAsyncRelation(
      intersectOp(this.source, other)
    ) as unknown as AsyncRelation<T>;
  }

  // === Semi-joins ===

  matching<U>(other: AsyncRelationOperand<U>, keys?: JoinKeys): AsyncRelation<T> {
    return new BaseAsyncRelation(
      matchingOp(this.source, other, keys)
    ) as unknown as AsyncRelation<T>;
  }

  not_matching<U>(other: AsyncRelationOperand<U>, keys?: JoinKeys): AsyncRelation<T> {
    return new BaseAsyncRelation(
      notMatchingOp(this.source, other, keys)
    ) as unknown as AsyncRelation<T>;
  }

  // === Joins ===

  join<U>(other: AsyncRelationOperand<U>, keys?: JoinKeys): AsyncRelation<T & U> {
    return new BaseAsyncRelation(
      joinOp(this.source, other, keys)
    ) as unknown as AsyncRelation<T & U>;
  }

  left_join<U>(other: AsyncRelationOperand<U>, keys?: JoinKeys): AsyncRelation<T & Partial<U>> {
    return new BaseAsyncRelation(
      leftJoinOp(this.source, other, keys)
    ) as unknown as AsyncRelation<T & Partial<U>>;
  }

  cross_product<U>(other: AsyncRelationOperand<U>): AsyncRelation<T & U> {
    return new BaseAsyncRelation(
      crossProductOp(this.source, other)
    ) as unknown as AsyncRelation<T & U>;
  }

  cross_join<U>(other: AsyncRelationOperand<U>): AsyncRelation<T & U> {
    return this.cross_product(other);
  }

  // === Nesting/Grouping ===

  group<K extends keyof T>(attrs: K[], as: string): AsyncRelation<Omit<T, K> & Record<string, Relation<Pick<T, K>>>> {
    return new BaseAsyncRelation(
      groupOp(this.source, attrs as string[], as)
    ) as unknown as AsyncRelation<Omit<T, K> & Record<string, Relation<Pick<T, K>>>>;
  }

  ungroup(attr: string): AsyncRelation<Tuple> {
    return new BaseAsyncRelation(
      ungroupOp(this.source, attr)
    ) as unknown as AsyncRelation<Tuple>;
  }

  wrap<K extends keyof T>(attrs: K[], as: string): AsyncRelation<Omit<T, K> & Record<string, Pick<T, K>>> {
    return new BaseAsyncRelation(
      wrapOp(this.source, attrs as string[], as)
    ) as unknown as AsyncRelation<Omit<T, K> & Record<string, Pick<T, K>>>;
  }

  unwrap(attr: string): AsyncRelation<Tuple> {
    return new BaseAsyncRelation(
      unwrapOp(this.source, attr)
    ) as unknown as AsyncRelation<Tuple>;
  }

  image<U>(other: AsyncRelationOperand<U>, as: string, keys?: JoinKeys): AsyncRelation<T & Record<string, Relation<U>>> {
    return new BaseAsyncRelation(
      imageOp(this.source, other, as, keys)
    ) as unknown as AsyncRelation<T & Record<string, Relation<U>>>;
  }

  summarize<K extends keyof T>(by: K[], aggs: Aggregators): AsyncRelation<Pick<T, K> & Tuple> {
    return new BaseAsyncRelation(
      summarizeOp(this.source, by as string[], aggs)
    ) as unknown as AsyncRelation<Pick<T, K> & Tuple>;
  }

  autowrap(options?: AutowrapOptions): AsyncRelation<Tuple> {
    return new BaseAsyncRelation(
      autowrapOp(this.source, options)
    ) as unknown as AsyncRelation<Tuple>;
  }

  // === Terminal operations ===

  one(): Promise<T> {
    return oneOp(this.source);
  }

  toArray(): Promise<T[]> {
    return toArrayOp(this.source);
  }

  async toRelation(): Promise<Relation<T>> {
    const tuples = await toArrayOp(this.source);
    return new MemoryRelation<T>(tuples);
  }

  yByX(y: string, x: string): Promise<Tuple> {
    return yByXOp(this.source, y, x);
  }

  async toText(options?: TextOptions): Promise<string> {
    const tuples = await toArrayOp(this.source);
    return toTextSync(tuples as Tuple[], options);
  }

  // === Async iteration ===

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this.source[Symbol.asyncIterator]();
  }
}
