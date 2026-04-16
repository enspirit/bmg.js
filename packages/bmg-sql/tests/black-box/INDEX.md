# Black-box SQL tests — master index

Source: bmg-rb `spec/integration/sequel/base/*.yml` @ SHA `fa8c7e0`
(imported 2026-04-16).

**Totals:** 19 source files · 89 cases · 1 ported.

## Per-file status

| File | Cases | Ported | bmg-sql support | Notes |
|---|---:|---:|---|---|
| [allbut.md](./allbut.md) | 5 | 0 | full (pushed down, DISTINCT-aware) | |
| [base.md](./base.md) | 2 | 1 | full | baseline `.toSql()` with no operators; .02 blocked (subquery factory) |
| [constants.md](./constants.md) | 1 | 0 | **fallback only** | falls back to in-memory; SQL push-down TBD |
| [extend.md](./extend.md) | 1 | 0 | full (pushed down) | |
| [join.md](./join.md) | 14 | 0 | full (inner + cross) | includes cross-join (`[]` key) cases |
| [left_join.md](./left_join.md) | 8 | 0 | full (pushed down) | defaults-via-coalesce cases TBD |
| [matching.md](./matching.md) | 7 | 0 | full (semi-join via EXISTS) | |
| [minus.md](./minus.md) | 3 | 0 | full (EXCEPT) | |
| [not_matching.md](./not_matching.md) | 4 | 0 | full (anti-join via NOT EXISTS) | |
| [page.md](./page.md) | 5 | 0 | **missing surface** | `processOrderBy`/`processLimitOffset` exist but `Relation.page()` is not exposed |
| [prefix.md](./prefix.md) | 1 | 0 | **fallback only** | pushed-down prefix via rename would be cleaner |
| [project.md](./project.md) | 3 | 0 | full (DISTINCT-aware via RelationType) | |
| [rename.md](./rename.md) | 4 | 0 | full (pushed down) | |
| [restrict.md](./restrict.md) | 11 | 0 | full (pushed down) | includes null/IN/chaining cases |
| [rxmatch.md](./rxmatch.md) | 2 | 0 | **not implemented** | operator missing entirely |
| [suffix.md](./suffix.md) | 1 | 0 | **fallback only** | see prefix |
| [summarize.md](./summarize.md) | 10 | 0 | full (GROUP BY + CTE wrap) | distinct_count + Summarizer API divergence TBD |
| [transform.md](./transform.md) | 4 | 0 | unknown coverage | Ruby `String`/`Integer`/`Date` class literals need TS mapping |
| [union.md](./union.md) | 3 | 0 | full (UNION / UNION ALL) | |

## Blockers summary

- **rxmatch** — operator not implemented in `bmg-sql` or `bmg` core. Cases
  will be tracked as `blocked` until the operator is added.
- **page** — processors exist (`processOrderBy`, `processLimitOffset`)
  but `SqlRelation.page()` (and `Relation.page()` in core) is not exposed.
  Cases blocked until surfaced.
- **constants / prefix / suffix** — currently fall back to in-memory
  evaluation. They execute, but the compiled SQL will not match bmg-rb's
  single-query output. Cases will be `divergent` until push-down is added.
- **transform** — Ruby uses class literals (`String`, `Integer`, `Date`)
  as type tokens. TS port needs a type-token convention — decide during
  port.
- **summarize** — bmg-rb uses `Bmg::Summarizer.min(:qty)` /
  `.distinct_count(:qty)` for named aggregators. TS port needs to decide
  equivalent API (string aggregator names like `'min'`, `'distinct_count'`,
  or typed helpers).

## Gate

Black-box tests should live under `packages/bmg-sql/tests/black-box-ports/`
(separate from this tracking folder) once porting starts. Tracking docs
stay here; tests land there.
