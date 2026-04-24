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

  // restrict.08 — LIKE via Predicate.match
  // Blocked: @enspirit/predicate does not implement a `match`/LIKE predicate.
  // Adding it is a cross-package change out of scope for test porting.
  it.todo('restrict.08 — LIKE via Predicate.match (blocked: match predicate missing)');

  // restrict.09 — Case-insensitive LIKE via case_sensitive: false
  // Blocked: same as restrict.08.
  it.todo('restrict.09 — Case-insensitive LIKE (blocked: match predicate missing)');

  // restrict.10 — DIVERGENT: bmg-rb pushes the post-union restrict into BOTH
  // branches. bmg-sql wraps the UNION in a subquery and applies the restrict
  // at the outer level. Results are the same but the emitted SQL shape
  // differs and doesn't match bmg-rb's per-branch push-down.
  it('restrict.10 — Restrict after UNION (DIVERGENT: no per-branch push-down)', () => {
    const rel = suppliers.union(suppliers).restrict({ city: 'London' });
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t2".* FROM ' +
      '((SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1")' +
      ' UNION ' +
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"))' +
      ' "t2" WHERE "t2"."city" = ?',
    );
    expect(compiled.params).toEqual(['London']);
  });

  // restrict.11 — DIVERGENT: bmg-rb collapses the whole chain to a single
  // restricted branch because the trailing `restrict(city='London')` plus
  // the Paris-branch inner restrict combine to an unsatisfiable predicate
  // on the Paris branch. bmg-sql does none of this: both branches keep
  // their pre-union restricts, the outer restrict wraps the union.
  it('restrict.11 — Restrict pre- and post-UNION (DIVERGENT: no aggressive branch collapse)', () => {
    const rel = suppliers
      .restrict({ city: 'London' })
      .union(suppliers.restrict({ city: 'Paris' }))
      .restrict({ city: 'London' });
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t3".* FROM ' +
      '((SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1" WHERE "t1"."city" = ?)' +
      ' UNION ' +
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1" WHERE "t1"."city" = ?))' +
      ' "t3" WHERE "t3"."city" = ?',
    );
    expect(compiled.params).toEqual(['London', 'Paris', 'London']);
  });
});
