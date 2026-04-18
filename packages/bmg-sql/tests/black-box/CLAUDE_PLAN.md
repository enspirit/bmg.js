# CLAUDE_PLAN.md — port bmg-rb black-box SQL tests

**Read this file at the start of every iteration. Update it at the end.**

This is a self-directed work plan. Port the bmg-rb YAML-based SQL tests
to TypeScript vitest tests, **one operator per iteration, one commit per
iteration**. Stop conditions are at the bottom.

---

## Current state

- **Ported operators:** 12 / 14 (all non-join operators iterated;
  `join` and `left_join` remain blocked on the cross-cutting
  join-alias bug, deferred to a dedicated branch)
- **Last completed:** Unblocker D — `BmgSql.fromSubquery` factory
- **Totals:** 89 cases · **53 ported** (4 divergent, 2 known-bug via
  `it.fails`, 30 blocked via `it.todo`)
- **Stopped?** yes — loop paused after an "unblocker pass" (A→D,
  see next section). Remaining work requires decisions the port
  loop is not authorized to make (join-alias refactor, new
  operators, cross-package API shape).

Update the four bullets above at the end of every iteration.

---

## Unblocker pass (A→D) — completed 2026-04-18

After the initial 12/14 port pass stopped at 43/89 cases, we ran a
follow-on **unblocker pass** under explicit user authorization. This
deliberately relaxed stop-condition #3 (no non-trivial refactor) and
#5 (no cross-package edits) for four small, scoped unblockers. One
commit each:

| # | Unblocker                                     | Packages touched                            | Cases unblocked                          | Commit     |
|---|-----------------------------------------------|---------------------------------------------|------------------------------------------|------------|
| A | NULL-in-IN split in `in` compilation          | predicate, bmg-sql                          | restrict.03/.04/.05 (3)                  | `aed8dda`  |
| B | `distinct_count` aggregator end-to-end        | bmg core (types + sync + async), bmg-sql    | summarize.09/.10 (2)                     | `6f07997`  |
| C | `page()` operator surface on Relation         | bmg core, bmg-sql                           | page.01-.05 (5)                          | `781b77f`  |
| D | `BmgSql.fromSubquery` raw-SQL factory         | bmg-sql (new AST node + factory)            | base.02, matching.07, not_matching.04 (3) | `d9cda6e`  |

**Net impact:** +13 cases (43 → 53/89); `distinct_count`, `page()`,
and `BmgSql.fromSubquery` added to public API (CHANGELOG updated).
`processOrderBy` got an `isComplex` wrap as a localized fix (same
precedent as `processWhere`).

This pass should be treated as a template for *bounded* follow-on
unblocker work — small, scoped, user-authorized, not a license to
reshape the codebase mid-loop.

---

## Next up (if resumed)

Sorted by estimated effort × value. See INDEX.md "Blockers summary"
for the ground truth.

1. **Join-alias bug** — biggest value (unblocks join 14 + left_join 8
   + matching.06 + summarize.05/.07 ≈ **25 cases**). Needs a
   non-trivial reshape of `processJoin` / `processRequalify` and
   `buildJoinPredicate` so the ON predicate uses the requalified
   right-side alias. Belongs on its own branch.
2. **prefix / suffix / constants push-down** — 3 cases across three
   operators; each a medium-sized processor addition.
3. **UNION ALL option** — 1 case (union.03). Needs a cross-package
   API change to `Relation.union()` options.
4. **LIKE predicate** (`rxmatch.01-02`, `restrict.08-09`) — add a
   `match` predicate kind to `@enspirit/predicate` and wire it
   through bmg-sql (with dialect hook for `ESCAPE`). 4 cases.
5. **Transform type-token API** — 4 cases; needs declarative marker
   in `Transformation` plus a `processTransform` with CAST emission.
6. **Alias-in-WHERE-after-rename** (restrict.07) and **union
   push-down into branches** (restrict.10/.11) — localized bmg-sql
   processor improvements; currently divergent.

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

- [x] **base** (2/2) — both cases ported (.02 via unblocker D
  `BmgSql.fromSubquery`)
- [x] **extend** (1/1) — string-ref form works
- [x] **project** (3/3) — DISTINCT optimization verified
- [x] **union** (2/3) — UNION ALL (.03) blocked on core API
- [x] **minus** (3/3) — subquery-in-FROM used instead of CTE
- [x] **rename** (4/4) — params asserted for restrict literals
- [x] **allbut** (5/5) — .04 divergent (key-inference gap)
- [x] **not_matching** (4/4) — .04 ported via unblocker D
- [x] **matching** (6/7) — .06 known-bug (`it.fails`, join-alias);
  .07 ported via unblocker D
- [ ] **left_join** (0/8 — BLOCKED on join-alias bug; deferred to a
  dedicated refactor branch)
- [x] **restrict** (9/11) — unblocker A ported .03/.04/.05. Remaining:
  .07 divergent (alias-in-WHERE-after-rename), .10/.11 divergent (no
  UNION push-down), .08/.09 blocked (LIKE predicate missing)
- [x] **summarize** (9/10) — unblocker B ported .09/.10. .05
  known-bug (`it.fails`, join-alias); .07 blocked (layered join bugs)
- [ ] **join** (0/14 — BLOCKED on join-alias bug; deferred)
- [x] **transform** (0/4) — all blocked: bmg core `Transformation`
  is JS-function-only; bmg-sql has no `processTransform` / CAST
  emission. Test file kept as `it.todo`s so the blocker stays visible.

### Operators added outside the original 14 (by unblocker pass)

- [x] **page** (5/5) — operator added to core + bmg-sql by unblocker C.

---

## Blocked — do not port in this loop

These operators are NOT supported by bmg-sql's SQL push-down today.
Skip them in the test-porting loop. Adding the operator itself is a
user-level decision; if the user explicitly authorizes a scoped
unblocker (as happened in the A→D pass), it can happen outside the
loop.

**Still blocked:**
- **rxmatch** — operator missing in bmg core and bmg-sql.
- **constants** — SQL push-down missing; falls back to in-memory.
- **prefix** — SQL push-down missing; falls back to in-memory.
- **suffix** — SQL push-down missing; falls back to in-memory.

**Resolved by the unblocker pass (A→D):**
- ~~**page**~~ — `Relation.page()` surfaced by **unblocker C**.
- ~~**base.02**~~ — raw-SQL factory added by **unblocker D**
  (`BmgSql.fromSubquery`).
- ~~**matching.07**, **not_matching.04**~~ — same raw-SQL factory
  dependency, both resolved by **unblocker D**.

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

Loop is paused, not fully complete. Two operators — `join` (0/14) and
`left_join` (0/8) — remain unchecked because both are blocked on the
same non-trivial refactor (join-alias bug in `processJoin` /
`processRequalify` / `buildJoinPredicate`). Tackling that refactor
was explicitly deemed out of scope for test-porting (stop condition
#3) and was deferred to a dedicated branch.

**Final tally from this branch (`sql-support`):**
- 12 / 14 operators iterated (+ `page` added outside the original
  set by unblocker C)
- 53 / 89 cases ported (+13 from the unblocker pass)
- 4 divergent, 2 known-bug via `it.fails`, 30 blocked via `it.todo`
- 0 test regressions across predicate / bmg / bmg-sql / bmg-pg

**User-facing API additions (all in CHANGELOG):**
- `distinct_count` aggregator
- `page()` operator on `Relation` / `AsyncRelation`
- `BmgSql.fromSubquery` factory

**Future passes** should read the "Next up (if resumed)" section of
Current state for the ordered list of remaining work. The join-alias
refactor is the single biggest lever (~25 cases).
