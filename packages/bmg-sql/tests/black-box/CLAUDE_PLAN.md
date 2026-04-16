# CLAUDE_PLAN.md — port bmg-rb black-box SQL tests

**Read this file at the start of every iteration. Update it at the end.**

This is a self-directed work plan. Port the bmg-rb YAML-based SQL tests
to TypeScript vitest tests, **one operator per iteration, one commit per
iteration**. Stop conditions are at the bottom.

---

## Current state

- **Ported operators:** 0 / 14
- **Last completed:** _none_
- **Next up:** `base` (1 case, smoke test)
- **Stopped?** no

Update the three bullets above at the end of every iteration.

---

## The loop

Repeat until the "Operator order" checklist is fully checked or a stop
condition fires.

### 1. Pick the next operator

Take the first `[ ]` item in the "Operator order" checklist below.
Read the corresponding `<operator>.md` tracking doc in this folder.

### 2. Set up shared helpers (FIRST iteration only)

On iteration 1 (operator = `base`), create:

- `helpers/fixtures.ts` — define the four base relations (see "Fixture
  relations" below). Export a function that builds them given a `BmgSql`
  factory, so each test file can instantiate them fresh.
- `helpers/mock-adapter.ts` — a minimal `DatabaseAdapter` that throws on
  `query()` (we only need `.toSql()`). Look at
  `../relation.test.ts` for how existing tests build adapters.
- `helpers/normalize.ts` — SQL-string normalizer + assertion (see spec).

On every subsequent iteration, import these — do not duplicate.

### 3. Write the test file

Create `<operator>.test.ts` in this folder. One `it()` per case in the
tracking doc. Translate each Ruby expression to a TS `BmgSql` chain.
Compare `rel.toSql().sql` against the expected SQLite via `assertSqlEqual`.

**Type-level assertions.** For **type-reshaping operators**, also add an
`expectTypeOf(rel).toEqualTypeOf<...>()` assertion in each case. For
pure filter / set-op operators, skip it — the type does not change.

Type-reshaping (add `expectTypeOf`): `project`, `allbut`, `rename`,
`extend`, `prefix`, `suffix`, `constants`, `join`, `left_join`,
`summarize`, `transform`, `group`, `wrap`, `unwrap`.

Filter / set (skip `expectTypeOf`): `base`, `restrict`, `where`,
`exclude`, `union`, `minus`, `intersect`, `matching`, `not_matching`,
`rxmatch`, `page`.

Test file structure:

```typescript
import { describe, it, expectTypeOf } from 'vitest';
import { BmgSql } from '@enspirit/bmg-sql';
import type { AsyncRelation } from '@enspirit/bmg';
import { buildFixtures } from './helpers/fixtures';
import { assertSqlEqual } from './helpers/normalize';

describe('black-box: <operator>', () => {
  const { suppliers, supplies, parts, cities } = buildFixtures();

  it('<operator>.01 — <short description from tracking doc>', () => {
    const rel = suppliers.project(['sid', 'name']);
    // Type assertion for type-reshaping operators:
    expectTypeOf(rel).toEqualTypeOf<AsyncRelation<{ sid: string; name: string }>>();
    // SQL-shape assertion:
    assertSqlEqual(rel.toSql().sql, `
      SELECT t1.sid, t1.name FROM suppliers AS t1
    `);
  });

  // ... one it() per case
});
```

### 4. Run the tests

```bash
pnpm --filter @enspirit/bmg-sql test -- black-box/<operator>
```

### 5. Fix failures

For each failure, pick the right response:

- **Normalizer too strict / alias drift** → relax the normalizer, or
  update the expected SQL in the test to match bmg-sql's alias
  numbering. Note "alias drift, expected updated" in the tracking doc.
- **Clear localized bug in bmg-sql** → fix it in the same commit. Keep
  the fix small and scoped.
- **Needs operator change / processor refactor** → mark the case
  `blocked` or `divergent` in the tracking doc with a clear explanation.
  Do NOT bundle a big refactor into the test-porting commit — hand it
  back to the user.
- **API divergence (bmg-rb Ruby API ≠ bmg-js TS API)** → pick the
  closest TS equivalent, mark the case `divergent`, document what you
  did and why in the tracking doc.

### 6. Update tracking docs

In `<operator>.md`:
- Mark each case `ported`, `divergent`, `blocked`, or `skipped`.
- Add any notes worth preserving for future maintainers.
- Update the `Ported: X/N` header line.

In `INDEX.md`:
- Update the row's `Ported` column.
- Update totals at the top.

In this file:
- Check the operator in "Operator order".
- Update "Current state" at the top.

### 7. Commit

Single commit per operator. Message format:

```
Port bmg-rb black-box tests: <operator> (<N> cases ported, <M> divergent/blocked)

<1-2 sentence summary of what landed>
<list of bug fixes made, if any>
<list of cases marked divergent/blocked with one-line reasons>
```

Stage only files under `packages/bmg-sql/tests/black-box/` plus any
bmg-sql source fixes. Never stage unrelated changes.

### 8. Go to step 1.

---

## Operator order (simple → complex)

Only operators supported by bmg-sql today. Port in this order.

- [ ] **base** (1 of 2 cases) — trivial smoke test; case .02 is blocked
- [ ] **extend** (1 case) — column-aliasing extend; verify API accepts
  `{ supplier_id: col('sid') }` form
- [ ] **project** (3 cases) — exercises DISTINCT optimization
- [ ] **union** (3 cases) — UNION + UNION ALL option
- [ ] **minus** (3 cases) — EXCEPT + CTE-wrap case
- [ ] **rename** (4 cases) — 1 case is a duplicate upstream
- [ ] **allbut** (5 cases) — DISTINCT preservation + Predicate.eq OR case
- [ ] **not_matching** (3 of 4 cases) — anti-join; case .04 blocked
- [ ] **matching** (6 of 7 cases) — semi-join; case .07 blocked
- [ ] **left_join** (8 cases) — coalesce defaults + CTE-wrap
- [ ] **restrict** (11 cases) — predicate edge cases; .08/.09 may be
  blocked on `Predicate.match`
- [ ] **summarize** (10 cases) — aggregator API API decision needed
  (decide `'sum'` string tokens vs typed helpers — match bmg-rb's `:sum`)
- [ ] **join** (14 cases) — biggest file; .02 depends on `prefix`
  push-down which is fallback-only → expect `divergent`
- [ ] **transform** (4 cases) — decide class-token mapping (`String` →
  `'string'` or `'varchar(255)'`); if CAST emission is missing in
  bmg-sql, mark all `blocked` and move on

---

## Blocked — do not port in this loop

These operators are NOT supported by bmg-sql's SQL push-down today.
Skip them entirely. Do not unblock by adding the operator — that's a
user-level decision, not a test-porting task.

- **rxmatch** — operator missing in bmg core and bmg-sql.
- **page** — `Relation.page()` not exposed (`processOrderBy` /
  `processLimitOffset` exist but aren't wired to a method).
- **constants** — SQL push-down missing; falls back to in-memory.
- **prefix** — SQL push-down missing; falls back to in-memory.
- **suffix** — SQL push-down missing; falls back to in-memory.
- **base.02** — needs raw-SQL / subquery relation factory.
- **matching.07**, **not_matching.04** — same raw-SQL factory dependency.

---

## Fixture relations

Define once in `helpers/fixtures.ts`, reuse everywhere:

| Relation   | Attributes                          | Key            |
|------------|-------------------------------------|----------------|
| suppliers  | sid, name, city, status             | [sid]          |
| supplies   | sid, pid, qty                       | [sid, pid]     |
| parts      | pid, name, color, weight, city      | [pid]          |
| cities     | city, country                       | [city]         |

---

## Normalizer spec

`helpers/normalize.ts` must export:

```typescript
export function normalize(sql: string): string;
export function assertSqlEqual(got: string, expected: string): void;
```

`normalize` steps:

1. Collapse runs of whitespace (including newlines) to a single space.
2. Lowercase SQL keywords: `SELECT FROM WHERE GROUP ORDER BY JOIN INNER
   LEFT CROSS ON AS AND OR NOT EXISTS UNION EXCEPT INTERSECT DISTINCT
   ALL LIMIT OFFSET IN IS NULL WITH LIKE ESCAPE CAST COALESCE UPPER
   CASE WHEN THEN ELSE END ASC DESC HAVING`.
3. Strip backticks around identifiers: `` `t1` `` → `t1`.
4. Strip double quotes around identifiers: `"t1"` → `t1`.
5. Strip single quotes around **alias names only** (after `AS`), not
   around string literals. Use a regex that only matches `AS 'ident'`.
6. Normalize paren spacing: `( ` → `(`, ` )` → `)`.
7. Trim.

`assertSqlEqual(got, expected)`:
- Normalize both.
- If equal, return.
- If not, throw an error showing both the original and normalized forms
  side-by-side for debugging.

**Alias-number drift** (e.g. bmg-rb emits `t4` but bmg-sql emits `t2`)
is NOT handled by the normalizer. When hit, update the expected string
in the test file to match bmg-sql's output and annotate the case in the
tracking doc with "alias drift, expected updated to match bmg-sql".

---

## Stop conditions

STOP and report to the user if any of these fire. "Report" means: commit
current progress, update `Stopped?: yes — <reason>` at the top, then
stop the loop.

1. **All operators checked.** Done. Write a completion note in this
   file and report summary to user.
2. **Stuck on one operator for > 2 fix rounds.** Don't death-spiral.
   Mark remaining cases `blocked`/`divergent`, commit what's ported,
   stop.
3. **A fix requires non-trivial bmg-sql refactor** (processors, AST,
   relation surface, new operator). Out of scope for test porting.
4. **Tests outside `black-box/` start failing** due to something you
   changed. Revert the bmg-sql change, mark the case `blocked`, stop.
5. **You touched files outside `packages/bmg-sql/`.** Stop — any
   cross-package change needs user review.

---

## Completion notes

_Fill in when all checkboxes are checked._
