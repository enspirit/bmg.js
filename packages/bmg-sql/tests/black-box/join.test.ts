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

  // join.02 — blocked: requires `prefix` push-down (currently falls back
  // to in-memory). Would produce joined SQL without the prefix shape.
  it.todo('join.02 — Join after rename + prefix (blocked: prefix push-down)');

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
      ' "t2"."name", "t2"."city", "t2"."status",' +
      ' "t3"."color", "t3"."weight"' +
      ' FROM "supplies" "t1"' +
      ' JOIN "suppliers" "t2" ON "t1"."sid" = "t2"."sid"' +
      ' JOIN "parts" "t3" ON "t1"."pid" = "t3"."pid"',
    );
  });

  it('join.05 — Chained joins (4 relations)', () => {
    const rel = supplies
      .join(suppliers, ['sid'])
      .join(parts, ['pid'])
      .join(cities, ['city']);
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."pid", "t1"."qty",' +
      ' "t4"."name", "t4"."city", "t4"."status",' +
      ' "t5"."color", "t5"."weight",' +
      ' "t6"."country"' +
      ' FROM "supplies" "t1"' +
      ' JOIN "suppliers" "t4" ON "t1"."sid" = "t4"."sid"' +
      ' JOIN "parts" "t5" ON "t1"."pid" = "t5"."pid"' +
      ' JOIN "cities" "t6" ON "t4"."city" = "t6"."city"',
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

  // join.08-.09 — cross-join push-down. bmg-sql's cross_join currently
  // falls back to in-memory (no CROSS JOIN emission); .join(other, [])
  // similarly falls back. Both blocked pending CROSS JOIN push-down.
  it.todo('join.08 — Cross join (empty key list) (blocked: CROSS JOIN push-down)');
  it.todo('join.09 — Cross then inner (blocked: CROSS JOIN push-down)');

  // join.10 — blocked: requires `prefix` push-down.
  it.todo('join.10 — Join with hash-form key + prefix (blocked: prefix push-down)');

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
      ' "t9"."name", "t9"."color", "t9"."weight", "t9"."city"' +
      ' FROM "supplies" "t1" JOIN "parts" "t9" ON "t1"."pid" = "t9"."pid"' +
      ' WHERE "t1"."pid" = ? AND "t1"."pid" = ?',
    );
    expect(compiled.params).toEqual(['P1', 'P1']);
  });

  it('join.12 — Restricts on different attributes', () => {
    const rel = supplies.restrict({ pid: 'P1' }).join(parts.restrict({ name: 'Nut' }), ['pid']);
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."pid", "t1"."qty",' +
      ' "t10"."name", "t10"."color", "t10"."weight", "t10"."city"' +
      ' FROM "supplies" "t1" JOIN "parts" "t10" ON "t1"."pid" = "t10"."pid"' +
      ' WHERE "t1"."pid" = ? AND "t10"."name" = ?',
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
      ' FROM "supplies" "t1" JOIN "supplies" "t11" ON "t1"."sid" = "t11"."sid"' +
      ' WHERE "t1"."pid" = ? AND "t1"."pid" = ?',
    );
    expect(compiled.params).toEqual(['P1', 'P2']);
  });

  it('join.14 — Self-join on all key attributes (identity join)', () => {
    const rel = suppliers.join(suppliers, ['sid', 'name', 'city']);
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status"' +
      ' FROM "suppliers" "t1" JOIN "suppliers" "t9"' +
      ' ON "t1"."sid" = "t9"."sid"' +
      ' AND "t1"."name" = "t9"."name"' +
      ' AND "t1"."city" = "t9"."city"',
    );
  });
});
