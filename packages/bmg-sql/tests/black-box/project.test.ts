import { describe, it, expect, expectTypeOf } from 'vitest';
import type { AsyncRelation } from '@enspirit/bmg-js';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: project', () => {
  const { suppliers } = buildFixtures();

  it('project.01 — Project key → no DISTINCT', () => {
    const rel = suppliers.project(['sid', 'name']);
    expectTypeOf(rel).toEqualTypeOf<AsyncRelation<{ sid: string; name: string }>>();
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name" FROM "suppliers" "t1"',
    );
  });

  it('project.02 — Project non-key → DISTINCT', () => {
    const rel = suppliers.project(['name']);
    expectTypeOf(rel).toEqualTypeOf<AsyncRelation<{ name: string }>>();
    expect(rel.toSql().sql).toBe(
      'SELECT DISTINCT "t1"."name" FROM "suppliers" "t1"',
    );
  });

  it('project.03 — allbut then project → DISTINCT propagates', () => {
    const rel = suppliers.allbut(['sid', 'status']).project(['name']);
    expectTypeOf(rel).toEqualTypeOf<AsyncRelation<{ name: string }>>();
    expect(rel.toSql().sql).toBe(
      'SELECT DISTINCT "t1"."name" FROM "suppliers" "t1"',
    );
  });
});
