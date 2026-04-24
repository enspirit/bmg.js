import { describe, it, expect } from 'vitest';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: left_join', () => {
  const { suppliers, supplies, parts } = buildFixtures();

  it('left_join.01 — Simple left join, no defaults', () => {
    const rel = suppliers.left_join(supplies, ['sid']);
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status",' +
      ' "t2"."pid", "t2"."qty"' +
      ' FROM "suppliers" "t1" LEFT JOIN "supplies" "t2" ON "t1"."sid" = "t2"."sid"',
    );
  });

  it('left_join.02 — Left join with attribute-mapping (hash key)', () => {
    // buildJoinOn resolves `id` on the right side (renamed from `sid`)
    // to the underlying column `sid`, matching bmg-rb's `ON t1.sid = t2.sid`
    // shape. The rename is still visible in the select list.
    const rel = suppliers.left_join(supplies.rename({ sid: 'id' }), { sid: 'id' });
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status",' +
      ' "t3"."sid" AS "id", "t3"."pid", "t3"."qty"' +
      ' FROM "suppliers" "t1" LEFT JOIN "supplies" "t3" ON "t1"."sid" = "t3"."sid"',
    );
  });

  it('left_join.03 — Left join with COALESCE defaults', () => {
    const rel = suppliers.left_join(supplies, ['sid'], { pid: 'P9', qty: 0 });
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status",' +
      ' COALESCE("t4"."pid", ?) AS "pid", COALESCE("t4"."qty", ?) AS "qty"' +
      ' FROM "suppliers" "t1" LEFT JOIN "supplies" "t4" ON "t1"."sid" = "t4"."sid"',
    );
    expect(compiled.params).toEqual(['P9', 0]);
  });

  it('left_join.04 — Chained left joins', () => {
    const rel = supplies.left_join(suppliers, ['sid']).left_join(parts, ['pid']);
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."pid", "t1"."qty",' +
      ' "t2"."name", "t2"."city", "t2"."status",' +
      ' "t3"."color", "t3"."weight"' +
      ' FROM "supplies" "t1"' +
      ' LEFT JOIN "suppliers" "t2" ON "t1"."sid" = "t2"."sid"' +
      ' LEFT JOIN "parts" "t3" ON "t1"."pid" = "t3"."pid"',
    );
  });

  it('left_join.05 — INNER then LEFT mix', () => {
    const rel = supplies.join(suppliers, ['sid']).left_join(parts, ['pid']);
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."pid", "t1"."qty",' +
      ' "t4"."name", "t4"."city", "t4"."status",' +
      ' "t5"."color", "t5"."weight"' +
      ' FROM "supplies" "t1"' +
      ' JOIN "suppliers" "t4" ON "t1"."sid" = "t4"."sid"' +
      ' LEFT JOIN "parts" "t5" ON "t1"."pid" = "t5"."pid"',
    );
  });

  // left_join.06 — DIVERGENT: bmg-rb reorders FROM so INNER appears before
  // LEFT (its LEFT → INNER fold-up optimization). bmg-sql emits the joins
  // in source order (LEFT JOIN then INNER JOIN). Semantically equivalent
  // but literal SQL differs. Keeping as a snapshot of our shape.
  it('left_join.06 — LEFT then INNER mix (no reorder)', () => {
    const rel = supplies.left_join(suppliers, ['sid']).join(parts, ['pid']);
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."pid", "t1"."qty",' +
      ' "t6"."name", "t6"."city", "t6"."status",' +
      ' "t7"."color", "t7"."weight"' +
      ' FROM "supplies" "t1"' +
      ' LEFT JOIN "suppliers" "t6" ON "t1"."sid" = "t6"."sid"' +
      ' JOIN "parts" "t7" ON "t1"."pid" = "t7"."pid"',
    );
  });

  it('left_join.07 — Restrict after left_join (referencing right-side col)', () => {
    const rel = suppliers.left_join(supplies, ['sid']).restrict({ qty: 50 });
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status",' +
      ' "t5"."pid", "t5"."qty"' +
      ' FROM "suppliers" "t1" LEFT JOIN "supplies" "t5" ON "t1"."sid" = "t5"."sid"' +
      ' WHERE "t5"."qty" = ?',
    );
    expect(compiled.params).toEqual([50]);
  });

  it('left_join.08 — Restrict after left_join with defaults → derived-table wrap', () => {
    // bmg-rb wraps the defaulted left_join in a CTE (`WITH t3 AS ...`).
    // bmg-sql uses a derived-table subquery (same precedent as minus.03 /
    // summarize.06 / summarize.07) because the COALESCE makes the select
    // "complex", so the subsequent restrict triggers the isComplex wrap
    // in processWhere. The WHERE operates on the COALESCEd value (via
    // the outer alias), matching bmg-rb's semantics.
    const rel = suppliers
      .left_join(supplies, ['sid'], { pid: 'P9', qty: 1 })
      .restrict({ qty: 50 });
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t7"."sid", "t7"."name", "t7"."city", "t7"."status",' +
      ' "t7"."pid", "t7"."qty" FROM (' +
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status",' +
      ' COALESCE("t6"."pid", ?) AS "pid", COALESCE("t6"."qty", ?) AS "qty"' +
      ' FROM "suppliers" "t1" LEFT JOIN "supplies" "t6" ON "t1"."sid" = "t6"."sid"' +
      ') "t7" WHERE "t7"."qty" = ?',
    );
    expect(compiled.params).toEqual(['P9', 1, 50]);
  });
});
