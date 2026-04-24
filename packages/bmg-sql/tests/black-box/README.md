# Black-box SQL tests — ported from bmg-rb

This folder tracks the porting of bmg-rb's YAML-based SQL translation tests
(`spec/integration/sequel/base/*.yml`) to bmg-js. These tests are the
authoritative specification for what SQL each relational operator chain
should compile to, and serve as guardrails against regressions.

## Source

- Upstream: https://github.com/enspirit/bmg
- Path: `spec/integration/sequel/base/*.yml`
- Runner (reference): `spec/integration/sequel/test_sql_translations.rb`
- Imported at SHA: `fa8c7e0c6052eeead127e28fc896061bc232518e`

## Approach

No automated translator. Each bmg-rb Ruby test case is hand-ported to
TypeScript by Claude, reading the original case and producing the equivalent
bmg-js chain plus an assertion on the compiled SQL. This keeps the port
truthful to the semantics rather than the surface syntax, and allows
judgment calls for cases where bmg-js has a different API surface.

## Files

- `INDEX.md` — master status table (one row per source YAML file)
- `<operator>.md` — per-operator tracking doc (one file per source YAML)

Each per-operator file lists every case from the source YAML with:
- **Source path + case index** — so the original can be looked up
- **Short description** — what this case tests
- **Ruby code** — the original bmg-rb expression (verbatim from YAML)
- **Expected SQLite** — the original expected output (verbatim from YAML)
- **Warnings** — operator not supported, lambda predicate, API divergence, etc.
- **Status** — see legend below
- **TS port** — path + test name once ported

## Status legend

- `todo` — not yet ported
- `ported` — ported and passing
- `blocked` — cannot port yet (operator missing, API mismatch, needs design)
- `skipped` — intentionally not ported (e.g., references Ruby-specific feature)
- `divergent` — ported but bmg-js emits different SQL; documented in notes

## Workflow (per case)

1. Read the case from the tracking doc.
2. Translate the Ruby chain to a bmg-sql TypeScript chain.
3. Add a test in `../black-box-ports/<operator>.test.ts` that:
   - Builds the relation
   - Calls `.toSql()` (or equivalent)
   - Compares the compiled SQL against the expected SQLite via a
     whitespace-normalizer (collapse whitespace, strip backticks/quotes,
     lowercase keywords)
4. Run `pnpm test` — if it passes, mark the case `ported` and record
   the test name in the tracking doc.
5. If it fails, diagnose:
   - bug in bmg-sql → fix it (separate commit), then mark `ported`
   - API divergence intended → mark `divergent`, document the delta
   - operator missing → mark `blocked`, note the gap
6. Commit: tracking doc update + test + fix (if any) together.

## Re-sync from bmg-rb

When bmg-rb adds or changes cases, re-fetch the YAML files, diff against
the tracking docs, and update. Record the new SHA in `INDEX.md` and each
affected tracking doc. Same workflow for new cases.

## Dialect notes

bmg-rb emits SQLite-flavored SQL (backticks, `AS 'alias'` with single-quoted
aliases). bmg-sql has both SQLite and PostgreSQL dialects. Black-box tests
assert against the SQLite compiled output to keep a 1:1 with bmg-rb.
Result-parity tests (Phase 4, see top-level plan) would execute against
Postgres and compare rowsets against in-memory `bmg`.
