import { describe, it, expect, expectTypeOf } from 'vitest';
import type { AsyncRelation } from '@enspirit/bmg-js';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: rename', () => {
  const { suppliers } = buildFixtures();

  it('rename.01 — Rename a single attribute', () => {
    const rel = suppliers.rename({ name: 'firstname' } as const);
    expectTypeOf(rel).toEqualTypeOf<
      AsyncRelation<{ sid: string; firstname: string; city: string; status: number }>
    >();
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name" AS "firstname", "t1"."city", "t1"."status" FROM "suppliers" "t1"',
    );
  });

  it('rename.02 — Rename after project (DISTINCT preserved)', () => {
    const rel = suppliers.project(['name']).rename({ name: 'firstname' } as const);
    expectTypeOf(rel).toEqualTypeOf<AsyncRelation<{ firstname: string }>>();
    expect(rel.toSql().sql).toBe(
      'SELECT DISTINCT "t1"."name" AS "firstname" FROM "suppliers" "t1"',
    );
  });

  it('rename.03 — restrict then rename (predicate on underlying column)', () => {
    const rel = suppliers.restrict({ name: 'Smith' }).rename({ name: 'firstname' } as const);
    expectTypeOf(rel).toEqualTypeOf<
      AsyncRelation<{ sid: string; firstname: string; city: string; status: number }>
    >();
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name" AS "firstname", "t1"."city", "t1"."status" FROM "suppliers" "t1" WHERE "t1"."name" = ?',
    );
    expect(compiled.params).toEqual(['Smith']);
  });

  // rename.04 is an identical duplicate of rename.03 in the upstream YAML.
  it('rename.04 — Duplicate of rename.03 upstream (ported for fidelity)', () => {
    const rel = suppliers.restrict({ name: 'Smith' }).rename({ name: 'firstname' } as const);
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name" AS "firstname", "t1"."city", "t1"."status" FROM "suppliers" "t1" WHERE "t1"."name" = ?',
    );
    expect(compiled.params).toEqual(['Smith']);
  });
});
