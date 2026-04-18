# Black-box SQL tests — master index

Source: bmg-rb `spec/integration/sequel/base/*.yml` @ SHA `fa8c7e0`
(imported 2026-04-16).

**Totals:** 19 source files · 89 cases · 53 ported (4 divergent, 2 known-bug).

## Per-file status

| File | Cases | Ported | bmg-sql support | Notes |
|---|---:|---:|---|---|
| [allbut.md](./allbut.md) | 5 | 5 | full (pushed down, DISTINCT-aware) | .04 divergent: redundant DISTINCT after key-prefix restrict |
| [base.md](./base.md) | 2 | 2 | full | baseline `.toSql()` with no operators; .02 ported via `BmgSql.fromSubquery` (unblocker D) |
| [constants.md](./constants.md) | 1 | 0 | **fallback only** | falls back to in-memory; SQL push-down TBD |
| [extend.md](./extend.md) | 1 | 1 | full (pushed down) | type quirk: string-ref form infers literal type |
| [join.md](./join.md) | 14 | 0 | full (inner + cross) | includes cross-join (`[]` key) cases |
| [left_join.md](./left_join.md) | 8 | 0 | **broken: join alias bug** | all 8 blocked; bug also affects `join`, `matching.06` |
| [matching.md](./matching.md) | 7 | 6 | full (EXISTS) | .06 known-bug (alias in join-under-EXISTS); .07 ported via `BmgSql.fromSubquery` (unblocker D) |
| [minus.md](./minus.md) | 3 | 3 | full (EXCEPT) | derived-table wrap instead of CTE for post-minus ops |
| [not_matching.md](./not_matching.md) | 4 | 4 | full (NOT EXISTS) | .04 ported via `BmgSql.fromSubquery` (unblocker D) |
| [page.md](./page.md) | 5 | 5 | full (pushed down) | surfaced by unblocker C (Relation.page() added to core + bmg-sql) |
| [prefix.md](./prefix.md) | 1 | 0 | **fallback only** | pushed-down prefix via rename would be cleaner |
| [project.md](./project.md) | 3 | 3 | full (DISTINCT-aware via RelationType) | |
| [rename.md](./rename.md) | 4 | 4 | full (pushed down) | restrict literals parameterized (`?`) vs bmg-rb inlined |
| [restrict.md](./restrict.md) | 11 | 9 | full (pushed down), with caveats | 6 ported, 3 divergent (alias-in-WHERE, union push-down), 2 blocked (match predicate missing). NULL-in-IN fixed in unblocker A. |
| [rxmatch.md](./rxmatch.md) | 2 | 0 | **not implemented** | operator missing entirely |
| [suffix.md](./suffix.md) | 1 | 0 | **fallback only** | see prefix |
| [summarize.md](./summarize.md) | 10 | 9 | full (GROUP BY + CTE wrap) | 8 ported, .05 known-bug (join alias), .07 blocked (layered join bugs). distinct_count unblocked by unblocker B. |
| [transform.md](./transform.md) | 4 | 0 | **none — fully blocked** | bmg core `Transformation` is JS-function-only; bmg-sql has no `processTransform` / CAST emission. All 4 cases `it.todo`. |
| [union.md](./union.md) | 3 | 2 | UNION only | UNION ALL blocked: core Relation.union() has no options arg |

## New bmg-sql bug surfaced by porting

**Join alias bug** (blocks `left_join`, most of `join`, `matching.06`): `buildJoinPredicate` uses each relation's own `SqlBuilder` so both operands resolve to `t1`. `processJoin` calls `processRequalify` to rename the right side's table, but the pre-built `ON` predicate isn't rewritten. Result: join predicates look like `t1.sid = t1.sid`. Query returns wrong results on a real DB. Fix is a non-trivial API reshape in `processJoin` / `processRequalify` — out of scope for test porting. See `left_join.md` and `matching.md` for details.

## Blockers summary

- **rxmatch** / **restrict.08-09** — `@enspirit/predicate` does not
  implement a `match`/LIKE predicate kind. Cases blocked until added.
- **page** — unblocked by unblocker C. `Relation.page(ordering, page,
  { pageSize })` surfaced on core + bmg-sql; processOrderBy wraps
  complex SELECTs in a subquery before applying ORDER BY.
- **constants / prefix / suffix** — currently fall back to in-memory
  evaluation. They execute, but the compiled SQL will not match bmg-rb's
  single-query output. Cases will be `divergent` until push-down is added.
- **transform** — fully blocked. bmg core's `Transformation` type is
  JS-function-only (no type-token channel); bmg-sql's `SqlRelation.transform`
  just falls back to in-memory. Unblocking is a cross-package feature:
  add a typed-token extension to `Transformation`, a `processTransform`
  emitting CAST / date(), and a dialect hook for the varchar spelling.
- **summarize** — bmg-js uses the verbose `AggregatorSpec` form
  `{ qty: { op: 'sum', attr: 'qty' } }` for standard aggregators. As of
  unblocker B, `'distinct_count'` joins `count`/`sum`/`min`/`max`/`avg`
  end-to-end (core types, in-memory, bmg-sql push-down), emitted as
  `COUNT(DISTINCT col)`.

## Gate

Black-box tests should live under `packages/bmg-sql/tests/black-box-ports/`
(separate from this tracking folder) once porting starts. Tracking docs
stay here; tests land there.
