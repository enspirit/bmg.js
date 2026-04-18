import { describe, it, expect, expectTypeOf } from 'vitest';
import type { AsyncRelation } from '@enspirit/bmg-js';
import { buildFixtures } from './helpers/fixtures';

// bmg-rb: `:qty => :sum` means "aggregate qty via SUM, named qty".
// bmg-js equivalent: verbose `AggregatorSpec` form `{ qty: { op: 'sum', attr: 'qty' } }`.
// The short-form `{ qty: 'sum' }` produces `SUM(*)` in bmg-sql (attr is undefined)
// — NOT equivalent to bmg-rb's column-name-as-convention behaviour. Tests use the
// verbose form where a column is needed; short `'count'` is fine (COUNT(*)).
const SUM_QTY = { op: 'sum', attr: 'qty' } as const;

describe('black-box: summarize', () => {
  const { suppliers, supplies } = buildFixtures();

  it('summarize.01 — Aggregate with empty grouping (no GROUP BY)', () => {
    const rel = supplies.summarize([], { qty: SUM_QTY, count: 'count' });
    expectTypeOf(rel).toEqualTypeOf<AsyncRelation<{ qty: unknown; count: unknown }>>();
    expect(rel.toSql().sql).toBe(
      'SELECT SUM("t1"."qty") AS "qty", COUNT(*) AS "count" FROM "supplies" "t1"',
    );
  });

  it('summarize.02 — Group-by single attribute', () => {
    const rel = supplies.summarize(['sid'], { qty: SUM_QTY, count: 'count' });
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", SUM("t1"."qty") AS "qty", COUNT(*) AS "count"' +
      ' FROM "supplies" "t1" GROUP BY "t1"."sid"',
    );
  });

  it('summarize.03 — Group-by multiple attributes', () => {
    const rel = supplies.summarize(['sid', 'pid'], { qty: SUM_QTY, count: 'count' });
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."pid", SUM("t1"."qty") AS "qty", COUNT(*) AS "count"' +
      ' FROM "supplies" "t1" GROUP BY "t1"."sid", "t1"."pid"',
    );
  });

  it('summarize.04 — Restrict pushed down before GROUP BY', () => {
    const rel = supplies
      .restrict({ pid: 'P1' })
      .summarize(['sid'], { qty: SUM_QTY, count: 'count' });
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", SUM("t1"."qty") AS "qty", COUNT(*) AS "count"' +
      ' FROM "supplies" "t1" WHERE "t1"."pid" = ? GROUP BY "t1"."sid"',
    );
    expect(compiled.params).toEqual(['P1']);
  });

  // summarize.05 — DIVERGENT (known bug): bmg-sql emits the join predicate
  // as `"t1"."sid" = "t1"."sid"` instead of `"t1"."sid" = "t2"."sid"` — the
  // same join-alias bug that blocks left_join.* and matching.06. Marked
  // with it.fails() against the correct expected SQL, so when the bug is
  // fixed in processJoin/buildJoinPredicate, this will start passing and
  // .fails() will invert to alert us.
  it.fails('summarize.05 — Summarize over a join (known bug: wrong join ON aliases)', () => {
    const rel = suppliers
      .join(supplies, ['sid'])
      .summarize(['sid'], { qty: SUM_QTY, count: 'count' });
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", SUM("t2"."qty") AS "qty", COUNT(*) AS "count"' +
      ' FROM "suppliers" "t1" JOIN "supplies" "t2" ON "t1"."sid" = "t2"."sid"' +
      ' GROUP BY "t1"."sid"',
    );
  });

  it('summarize.06 — Restrict after summarize (derived-table wrap)', () => {
    // bmg-rb uses `WITH t2 AS (...) SELECT ... FROM t2 WHERE ...`; bmg-sql
    // uses a derived table in FROM. Same semantics; same precedent as
    // minus.03. The derived-table wrap requalifies the select list fully,
    // which is why every projected column is listed (not a star).
    const rel = supplies
      .summarize(['sid'], { qty: SUM_QTY, count: 'count' })
      .restrict({ qty: 2 });
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t2"."sid", "t2"."qty", "t2"."count" FROM ' +
      '(SELECT "t1"."sid", SUM("t1"."qty") AS "qty", COUNT(*) AS "count"' +
      ' FROM "supplies" "t1" GROUP BY "t1"."sid") "t2"' +
      ' WHERE "t2"."qty" = ?',
    );
    expect(compiled.params).toEqual([2]);
  });

  // summarize.07 — Blocked: layered bugs. The join-alias bug fires
  // (`ON "t1"."sid" = "t1"."sid"`), the inner subquery is not requalified
  // (re-uses `"t1"` inside it, colliding with the outer `t1`), and the
  // outer WHERE references the wrong alias (`"t1"."qty"` when qty lives
  // on the right-side derived table). All three are rooted in the same
  // processJoin / processRequalify refactor that blocks left_join. Not
  // articulable as a single correct-SQL expected string without fixing
  // the underlying processor family.
  it.todo('summarize.07 — Join against a summarized relation (blocked: join alias + subquery requalify bugs)');

  it('summarize.08 — Min via AggregatorSpec helper form', () => {
    const rel = supplies.summarize([], { min_qty: { op: 'min', attr: 'qty' } });
    expect(rel.toSql().sql).toBe(
      'SELECT MIN("t1"."qty") AS "min_qty" FROM "supplies" "t1"',
    );
  });

  // summarize.09 — bmg-rb's `:qty => :distinct_count` short form has no
  // direct bmg-js equivalent: the short form `'distinct_count'` would
  // mean "distinct-count on SUM(*)" with no column (see the note at the
  // top of this file re: `{ qty: 'sum' }` vs `{ qty: { op: 'sum',
  // attr: 'qty' } }`). The verbose form is the single API.
  it('summarize.09 — distinct_count (verbose form, result named qty)', () => {
    const rel = supplies.summarize([], { qty: { op: 'distinct_count', attr: 'qty' } });
    expect(rel.toSql().sql).toBe(
      'SELECT COUNT(DISTINCT "t1"."qty") AS "qty" FROM "supplies" "t1"',
    );
  });

  it('summarize.10 — distinct_count helper form (result named count)', () => {
    const rel = supplies.summarize([], { count: { op: 'distinct_count', attr: 'qty' } });
    expect(rel.toSql().sql).toBe(
      'SELECT COUNT(DISTINCT "t1"."qty") AS "count" FROM "supplies" "t1"',
    );
  });
});
