import { describe, it, expect } from 'vitest';
import { BmgSql } from '../../src';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: matching', () => {
  const { adapter, suppliers, supplies, parts } = buildFixtures();

  it('matching.01 — Single-key semi-join', () => {
    const rel = suppliers.matching(supplies, ['sid']);
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE EXISTS (SELECT ? AS "_exists" FROM "supplies" "t2" WHERE "t1"."sid" = "t2"."sid")',
    );
    expect(compiled.params).toEqual([1]);
  });

  it('matching.02 — Empty key list (right-is-non-empty)', () => {
    const rel = suppliers.matching(supplies, []);
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE EXISTS (SELECT ? AS "_exists" FROM "supplies" "t3" WHERE 1 = 1)',
    );
    expect(compiled.params).toEqual([1]);
  });

  it('matching.03 — Multi-attribute key', () => {
    const rel = suppliers.matching(suppliers, ['sid', 'name']);
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE EXISTS (SELECT ? AS "_exists" FROM "suppliers" "t4" WHERE "t1"."sid" = "t4"."sid" AND "t1"."name" = "t4"."name")',
    );
    expect(compiled.params).toEqual([1]);
  });

  it('matching.04 — Matching against a restricted relation', () => {
    const rel = suppliers.matching(supplies.restrict({ sid: 'S1' }), ['sid']);
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE EXISTS (SELECT ? AS "_exists" FROM "supplies" "t5" WHERE "t5"."sid" = ? AND "t1"."sid" = "t5"."sid")',
    );
    expect(compiled.params).toEqual([1, 'S1']);
  });

  it('matching.05 — Matching against a projection', () => {
    const rel = suppliers.matching(parts.project(['name']), ['name']);
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE EXISTS (SELECT ? AS "_exists" FROM "parts" "t6" WHERE "t1"."name" = "t6"."name")',
    );
    expect(compiled.params).toEqual([1]);
  });

  it('matching.06 — Matching against an inner-join', () => {
    const rel = suppliers.matching(supplies.join(parts, ['pid']), ['sid']);
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE EXISTS (SELECT ? AS "_exists" FROM "supplies" "t7" JOIN "parts" "t8"' +
      ' ON "t7"."pid" = "t8"."pid" WHERE "t1"."sid" = "t7"."sid")',
    );
    expect(compiled.params).toEqual([1]);
  });

  it('matching.07 — Against a native SQL relation', () => {
    const sidsOfLondonSuppliers = BmgSql.fromSubquery<{ sid: string }>(
      adapter,
      'SELECT sid FROM suppliers WHERE city = ?',
      ['sid'],
      { params: ['London'] },
    );
    const rel = suppliers.matching(sidsOfLondonSuppliers, ['sid']);
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE EXISTS (SELECT ? AS "_exists" FROM (SELECT sid FROM suppliers WHERE city = ?) "t9"' +
      ' WHERE "t1"."sid" = "t9"."sid")',
    );
    expect(compiled.params).toEqual([1, 'London']);
  });
});
