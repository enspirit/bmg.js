import { describe, it, expect } from 'vitest';
import { Pred } from '@enspirit/predicate';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: restrict', () => {
  const { suppliers } = buildFixtures();

  it('restrict.01 — Equality on single attribute', () => {
    const rel = suppliers.restrict({ sid: 'S1' });
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE "t1"."sid" = ?',
    );
    expect(compiled.params).toEqual(['S1']);
  });

  it('restrict.02 — IN with explicit list of values', () => {
    const rel = suppliers.restrict(Pred.in('sid', ['S1', 'S2']));
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE "t1"."sid" IN (?, ?)',
    );
    expect(compiled.params).toEqual(['S1', 'S2']);
  });

  it('restrict.03 — IN list mixing NULL and values', () => {
    const rel = suppliers.restrict(Pred.in('sid', [null, 'S1', 'S2']));
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE ("t1"."sid" IS NULL OR "t1"."sid" IN (?, ?))',
    );
    expect(compiled.params).toEqual(['S1', 'S2']);
  });

  // restrict.04 — minor cosmetic delta: bmg-rb degrades the 1-element
  // post-split IN to `=` (`IS NULL OR sid = 'S2'`); bmg-sql keeps
  // `IN (?)`. Semantically equivalent — same query, same rows.
  it('restrict.04 — NULL + single value', () => {
    const rel = suppliers.restrict(Pred.in('sid', [null, 'S2']));
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE ("t1"."sid" IS NULL OR "t1"."sid" IN (?))',
    );
    expect(compiled.params).toEqual(['S2']);
  });

  it('restrict.05 — List containing only NULL', () => {
    const rel = suppliers.restrict(Pred.in('sid', [null]));
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE "t1"."sid" IS NULL',
    );
    expect(compiled.params).toEqual([]);
  });

  it('restrict.06 — Chained restricts combine via AND', () => {
    const rel = suppliers
      .restrict(Pred.in('sid', ['S1', 'S2']))
      .restrict({ sid: 'S3' });
    const compiled = rel.toSql();
    // bmg-rb emits the outer restrict first: `(sid = 'S3') AND (sid IN (...))`.
    // bmg-sql emits the inner first: `sid IN (?, ?) AND sid = ?`. AND is
    // commutative so this is the same query.
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE "t1"."sid" IN (?, ?) AND "t1"."sid" = ?',
    );
    expect(compiled.params).toEqual(['S1', 'S2', 'S3']);
  });

  it('restrict.07 — Restrict after rename', () => {
    // buildSelectQualifier resolves `firstname` via the select list to
    // its underlying column `name`, so the WHERE references the physical
    // column as bmg-rb does.
    const rel = suppliers
      .rename({ name: 'firstname' } as const)
      .restrict({ firstname: 'Smith' });
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name" AS "firstname", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ' WHERE "t1"."name" = ?',
    );
    expect(compiled.params).toEqual(['Smith']);
  });

  it('restrict.08 — LIKE via Predicate.match', () => {
    const rel = suppliers.restrict(Pred.match('city', 'Lon'));
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ` WHERE "t1"."city" LIKE ? ESCAPE '\\'`,
    );
    expect(compiled.params).toEqual(['%Lon%']);
  });

  it('restrict.09 — Case-insensitive LIKE', () => {
    const rel = suppliers.restrict(Pred.match('city', 'Lon', { caseSensitive: false }));
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ` WHERE UPPER("t1"."city") LIKE UPPER(?) ESCAPE '\\'`,
    );
    expect(compiled.params).toEqual(['%Lon%']);
  });

  it('restrict.10 — Restrict after UNION (per-branch push-down)', () => {
    const rel = suppliers.union(suppliers).restrict({ city: 'London' });
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1" WHERE "t1"."city" = ?)' +
      ' UNION ' +
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1" WHERE "t1"."city" = ?)',
    );
    expect(compiled.params).toEqual(['London', 'London']);
  });

  // restrict.11 — still divergent on bmg-rb's aggressive contradiction
  // collapse: bmg-rb detects that the Paris branch + outer London filter
  // is unsatisfiable and drops the branch, yielding a single SELECT. bmg-sql
  // now pushes the outer restrict into both branches (correct) but doesn't
  // fold `city='Paris' AND city='London'` into a contradiction, so both
  // branches remain.
  it('restrict.11 — Restrict pre- and post-UNION (DIVERGENT: no contradiction folding)', () => {
    const rel = suppliers
      .restrict({ city: 'London' })
      .union(suppliers.restrict({ city: 'Paris' }))
      .restrict({ city: 'London' });
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1" WHERE "t1"."city" = ? AND "t1"."city" = ?)' +
      ' UNION ' +
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1" WHERE "t1"."city" = ? AND "t1"."city" = ?)',
    );
    expect(compiled.params).toEqual(['London', 'London', 'Paris', 'London']);
  });
});
