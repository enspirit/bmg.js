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

  // union.03 — UNION ALL via `all: true` option
  // Blocked: Relation.union() in bmg core does not accept an options arg.
  // Surfacing it is a cross-package change (core types + Memory + async Base)
  // out of scope for test porting.
  it.todo('union.03 — UNION ALL via all: true option (blocked: cross-package API change needed)');
});
