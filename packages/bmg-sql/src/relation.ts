/**
 * SqlRelation<T> — an AsyncRelation backed by a SQL query.
 *
 * Algebra operations rewrite the SQL AST when possible (push-down to DB).
 * When an operation can't be compiled to SQL, materializes the current
 * query and falls back to BaseAsyncRelation (in-memory).
 */
import type { AsyncRelation, AsyncRelationOperand } from '@enspirit/bmg-js/async';
import {
  Bmg,
  toText as toTextSync,
} from '@enspirit/bmg-js';
import type {
  Tuple,
  TypedPredicate,
  TypedExtension,
  RenameMap,
  Renamed,
  Prefixed,
  Suffixed,
  Transformation,
  JoinKeys,
  Aggregators,
  AutowrapOptions,
  TextOptions,
  Relation,
  GroupOptions,
  WrapOptions,
  Ordering,
  TypedOrdering,
  PageOptions,
} from '@enspirit/bmg-js';
import { BaseAsyncRelation } from '@enspirit/bmg-js/async';
import { isPredicate, fromObject, not } from '@enspirit/predicate';
import type { Predicate } from '@enspirit/predicate';

import type { SqlExpr } from './ast';
import type { DatabaseAdapter } from './adapter';
import type { CompiledSql } from './compile';
import { SqlBuilder } from './builder';
import { compile } from './compile';
import {
  processWhere,
  processProject,
  processAllbut,
  processRename,
  processExtend,
  processConstants,
  processJoin,
  processMerge,
  processSummarize,
  processSemiJoin,
  processOrderBy,
  processLimitOffset,
} from './processors';
import { RelationType } from './reltype';
import type { Key } from './reltype';

export interface BmgSqlOptions {
  /** Primary key or candidate keys for DISTINCT optimization */
  keys?: Key[];
}

/**
 * Create a SqlRelation from a database adapter and table name.
 */
export function BmgSql<T = Tuple>(
  adapter: DatabaseAdapter,
  table: string,
  attrs?: string[],
  options?: BmgSqlOptions,
): SqlRelation<T> {
  const builder = new SqlBuilder();
  const expr = attrs
    ? builder.selectFrom(attrs, table)
    : builder.selectStarFrom(table);
  const relType = attrs
    ? new RelationType(attrs, options?.keys ?? [])
    : undefined;
  return new SqlRelation<T>(adapter, expr, builder, relType);
}

/**
 * Create a SqlRelation from an opaque raw-SQL subquery.
 *
 * `sql` is embedded verbatim, aliased, and projected to `attrs`. The
 * fragment must return rows with those column names. `params` are
 * inlined as bind parameters in the order they appear.
 *
 * Use this when a relation cannot be expressed with the relational
 * operators — e.g., a table-valued function, a database-specific
 * construct, or a pre-existing query.
 *
 * @example
 *   BmgSql.fromSubquery<{ sid: string }>(
 *     adapter,
 *     'SELECT sid FROM suppliers WHERE city = ?',
 *     ['sid'],
 *     { params: ['London'] },
 *   )
 */
BmgSql.fromSubquery = function <T = Tuple>(
  adapter: DatabaseAdapter,
  sql: string,
  attrs: string[],
  options?: BmgSqlOptions & { params?: unknown[] },
): SqlRelation<T> {
  const builder = new SqlBuilder();
  const alias = builder.qualify();
  const expr = {
    kind: 'select' as const,
    quantifier: 'all' as const,
    selectList: attrs.map(a => builder.selectItem(alias, a)),
    from: {
      tableSpec: {
        kind: 'raw_subquery_ref' as const,
        sql,
        params: options?.params,
        alias,
      },
    },
  };
  const relType = new RelationType(attrs, options?.keys ?? []);
  return new SqlRelation<T>(adapter, expr, builder, relType);
};

export class SqlRelation<T = Tuple> implements AsyncRelation<T> {
  constructor(
    readonly adapter: DatabaseAdapter,
    readonly expr: SqlExpr,
    readonly builder: SqlBuilder,
    readonly relType?: RelationType,
  ) {}

  // ===========================================================================
  // SQL inspection
  // ===========================================================================

  /** Compile the SQL AST to a parameterized SQL string without executing */
  toSql(): CompiledSql {
    return compile(this.expr, this.adapter.dialect);
  }

  // ===========================================================================
  // Internal helpers
  // ===========================================================================

  /** Create a new SqlRelation with a modified AST and optional new type */
  private withExpr(expr: SqlExpr, relType?: RelationType): SqlRelation<any> {
    return new SqlRelation(this.adapter, expr, this.builder, relType ?? this.relType);
  }

  /** Materialize the SQL result and wrap in BaseAsyncRelation for in-memory ops */
  private fallback(): BaseAsyncRelation<T> {
    const self = this;
    async function* generate(): AsyncGenerator<T> {
      const { sql, params } = self.toSql();
      const rows = await self.adapter.query<T>(sql, params);
      yield* rows;
    }
    return new BaseAsyncRelation<T>(generate());
  }

  /**
   * Check if a right operand is a compatible SqlRelation (same adapter)
   * and return its AST if so. Otherwise return undefined.
   */
  private extractCompatibleExpr(other: any): SqlExpr | undefined {
    if (other instanceof SqlRelation && other.adapter === this.adapter) {
      return other.expr;
    }
    return undefined;
  }

  /**
   * Convert a predicate argument to a structured Predicate for SQL compilation.
   * Returns undefined if the predicate is a function (can't compile to SQL).
   */
  private toStructuredPredicate(p: TypedPredicate<T>): Predicate | undefined {
    if (typeof p === 'function') return undefined;
    if (isPredicate(p)) return p as Predicate;
    // Plain object → conjunction of equalities
    return fromObject(p as Record<string, unknown>);
  }

  // ===========================================================================
  // Type-preserving operators (push to SQL when possible)
  // ===========================================================================

  restrict(p: TypedPredicate<T>): AsyncRelation<T> {
    const pred = this.toStructuredPredicate(p);
    if (pred) {
      return this.withExpr(processWhere(this.expr, pred, this.builder), this.relType);
    }
    return this.fallback().restrict(p);
  }

  where(p: TypedPredicate<T>): AsyncRelation<T> {
    return this.restrict(p);
  }

  exclude(p: TypedPredicate<T>): AsyncRelation<T> {
    const pred = this.toStructuredPredicate(p);
    if (pred) {
      return this.withExpr(processWhere(this.expr, not(pred), this.builder));
    }
    return this.fallback().exclude(p);
  }

  // ===========================================================================
  // Projection operators
  // ===========================================================================

  project<K extends keyof T>(attrs: K[]): AsyncRelation<Pick<T, K>> {
    const strAttrs = attrs as string[];
    const newType = this.relType?.project(strAttrs);
    return this.withExpr(
      processProject(this.expr, strAttrs, this.builder, this.relType),
      newType
    ) as unknown as AsyncRelation<Pick<T, K>>;
  }

  allbut<K extends keyof T>(attrs: K[]): AsyncRelation<Omit<T, K>> {
    const strAttrs = attrs as string[];
    const newType = this.relType?.allbut(strAttrs);
    return this.withExpr(
      processAllbut(this.expr, strAttrs, this.builder, this.relType),
      newType
    ) as unknown as AsyncRelation<Omit<T, K>>;
  }

  // ===========================================================================
  // Extension operators
  // ===========================================================================

  extend<E extends Record<string, unknown>>(e: TypedExtension<T, E>): AsyncRelation<T & E> {
    // Only support attribute references (string values), not functions
    const supported: Record<string, string> = {};
    const unsupported: Record<string, any> = {};
    for (const [k, v] of Object.entries(e)) {
      if (typeof v === 'string') {
        supported[k] = v;
      } else {
        unsupported[k] = v;
      }
    }

    if (Object.keys(unsupported).length > 0) {
      // Has functions → fall back to in-memory for those
      if (Object.keys(supported).length > 0) {
        // Partial: push supported to SQL, then in-memory for unsupported
        const sqlResult = this.withExpr(
          processExtend(this.expr, supported, this.builder)
        );
        return (sqlResult.fallback() as BaseAsyncRelation<any>).extend(unsupported as any) as any;
      }
      return this.fallback().extend(e);
    }

    return this.withExpr(
      processExtend(this.expr, supported, this.builder)
    ) as unknown as AsyncRelation<T & E>;
  }

  constants<C extends Tuple>(consts: C): AsyncRelation<T & C> {
    return this.withExpr(
      processConstants(this.expr, consts, this.builder)
    ) as unknown as AsyncRelation<T & C>;
  }

  // ===========================================================================
  // Rename operators
  // ===========================================================================

  rename<R extends RenameMap<T>>(r: R): AsyncRelation<Renamed<T, R>> {
    const renaming: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) {
      if (typeof v === 'string') renaming[k] = v;
    }
    const newType = this.relType?.rename(renaming);
    return this.withExpr(
      processRename(this.expr, renaming, this.builder),
      newType
    ) as unknown as AsyncRelation<Renamed<T, R>>;
  }

  prefix<P extends string, Ex extends keyof T = never>(pfx: P, options?: { except?: Ex[] }): AsyncRelation<Prefixed<T, P, Ex>> {
    return this.fallback().prefix(pfx, options);
  }

  suffix<S extends string, Ex extends keyof T = never>(sfx: S, options?: { except?: Ex[] }): AsyncRelation<Suffixed<T, S, Ex>> {
    return this.fallback().suffix(sfx, options);
  }

  transform(t: Transformation): AsyncRelation<T> {
    return this.fallback().transform(t);
  }

  // ===========================================================================
  // Set operations
  // ===========================================================================

  union(other: AsyncRelationOperand<T>): AsyncRelation<T> {
    const rightExpr = this.extractCompatibleExpr(other);
    if (rightExpr) {
      return this.withExpr(processMerge(this.expr, rightExpr, 'union', false, this.builder));
    }
    return this.fallback().union(other);
  }

  minus(other: AsyncRelationOperand<T>): AsyncRelation<T> {
    const rightExpr = this.extractCompatibleExpr(other);
    if (rightExpr) {
      return this.withExpr(processMerge(this.expr, rightExpr, 'except', false, this.builder));
    }
    return this.fallback().minus(other);
  }

  intersect(other: AsyncRelationOperand<T>): AsyncRelation<T> {
    const rightExpr = this.extractCompatibleExpr(other);
    if (rightExpr) {
      return this.withExpr(processMerge(this.expr, rightExpr, 'intersect', false, this.builder));
    }
    return this.fallback().intersect(other);
  }

  // ===========================================================================
  // Joins
  // ===========================================================================

  join<U>(other: AsyncRelationOperand<U>, keys?: JoinKeys): AsyncRelation<T & U> {
    const rightExpr = this.extractCompatibleExpr(other);
    if (rightExpr && keys && this.expr.kind === 'select' && this.expr.from) {
      const hasKeys = Array.isArray(keys) ? keys.length > 0 : Object.keys(keys).length > 0;
      if (hasKeys) {
        return this.withExpr(
          processJoin(this.expr, rightExpr, keys, 'inner_join', this.builder)
        ) as unknown as AsyncRelation<T & U>;
      }
    }
    return this.fallback().join(other, keys);
  }

  left_join<U>(other: AsyncRelationOperand<U>, keys?: JoinKeys): AsyncRelation<T & Partial<U>> {
    const rightExpr = this.extractCompatibleExpr(other);
    if (rightExpr && keys && this.expr.kind === 'select' && this.expr.from) {
      const hasKeys = Array.isArray(keys) ? keys.length > 0 : Object.keys(keys).length > 0;
      if (hasKeys) {
        return this.withExpr(
          processJoin(this.expr, rightExpr, keys, 'left_join', this.builder)
        ) as unknown as AsyncRelation<T & Partial<U>>;
      }
    }
    return this.fallback().left_join(other, keys);
  }

  cross_product<U>(other: AsyncRelationOperand<U>): AsyncRelation<T & U> {
    return this.fallback().cross_product(other);
  }

  cross_join<U>(other: AsyncRelationOperand<U>): AsyncRelation<T & U> {
    return this.cross_product(other);
  }

  // ===========================================================================
  // Semi-joins (EXISTS / NOT EXISTS)
  // ===========================================================================

  matching<U>(other: AsyncRelationOperand<U>, keys?: JoinKeys): AsyncRelation<T> {
    const rightExpr = this.extractCompatibleExpr(other);
    if (rightExpr && keys && Array.isArray(keys)) {
      return this.withExpr(
        processSemiJoin(this.expr, rightExpr, keys as string[], false, this.builder)
      );
    }
    return this.fallback().matching(other, keys);
  }

  not_matching<U>(other: AsyncRelationOperand<U>, keys?: JoinKeys): AsyncRelation<T> {
    const rightExpr = this.extractCompatibleExpr(other);
    if (rightExpr && keys && Array.isArray(keys)) {
      return this.withExpr(
        processSemiJoin(this.expr, rightExpr, keys as string[], true, this.builder)
      );
    }
    return this.fallback().not_matching(other, keys);
  }

  // ===========================================================================
  // Nesting/Grouping (all fall back — these are structural, not SQL-compilable)
  // ===========================================================================

  group<K extends keyof T>(attrs: K[], as: string, options?: GroupOptions): AsyncRelation<Tuple> {
    return this.fallback().group(attrs, as, options);
  }

  ungroup(attr: string): AsyncRelation<Tuple> {
    return this.fallback().ungroup(attr);
  }

  wrap<K extends keyof T>(attrs: K[], as: string, options?: WrapOptions): AsyncRelation<Tuple> {
    return this.fallback().wrap(attrs, as, options);
  }

  unwrap(attr: string): AsyncRelation<Tuple> {
    return this.fallback().unwrap(attr);
  }

  image<U>(other: AsyncRelationOperand<U>, as: string, keys?: JoinKeys): AsyncRelation<T & Record<string, Relation<U>>> {
    return this.fallback().image(other, as, keys);
  }

  summarize<K extends keyof T>(by: K[], aggs: Aggregators): AsyncRelation<Pick<T, K> & Tuple> {
    // Try to compile aggregators to SQL
    const compilableOps = new Set(['count', 'sum', 'avg', 'min', 'max', 'distinct_count']);
    const sqlAggs: Record<string, { func: any; attr?: string }> = {};
    let allCompilable = true;

    for (const [name, spec] of Object.entries(aggs)) {
      if (typeof spec === 'string' && compilableOps.has(spec)) {
        sqlAggs[name] = { func: spec };
      } else if (typeof spec === 'object' && 'op' in spec && compilableOps.has(spec.op)) {
        sqlAggs[name] = { func: spec.op, attr: spec.attr };
      } else {
        allCompilable = false;
        break;
      }
    }

    if (allCompilable) {
      return this.withExpr(
        processSummarize(this.expr, by as string[], sqlAggs, this.builder)
      ) as unknown as AsyncRelation<Pick<T, K> & Tuple>;
    }
    return this.fallback().summarize(by, aggs);
  }

  autowrap(options?: AutowrapOptions): AsyncRelation<Tuple> {
    return this.fallback().autowrap(options);
  }

  // ===========================================================================
  // Pagination
  // ===========================================================================

  page(ordering: TypedOrdering<T>, pageNumber: number, options?: PageOptions): AsyncRelation<T> {
    const pageSize = options?.pageSize ?? 20;
    const normalized = (ordering as Ordering).map(entry => {
      const [attr, direction] = Array.isArray(entry) ? entry : [entry, 'asc' as const];
      return { attr: attr as string, direction };
    });
    const ordered = processOrderBy(this.expr, normalized, this.builder);
    const limited = processLimitOffset(
      ordered,
      pageSize,
      (pageNumber - 1) * pageSize || undefined,
      this.builder,
    );
    return this.withExpr(limited);
  }

  // ===========================================================================
  // Terminal operations
  // ===========================================================================

  async one(): Promise<T> {
    const { sql, params } = this.toSql();
    const rows = await this.adapter.query<T>(sql, params);
    if (rows.length === 0) throw new Error('Expected one tuple, got none');
    if (rows.length > 1) throw new Error(`Expected one tuple, got ${rows.length}`);
    return rows[0];
  }

  async toArray(): Promise<T[]> {
    const { sql, params } = this.toSql();
    return this.adapter.query<T>(sql, params);
  }

  async toRelation(): Promise<Relation<T>> {
    const tuples = await this.toArray();
    return Bmg(tuples);
  }

  async yByX(y: string, x: string): Promise<Tuple> {
    const tuples = await this.toArray();
    const result: Tuple = {};
    for (const t of tuples) {
      const tuple = t as Tuple;
      result[tuple[x] as string] = tuple[y];
    }
    return result;
  }

  async toText(options?: TextOptions): Promise<string> {
    const tuples = await this.toArray();
    return toTextSync(tuples as Tuple[], options);
  }

  // ===========================================================================
  // Async iteration (cursor-based streaming)
  // ===========================================================================

  [Symbol.asyncIterator](): AsyncIterator<T> {
    const { sql, params } = this.toSql();
    return this.adapter.stream<T>(sql, params)[Symbol.asyncIterator]();
  }

}
