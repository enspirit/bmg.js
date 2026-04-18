# Black-box SQL tests — master index

Source: bmg-rb `spec/integration/sequel/base/*.yml` @ SHA `fa8c7e0`
(imported 2026-04-16).

**Totals:** 19 source files · 89 cases · 43 ported (7 divergent, 2 known-bug).

## Per-file status

| File | Cases | Ported | bmg-sql support | Notes |
|---|---:|---:|---|---|
| [allbut.md](./allbut.md) | 5 | 5 | full (pushed down, DISTINCT-aware) | .04 divergent: redundant DISTINCT after key-prefix restrict |
| [base.md](./base.md) | 2 | 1 | full | baseline `.toSql()` with no operators; .02 blocked (subquery factory) |
| [constants.md](./constants.md) | 1 | 0 | **fallback only** | falls back to in-memory; SQL push-down TBD |
| [extend.md](./extend.md) | 1 | 1 | full (pushed down) | type quirk: string-ref form infers literal type |
| [join.md](./join.md) | 14 | 0 | full (inner + cross) | includes cross-join (`[]` key) cases |
| [left_join.md](./left_join.md) | 8 | 0 | **broken: join alias bug** | all 8 blocked; bug also affects `join`, `matching.06` |
| [matching.md](./matching.md) | 7 | 5 | full (EXISTS) | .06 known-bug (alias in join-under-EXISTS); .07 blocked |
| [minus.md](./minus.md) | 3 | 3 | full (EXCEPT) | derived-table wrap instead of CTE for post-minus ops |
| [not_matching.md](./not_matching.md) | 4 | 3 | full (NOT EXISTS) | .04 blocked (subquery factory) |
| [page.md](./page.md) | 5 | 0 | **missing surface** | `processOrderBy`/`processLimitOffset` exist but `Relation.page()` is not exposed |
| [prefix.md](./prefix.md) | 1 | 0 | **fallback only** | pushed-down prefix via rename would be cleaner |
| [project.md](./project.md) | 3 | 3 | full (DISTINCT-aware via RelationType) | |
| [rename.md](./rename.md) | 4 | 4 | full (pushed down) | restrict literals parameterized (`?`) vs bmg-rb inlined |
| [restrict.md](./restrict.md) | 11 | 9 | full (pushed down), with caveats | 3 ported, 6 divergent (NULL-in-IN, alias-in-WHERE, union push-down), 2 blocked (match predicate missing) |
| [rxmatch.md](./rxmatch.md) | 2 | 0 | **not implemented** | operator missing entirely |
| [suffix.md](./suffix.md) | 1 | 0 | **fallback only** | see prefix |
| [summarize.md](./summarize.md) | 10 | 7 | full (GROUP BY + CTE wrap) | 6 ported, .05 known-bug (join alias), 3 blocked: .07 layered join bugs, .09/.10 distinct_count missing from core API |
| [transform.md](./transform.md) | 4 | 0 | unknown coverage | Ruby `String`/`Integer`/`Date` class literals need TS mapping |
| [union.md](./union.md) | 3 | 2 | UNION only | UNION ALL blocked: core Relation.union() has no options arg |

## New bmg-sql bug surfaced by porting

**Join alias bug** (blocks `left_join`, most of `join`, `matching.06`): `buildJoinPredicate` uses each relation's own `SqlBuilder` so both operands resolve to `t1`. `processJoin` calls `processRequalify` to rename the right side's table, but the pre-built `ON` predicate isn't rewritten. Result: join predicates look like `t1.sid = t1.sid`. Query returns wrong results on a real DB. Fix is a non-trivial API reshape in `processJoin` / `processRequalify` — out of scope for test porting. See `left_join.md` and `matching.md` for details.

## Blockers summary

- **rxmatch** / **restrict.08-09** — `@enspirit/predicate` does not
  implement a `match`/LIKE predicate kind. Cases blocked until added.
- **page** — processors exist (`processOrderBy`, `processLimitOffset`)
  but `SqlRelation.page()` (and `Relation.page()` in core) is not exposed.
  Cases blocked until surfaced.
- **constants / prefix / suffix** — currently fall back to in-memory
  evaluation. They execute, but the compiled SQL will not match bmg-rb's
  single-query output. Cases will be `divergent` until push-down is added.
- **transform** — Ruby uses class literals (`String`, `Integer`, `Date`)
  as type tokens. TS port needs a type-token convention — decide during
  port.
- **summarize** — for standard aggregators (`min`, `max`, `sum`, `avg`,
  `count`), bmg-js uses the verbose `AggregatorSpec` form
  `{ qty: { op: 'sum', attr: 'qty' } }` — no separate helper class.
  For `distinct_count`, the op is absent from bmg core's `AggregatorName`
  type (and in-memory `applyAggregator`), and from bmg-sql's
  `compilableOps` allowlist, so `.09`/`.10` remain blocked.

## Gate

Black-box tests should live under `packages/bmg-sql/tests/black-box-ports/`
(separate from this tracking folder) once porting starts. Tracking docs
stay here; tests land there.
