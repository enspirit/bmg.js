import { describe, it, expect } from 'vitest';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: suffix', () => {
  const { suppliers } = buildFixtures();

  it('suffix.01 — Suffix all attribute names with `_supplier`', () => {
    const rel = suppliers.suffix('_supplier');
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid" AS "sid_supplier",' +
      ' "t1"."name" AS "name_supplier",' +
      ' "t1"."city" AS "city_supplier",' +
      ' "t1"."status" AS "status_supplier"' +
      ' FROM "suppliers" "t1"',
    );
  });
});
