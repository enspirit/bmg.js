import { describe, it, expect, expectTypeOf } from 'vitest';
import type { AsyncRelation } from '@enspirit/bmg-js';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: extend', () => {
  const { supplies } = buildFixtures();

  it('extend.01 — Add a column aliasing an existing attribute', () => {
    const rel = supplies.extend({ supplier_id: 'sid' as const });
    expectTypeOf(rel).toEqualTypeOf<
      AsyncRelation<{ sid: string; pid: string; qty: number; supplier_id: 'sid' }>
    >();
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."pid", "t1"."qty", "t1"."sid" AS "supplier_id" FROM "supplies" "t1"',
    );
  });
});
