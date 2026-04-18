# CLAUDE_PLAN.md — port bmg-rb black-box SQL tests

**Read this file at the start of every iteration. Update it at the end.**

This is a self-directed work plan. Port the bmg-rb YAML-based SQL tests
to TypeScript vitest tests, **one operator per iteration, one commit per
iteration**. Stop conditions are at the bottom.

---

## Current state

- **Ported operators:** 12 / 14 (iteration complete for all non-join
  operators; `join` and `left_join` remain blocked per option (b))
- **Last completed:** `transform` (0/4 cases — all blocked, test file
  written with `it.todo`)
- **Next up:** **option (b) is exhausted.** Remaining work is either
  (a) fix the cross-cutting join-alias bug in `processJoin` /
  `processRequalify` to unblock `left_join` / `join` / `matching.06` /
  `summarize.05` / `.07`, or accept 12/14 and stop the loop.
- **Stopped?** awaiting user decision — no more non-join operators
  available to port.

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

On every subsequent iteration, import these — do not duplicate.

**No SQL normalizer.** Tests assert against bmg-sql's **native** output
(double-quoted identifiers, no `AS`, bmg-sql's own whitespace). Use
plain `expect(sql).toBe(expected)`. See "Asserting SQL" below.

### 3. Write the test file

Create `<operator>.test.ts` in this folder. One `it()` per case in the
tracking doc. Translate each Ruby expression to a TS `BmgSql` chain.
Assert on `rel.toSql().sql` — see "Asserting SQL" below.

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
import { describe, it, expect, expectTypeOf } from 'vitest';
import type { AsyncRelation } from '@enspirit/bmg-js';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: <operator>', () => {
  const { suppliers, supplies, parts, cities } = buildFixtures();

  it('<operator>.01 — <short description from tracking doc>', () => {
    const rel = suppliers.project(['sid', 'name']);
    // Type assertion for type-reshaping operators:
    expectTypeOf(rel).toEqualTypeOf<AsyncRelation<{ sid: string; name: string }>>();
    // SQL assertion — bmg-sql's native output, exact string match:
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name" FROM "suppliers" "t1"',
    );
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

- **Expected string wrong** (first time you wrote the test) → paste
  the actual `.toSql().sql` output as the expected value, AFTER
  verifying semantic equivalence against the bmg-rb reference SQL in
  the `.md` tracking doc. See "Asserting SQL" for what "semantically
  equivalent" means here.
- **Clear localized bug in bmg-sql** → fix it in the same commit. Keep
  the fix small and scoped.
- **bmg-sql query differs semantically from bmg-rb** (missing join,
  missing where, wrong SELECT list, missing optimization) → mark the
  case `divergent` in the tracking doc, document the delta, and snapshot
  what bmg-sql currently produces. Move on.
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

- [x] **base** (1 of 2 cases) — done, `base.test.ts`; .02 blocked (subquery factory)
- [x] **extend** (1 case) — done, `extend.test.ts`; string-ref form works
- [x] **project** (3 cases) — done, `project.test.ts`; DISTINCT optimization verified
- [x] **union** (2/3 cases) — done, `union.test.ts`; UNION ALL blocked on core API
- [x] **minus** (3 cases) — done, `minus.test.ts`; subquery-in-FROM used instead of CTE
- [x] **rename** (4 cases) — done, `rename.test.ts`; params asserted for restrict literals
- [x] **allbut** (5 cases) — done, `allbut.test.ts`; .04 divergent (key-inference gap)
- [x] **not_matching** (3/4 cases) — done, `not_matching.test.ts`; .04 blocked
- [x] **matching** (5/7 cases) — done, `matching.test.ts`; .06 known-bug (alias in join-under-EXISTS); .07 blocked
- [ ] **left_join** (0/8 — BLOCKED on join alias bug; revisit after bug
  fix, out of scope per option (b))
- [x] **restrict** (9/11 cases — 3 ported, 6 divergent, 2 blocked)
  — surfaced NULL-in-IN gap, alias-in-WHERE bug, no UNION push-down
- [x] **summarize** (7/10 cases — 6 ported, 1 known-bug via `it.fails`,
  3 blocked: .07 layered join bugs, .09/.10 distinct_count missing from
  core API) — settled on verbose `{ qty: { op: 'sum', attr: 'qty' } }`
  form as the bmg-js equivalent of bmg-rb's `:qty => :sum`
- [ ] **join** (14 cases — BLOCKED on join alias bug; revisit after bug
  fix, out of scope per option (b))
- [x] **transform** (0/4 — all blocked) — bmg core `Transformation`
  is JS-function-only; bmg-sql has no `processTransform` / CAST
  emission. Cross-package feature; test file kept as `it.todo`s so the
  blocker stays visible.

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

## Asserting SQL

Tests assert **bmg-sql's own native output**, not bmg-rb's. No normalizer.
Plain `expect(rel.toSql().sql).toBe('...')` with the exact string bmg-sql
emits.

**The .md tracking doc keeps bmg-rb's SQL as the semantic reference.**
It describes the query shape — which joins, which WHERE, which SELECT
list, which optimizations (DISTINCT, CTE wrap). The test does NOT
replicate that string; it snapshots bmg-sql's actual output.

### The porting procedure for a single case

1. Read the bmg-rb reference SQL from `<operator>.md`.
2. Translate the Ruby chain to TS.
3. Write the test with a placeholder expected string:
   ```typescript
   expect(rel.toSql().sql).toBe('PLACEHOLDER');
   ```
4. Run the test — it fails, vitest prints the actual SQL.
5. **Read the actual output. Verify it's semantically equivalent to
   bmg-rb's reference**, i.e. for every clause in the bmg-rb SQL the
   corresponding construct appears in bmg-sql's SQL:
   - Same SELECT list (same columns, same aliases, same `DISTINCT` if
     applicable, same aggregates).
   - Same FROM clause (same tables, same alias count, same join types
     and join conditions).
   - Same WHERE predicate (same set of conditions ANDed/ORed, same
     comparison operators, same literals).
   - Same set operation (UNION / EXCEPT / INTERSECT) if any, same arity.
   - Same ORDER BY / LIMIT / OFFSET / GROUP BY / HAVING if any.
   - Same CTE wrapping where bmg-rb uses `WITH`.
   Differences in **syntax** are fine: quoting (`` ` `` vs `"`), `AS`
   keyword presence, whitespace, alias numbering (`t1` vs `t4`). A
   different SQL string that runs the same query is accepted.
6. If semantically equivalent: paste the actual output as the expected
   string. Test passes. Mark the case `ported`.
7. If NOT equivalent: note the divergence in the tracking doc, mark the
   case `divergent`, and still snapshot bmg-sql's current output (so
   future regressions are caught). Add a warning line explaining the
   delta.

### What "different SQL, same query" looks like

| bmg-rb (SQLite via Sequel)         | bmg-sql (our compiler)               |
|------------------------------------|--------------------------------------|
| `` `t1`.`sid` ``                   | `"t1"."sid"`                         |
| `` FROM `suppliers` AS 't1' ``     | `FROM "suppliers" "t1"`              |
| `` WHERE (`t1`.`sid` = 'S1') ``    | `WHERE ("t1"."sid" = 'S1')`          |
| uppercase `SELECT, FROM, WHERE`    | uppercase `SELECT, FROM, WHERE`      |
| `AS 'alias'`                       | `AS "alias"` or omitted              |
| Alias counter may emit `t4`        | Alias counter may emit `t2`          |

All of the above are the **same query**. Test asserts bmg-sql's side.

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
