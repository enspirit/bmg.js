import { describe, it, expect } from 'vitest';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: page', () => {
  const { suppliers, supplies } = buildFixtures();

  it('page.01 — First page, asc order by two attrs', () => {
    const rel = suppliers.page(['name', 'sid'], 1, { pageSize: 2 });
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status"' +
      ' FROM "suppliers" "t1"' +
      ' ORDER BY "t1"."name" ASC, "t1"."sid" ASC LIMIT 2',
    );
  });

  it('page.02 — Later page emits OFFSET', () => {
    const rel = suppliers.page(['name', 'sid'], 3, { pageSize: 2 });
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status"' +
      ' FROM "suppliers" "t1"' +
      ' ORDER BY "t1"."name" ASC, "t1"."sid" ASC LIMIT 2 OFFSET 4',
    );
  });

  it('page.03 — Restrict + page', () => {
    const rel = suppliers
      .restrict({ city: 'London' })
      .page(['name', 'sid'], 1, { pageSize: 2 });
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status"' +
      ' FROM "suppliers" "t1" WHERE "t1"."city" = ?' +
      ' ORDER BY "t1"."name" ASC, "t1"."sid" ASC LIMIT 2',
    );
    expect(compiled.params).toEqual(['London']);
  });

  it('page.04 — Rename + page resolves aliased attr to underlying column', () => {
    // bmg-rb emits ORDER BY on the underlying `sid`, not the alias `id`,
    // because findColumnRef resolves alias → underlying column_ref from
    // the current select list. This is the same optimization bmg-rb has.
    // (Same mechanism also makes the broken restrict-after-rename case
    // work for renamed-column ORDER BYs, but not for WHERE — see
    // restrict.07 note.)
    const rel = suppliers
      .rename({ sid: 'id' } as const)
      .page(['id', 'name'], 1, { pageSize: 2 });
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid" AS "id", "t1"."name", "t1"."city", "t1"."status"' +
      ' FROM "suppliers" "t1"' +
      ' ORDER BY "t1"."sid" ASC, "t1"."name" ASC LIMIT 2',
    );
  });

  it('page.05 — Summarize + page (derived-table wrap)', () => {
    // bmg-rb wraps the summarize in `WITH t2 AS (...) SELECT ... FROM t2
    // ORDER BY ... LIMIT`. bmg-sql uses a derived table in FROM — same
    // precedent as minus.03 / summarize.06. Same semantics; the wrap is
    // necessary because ORDER BY on an aggregate alias is easier when
    // the aggregate is already projected as a plain column of the outer
    // relation.
    const rel = supplies
      .summarize(['sid'], { qty: { op: 'max', attr: 'qty' } })
      .page(['qty'], 1, { pageSize: 1 });
    expect(rel.toSql().sql).toBe(
      'SELECT "t2"."sid", "t2"."qty" FROM ' +
      '(SELECT "t1"."sid", MAX("t1"."qty") AS "qty" FROM "supplies" "t1" GROUP BY "t1"."sid")' +
      ' "t2" ORDER BY "t2"."qty" ASC LIMIT 1',
    );
  });
});
