import { describe, it, expect, expectTypeOf } from 'vitest';
import type { AsyncRelation } from '@enspirit/bmg-js';
import { Pred } from '@enspirit/predicate';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: allbut', () => {
  const { suppliers, supplies } = buildFixtures();

  it('allbut.01 — Remove two attributes (key preserved → no DISTINCT)', () => {
    const rel = suppliers.allbut(['city', 'status']);
    expectTypeOf(rel).toEqualTypeOf<AsyncRelation<{ sid: string; name: string }>>();
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name" FROM "suppliers" "t1"',
    );
  });

  it('allbut.02 — Remove all but city (key dropped → DISTINCT)', () => {
    const rel = suppliers.allbut(['sid', 'name', 'status']);
    expectTypeOf(rel).toEqualTypeOf<AsyncRelation<{ city: string }>>();
    expect(rel.toSql().sql).toBe(
      'SELECT DISTINCT "t1"."city" FROM "suppliers" "t1"',
    );
  });

  it('allbut.03 — project then allbut (key still preserved → no DISTINCT)', () => {
    const rel = suppliers.project(['sid', 'name', 'city']).allbut(['city']);
    expectTypeOf(rel).toEqualTypeOf<AsyncRelation<{ sid: string; name: string }>>();
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name" FROM "suppliers" "t1"',
    );
  });

  it('allbut.04 — restrict then allbut (DIVERGENT: bmg-sql adds DISTINCT bmg-rb omits)', () => {
    const rel = supplies.restrict({ sid: 'S1' }).allbut(['sid']);
    expectTypeOf(rel).toEqualTypeOf<AsyncRelation<{ pid: string; qty: number }>>();
    const compiled = rel.toSql();
    // bmg-rb emits SELECT (no DISTINCT) because restrict-on-key-prefix
    // guarantees (pid,qty) uniqueness. bmg-sql emits DISTINCT defensively
    // because the composite key [sid,pid] is broken by removing sid. Same
    // result set, different query — see allbut.md for details.
    expect(compiled.sql).toBe(
      'SELECT DISTINCT "t1"."pid", "t1"."qty" FROM "supplies" "t1" WHERE "t1"."sid" = ?',
    );
    expect(compiled.params).toEqual(['S1']);
  });

  it('allbut.05 — OR-restrict then allbut (key component gone → DISTINCT)', () => {
    const rel = supplies
      .restrict(Pred.or(Pred.eq('sid', 'S1'), Pred.eq('sid', 'S2')))
      .allbut(['sid']);
    expectTypeOf(rel).toEqualTypeOf<AsyncRelation<{ pid: string; qty: number }>>();
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT DISTINCT "t1"."pid", "t1"."qty" FROM "supplies" "t1" WHERE "t1"."sid" = ? OR "t1"."sid" = ?',
    );
    expect(compiled.params).toEqual(['S1', 'S2']);
  });
});
