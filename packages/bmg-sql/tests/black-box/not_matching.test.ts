import { describe, it, expect } from 'vitest';
import { BmgSql } from '../../src';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: not_matching', () => {
  const { adapter, suppliers, supplies } = buildFixtures();

  it('not_matching.01 — Anti-join on single key', () => {
    const rel = suppliers.not_matching(supplies, ['sid']);
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE NOT EXISTS (SELECT ? AS "_exists" FROM "supplies" "t2" WHERE "t1"."sid" = "t2"."sid")',
    );
    expect(compiled.params).toEqual([1]);
  });

  it('not_matching.02 — Empty key list (right-is-empty)', () => {
    const rel = suppliers.not_matching(supplies, []);
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE NOT EXISTS (SELECT ? AS "_exists" FROM "supplies" "t3" WHERE 1 = 1)',
    );
    expect(compiled.params).toEqual([1]);
  });

  it('not_matching.03 — Multi-attribute key', () => {
    const rel = suppliers.not_matching(suppliers, ['sid', 'name']);
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE NOT EXISTS (SELECT ? AS "_exists" FROM "suppliers" "t4" WHERE "t1"."sid" = "t4"."sid" AND "t1"."name" = "t4"."name")',
    );
    expect(compiled.params).toEqual([1]);
  });

  it('not_matching.04 — Against a native SQL relation', () => {
    const sidsOfLondonSuppliers = BmgSql.fromSubquery<{ sid: string }>(
      adapter,
      'SELECT sid FROM suppliers WHERE city = ?',
      ['sid'],
      { params: ['London'] },
    );
    const rel = suppliers.not_matching(sidsOfLondonSuppliers, ['sid']);
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE NOT EXISTS (SELECT ? AS "_exists" FROM (SELECT sid FROM suppliers WHERE city = ?) "t5"' +
      ' WHERE "t1"."sid" = "t5"."sid")',
    );
    expect(compiled.params).toEqual([1, 'London']);
  });
});
