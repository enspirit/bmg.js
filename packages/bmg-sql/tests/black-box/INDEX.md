# Black-box SQL tests — master index

Source: bmg-rb `spec/integration/sequel/base/*.yml` @ SHA `fa8c7e0`
(imported 2026-04-16).

**Totals:** 19 source files · 89 cases · 72 ported (5 divergent, 0 known-bug).

## Per-file status

| File | Cases | Ported | bmg-sql support | Notes |
|---|---:|---:|---|---|
| [allbut.md](./allbut.md) | 5 | 5 | full (pushed down, DISTINCT-aware) | .04 divergent: redundant DISTINCT after key-prefix restrict |
| [base.md](./base.md) | 2 | 2 | full | baseline `.toSql()` with no operators; .02 ported via `BmgSql.fromSubquery` (unblocker D) |
| [constants.md](./constants.md) | 1 | 0 | **fallback only** | falls back to in-memory; SQL push-down TBD |
| [extend.md](./extend.md) | 1 | 1 | full (pushed down) | type quirk: string-ref form infers literal type |
| [join.md](./join.md) | 14 | 10 | full (INNER) | 10 ported (1 divergent re-shape on .06/.07); .02/.10 blocked (prefix push-down); .08/.09 blocked (CROSS JOIN push-down) |
| [left_join.md](./left_join.md) | 8 | 6 | full (LEFT JOIN) | 6 ported (1 divergent re-shape on .06); .03/.08 blocked (defaults/COALESCE API) |
| [matching.md](./matching.md) | 7 | 7 | full (EXISTS) | all ported; .06 unblocked by join-alias fix; .07 uses `BmgSql.fromSubquery` |
| [minus.md](./minus.md) | 3 | 3 | full (EXCEPT) | derived-table wrap instead of CTE for post-minus ops |
| [not_matching.md](./not_matching.md) | 4 | 4 | full (NOT EXISTS) | .04 ported via `BmgSql.fromSubquery` (unblocker D) |
| [page.md](./page.md) | 5 | 5 | full (pushed down) | surfaced by unblocker C (Relation.page() added to core + bmg-sql) |
| [prefix.md](./prefix.md) | 1 | 0 | **fallback only** | pushed-down prefix via rename would be cleaner |
| [project.md](./project.md) | 3 | 3 | full (DISTINCT-aware via RelationType) | |
| [rename.md](./rename.md) | 4 | 4 | full (pushed down) | restrict literals parameterized (`?`) vs bmg-rb inlined |
| [restrict.md](./restrict.md) | 11 | 9 | full (pushed down), with caveats | 6 ported, 3 divergent (alias-in-WHERE, union push-down), 2 blocked (match predicate missing). NULL-in-IN fixed in unblocker A. |
| [rxmatch.md](./rxmatch.md) | 2 | 0 | **not implemented** | operator missing entirely |
| [suffix.md](./suffix.md) | 1 | 0 | **fallback only** | see prefix |
| [summarize.md](./summarize.md) | 10 | 10 | full (GROUP BY + CTE wrap) | all ported; .05 and .07 unblocked by join-alias + WHERE-qualifier fix |
| [transform.md](./transform.md) | 4 | 0 | **none — fully blocked** | bmg core `Transformation` is JS-function-only; bmg-sql has no `processTransform` / CAST emission. All 4 cases `it.todo`. |
| [union.md](./union.md) | 3 | 2 | UNION only | UNION ALL blocked: core Relation.union() has no options arg |

## Join-alias bug — FIXED

Previously `buildJoinPredicate` (in `relation.ts`) built the `ON`
predicate using each relation's own `SqlBuilder`, so both operands
resolved to `t1`. `processRequalify` then renamed the right side's
tables, but the pre-built `on` predicate wasn't rewritten, producing
`ON t1.sid = t1.sid`.

**Fix** (commit after unblocker D): (a) `processJoin` now takes `keys`
instead of a pre-built predicate and constructs `ON` *after*
`processRequalify`, looking up each key's qualifier in the respective
select list (so multi-way joins resolve each key to the nested table it
actually lives in); (b) `requalifyTableSpec` now also rewrites `on`
predicates inside `inner_join` / `left_join`, so nested joins that get
requalified (e.g., under EXISTS) keep correct references; (c)
`buildSelectQualifier` in `compile.ts` now looks up WHERE attribute
qualifiers from the select list instead of always defaulting to the
outer-left alias. Unblocks ~25 cases across `join`, `left_join`,
`matching.06`, `summarize.05`/`.07`.

## Blockers summary

- **rxmatch** / **restrict.08-09** — `@enspirit/predicate` does not
  implement a `match`/LIKE predicate kind. Cases blocked until added.
- **CROSS JOIN push-down** (`join.08-.09`) — `SqlRelation.cross_join` /
  `.join(other, [])` currently fall back to in-memory. Add a
  `processCrossJoin` that builds a `cross_join` `TableSpec`.
- **constants / prefix / suffix** — currently fall back to in-memory
  evaluation. They execute, but the compiled SQL will not match bmg-rb's
  single-query output. Cases will be `divergent` until push-down is added.
- **left_join defaults / COALESCE** (`left_join.03`, `.08`) — bmg-rb
  supports `.left_join(other, keys, {col: default})` which emits
  `coalesce(t.col, default) AS col`. bmg-js has no defaults arg.
- **transform** — fully blocked. bmg core's `Transformation` type is
  JS-function-only (no type-token channel); bmg-sql's `SqlRelation.transform`
  just falls back to in-memory. Unblocking is a cross-package feature:
  add a typed-token extension to `Transformation`, a `processTransform`
  emitting CAST / date(), and a dialect hook for the varchar spelling.
- **page** — unblocked by unblocker C. `Relation.page(ordering, page,
  { pageSize })` surfaced on core + bmg-sql.
- **summarize** — all 10 cases now ported. `'distinct_count'` joins
  `count`/`sum`/`min`/`max`/`avg` end-to-end via unblocker B.

## Gate

Black-box tests should live under `packages/bmg-sql/tests/black-box-ports/`
(separate from this tracking folder) once porting starts. Tracking docs
stay here; tests land there.
