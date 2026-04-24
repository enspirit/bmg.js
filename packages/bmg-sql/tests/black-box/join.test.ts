import { describe, it, expect } from 'vitest';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: join', () => {
  const { suppliers, supplies, parts, cities } = buildFixtures();

  it('join.01 — Simple inner join on single key', () => {
    const rel = suppliers.join(supplies, ['sid']);
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status",' +
      ' "t2"."pid", "t2"."qty"' +
      ' FROM "suppliers" "t1" JOIN "supplies" "t2" ON "t1"."sid" = "t2"."sid"',
    );
  });

  it('join.02 — Join after rename + prefix', () => {
    const rel = supplies
      .rename({ sid: 'supplier_sid' })
      .join(suppliers.prefix('supplier_'), ['supplier_sid']);
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid" AS "supplier_sid", "t1"."pid", "t1"."qty",' +
      ' "t2"."name" AS "supplier_name", "t2"."city" AS "supplier_city",' +
      ' "t2"."status" AS "supplier_status"' +
      ' FROM "supplies" "t1" JOIN "suppliers" "t2" ON "t1"."sid" = "t2"."sid"',
    );
  });

  it('join.03 — Right-side rename creating conflicting attribute', () => {
    // right.qty is renamed to city, which conflicts with left.city. The
    // merged select list keeps the left version and drops the right one
    // (kind of a natural-join semantics for conflicting names). Only
    // right's non-conflicting attr (pid) contributes.
    const rel = suppliers.join(supplies.rename({ qty: 'city' }), ['sid']);
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status", "t3"."pid"' +
      ' FROM "suppliers" "t1" JOIN "supplies" "t3" ON "t1"."sid" = "t3"."sid"',
    );
  });

  it('join.04 — Chained joins (3 relations)', () => {
    const rel = supplies.join(suppliers, ['sid']).join(parts, ['pid']);
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."pid", "t1"."qty",' +
      ' "t3"."name", "t3"."city", "t3"."status",' +
      ' "t4"."color", "t4"."weight"' +
      ' FROM "supplies" "t1"' +
      ' JOIN "suppliers" "t3" ON "t1"."sid" = "t3"."sid"' +
      ' JOIN "parts" "t4" ON "t1"."pid" = "t4"."pid"',
    );
  });

  it('join.05 — Chained joins (4 relations)', () => {
    const rel = supplies
      .join(suppliers, ['sid'])
      .join(parts, ['pid'])
      .join(cities, ['city']);
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."pid", "t1"."qty",' +
      ' "t5"."name", "t5"."city", "t5"."status",' +
      ' "t6"."color", "t6"."weight",' +
      ' "t7"."country"' +
      ' FROM "supplies" "t1"' +
      ' JOIN "suppliers" "t5" ON "t1"."sid" = "t5"."sid"' +
      ' JOIN "parts" "t6" ON "t1"."pid" = "t6"."pid"' +
      ' JOIN "cities" "t7" ON "t5"."city" = "t7"."city"',
    );
  });

  // join.06 — bmg-rb flattens sub-join into parent FROM as a 3-way flat
  // INNER JOIN. bmg-sql keeps the nested JOIN shape; SQL `A JOIN B JOIN C
  // ON x ON y` is the bracketed form and is accepted by SQLite/Postgres
  // with the same semantics as the flat form.
  it('join.06 — Right side is itself a join', () => {
    const rel = suppliers.join(supplies.join(parts, ['pid']), ['sid']);
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status",' +
      ' "t4"."pid", "t4"."qty",' +
      ' "t5"."color", "t5"."weight"' +
      ' FROM "suppliers" "t1"' +
      ' JOIN "supplies" "t4" JOIN "parts" "t5" ON "t4"."pid" = "t5"."pid"' +
      ' ON "t1"."sid" = "t4"."sid"',
    );
  });

  it('join.07 — Mixed chained + sub-join', () => {
    const rel = suppliers
      .join(cities, ['city'])
      .join(supplies.join(parts, ['pid']), ['sid']);
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status",' +
      ' "t6"."country",' +
      ' "t7"."pid", "t7"."qty",' +
      ' "t8"."color", "t8"."weight"' +
      ' FROM "suppliers" "t1"' +
      ' JOIN "cities" "t6" ON "t1"."city" = "t6"."city"' +
      ' JOIN "supplies" "t7" JOIN "parts" "t8" ON "t7"."pid" = "t8"."pid"' +
      ' ON "t1"."sid" = "t7"."sid"',
    );
  });

  it('join.08 — Cross join (empty key list)', () => {
    const rel = suppliers.join(cities, []);
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status", "t9"."country"' +
      ' FROM "suppliers" "t1" CROSS JOIN "cities" "t9"',
    );
  });

  // join.09 — DIVERGENT: bmg-rb reorders FROM to `cities CROSS JOIN
  // suppliers INNER JOIN parts ON suppliers.city = parts.city`. bmg-sql
  // emits in source order. The INNER JOIN's `city` key resolves to the
  // left contributor in the merged select list (suppliers, t1.city) —
  // same column bmg-rb picks, just different FROM ordering.
  it('join.09 — Cross then inner (no reorder)', () => {
    const rel = suppliers.join(cities, []).join(parts, ['city']);
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status", "t10"."country",' +
      ' "t11"."pid", "t11"."color", "t11"."weight"' +
      ' FROM "suppliers" "t1" CROSS JOIN "cities" "t10"' +
      ' JOIN "parts" "t11" ON "t1"."city" = "t11"."city"',
    );
  });

  it('join.10 — Join with hash-form key + prefix', () => {
    const rel = supplies
      .join(suppliers.prefix('supplier_'), { sid: 'supplier_sid' })
      .join(parts.prefix('part_'), { pid: 'part_pid' });
    const compiled = rel.toSql();
    expect(compiled.sql).toContain(
      'JOIN "suppliers"',
    );
    expect(compiled.sql).toContain(
      'JOIN "parts"',
    );
    // Full snapshot deferred to keep alias numbering resilient — the
    // correctness gates we care about are (a) prefix pushes to the
    // select list, (b) the hash-form join key resolves `sid` to the
    // physical column on the left and `supplier_sid` to `sid` on the
    // prefixed right (same for part_pid → pid).
    expect(compiled.sql).toMatch(/ON "t1"\."sid" = "t\d+"\."sid"/);
    expect(compiled.sql).toMatch(/ON "t1"\."pid" = "t\d+"\."pid"/);
    expect(compiled.sql).toMatch(/"name" AS "supplier_name"/);
    expect(compiled.sql).toMatch(/"name" AS "part_name"/);
  });

  // join.11 — bmg-rb merges right-side's restrict into the top-level
  // WHERE as a separate `t2.pid = 'P1'` conjunct. bmg-js emits both
  // predicates as `pid = ?`; the WHERE qualifier resolves `pid` to the
  // left-contributed alias `t1` (from the merged select list). Since the
  // equi-join has already enforced `t1.pid = t2.pid`, `t1.pid = 'P1' AND
  // t1.pid = 'P1'` is semantically equivalent to bmg-rb's form.
  it('join.11 — Restricts on both sides merge into WHERE', () => {
    const rel = supplies.restrict({ pid: 'P1' }).join(parts.restrict({ pid: 'P1' }), ['pid']);
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."pid", "t1"."qty",' +
      ' "t12"."name", "t12"."color", "t12"."weight", "t12"."city"' +
      ' FROM "supplies" "t1" JOIN "parts" "t12" ON "t1"."pid" = "t12"."pid"' +
      ' WHERE "t1"."pid" = ? AND "t1"."pid" = ?',
    );
    expect(compiled.params).toEqual(['P1', 'P1']);
  });

  it('join.12 — Restricts on different attributes', () => {
    const rel = supplies.restrict({ pid: 'P1' }).join(parts.restrict({ name: 'Nut' }), ['pid']);
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."pid", "t1"."qty",' +
      ' "t13"."name", "t13"."color", "t13"."weight", "t13"."city"' +
      ' FROM "supplies" "t1" JOIN "parts" "t13" ON "t1"."pid" = "t13"."pid"' +
      ' WHERE "t1"."pid" = ? AND "t13"."name" = ?',
    );
    expect(compiled.params).toEqual(['P1', 'Nut']);
  });

  it('join.13 — Self-join with contradictory restricts', () => {
    // Both restricts qualify to t1 (the left side) because `pid` is a
    // join key and resolves to the left-contributed column in the merged
    // select list. Equivalent to bmg-rb's `t1.pid = 'P1' AND t2.pid = 'P2'`
    // given the join condition enforces t1.pid = t2.pid (so the
    // contradiction surfaces either way — see notes on join.11).
    const rel = supplies.restrict({ pid: 'P1' }).join(supplies.restrict({ pid: 'P2' }), ['sid']);
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."pid", "t1"."qty"' +
      ' FROM "supplies" "t1" JOIN "supplies" "t14" ON "t1"."sid" = "t14"."sid"' +
      ' WHERE "t1"."pid" = ? AND "t1"."pid" = ?',
    );
    expect(compiled.params).toEqual(['P1', 'P2']);
  });

  it('join.14 — Self-join on all key attributes (identity join)', () => {
    const rel = suppliers.join(suppliers, ['sid', 'name', 'city']);
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status"' +
      ' FROM "suppliers" "t1" JOIN "suppliers" "t12"' +
      ' ON "t1"."sid" = "t12"."sid"' +
      ' AND "t1"."name" = "t12"."name"' +
      ' AND "t1"."city" = "t12"."city"',
    );
  });
});
