import { describe, it, expect } from 'vitest';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: prefix', () => {
  const { suppliers } = buildFixtures();

  it('prefix.01 — Prefix all attribute names with `supplier_`', () => {
    const rel = suppliers.prefix('supplier_');
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid" AS "supplier_sid",' +
      ' "t1"."name" AS "supplier_name",' +
      ' "t1"."city" AS "supplier_city",' +
      ' "t1"."status" AS "supplier_status"' +
      ' FROM "suppliers" "t1"',
    );
  });
});
