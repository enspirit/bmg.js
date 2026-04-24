import { describe, it, expect } from 'vitest';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: union', () => {
  const { suppliers } = buildFixtures();

  it('union.01 — Self-union (deduped via UNION)', () => {
    const rel = suppliers.union(suppliers);
    expect(rel.toSql().sql).toBe(
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1")' +
      ' UNION ' +
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1")',
    );
  });

  it('union.02 — Chained union', () => {
    const rel = suppliers.union(suppliers).union(suppliers);
    expect(rel.toSql().sql).toBe(
      '((SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1")' +
      ' UNION ' +
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"))' +
      ' UNION ' +
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1")',
    );
  });

  it('union.03 — UNION ALL via all: true option', () => {
    const rel = suppliers.union(suppliers, { all: true });
    expect(rel.toSql().sql).toBe(
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1")' +
      ' UNION ALL ' +
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1")',
    );
  });
});
