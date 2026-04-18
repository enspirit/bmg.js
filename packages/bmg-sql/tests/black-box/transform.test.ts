import { describe, it } from 'vitest';
// import { buildFixtures } from './helpers/fixtures';

// All 4 cases blocked: bmg core's `Transformation` type is
// `TransformFunc | TransformFunc[] | Record<AttrName, ...>` where
// `TransformFunc = (value: unknown) => unknown` — strictly a JS-function
// contract (see packages/bmg/src/types.ts:184-185). There is no
// type-token API comparable to bmg-rb's class literals (`String`,
// `Integer`, `Date`) that could map to `CAST(col AS varchar(255))` or
// `date(col)` in SQL.
//
// On the bmg-sql side, SqlRelation.transform() just falls back to
// in-memory (packages/bmg-sql/src/relation.ts:275-276) — there is no
// processTransform / CAST-emission code path, so even if we had type
// tokens there would be nowhere for them to land.
//
// Unblocking would require, minimally:
// 1. A typed-token schema added to bmg core's `Transformation` type
//    (e.g. `{ qty: 'string' | 'integer' | 'date' }` or a `Cast` marker
//    object) plus a bmg core identity interpretation for in-memory use.
// 2. A new `processTransform` in bmg-sql emitting `CAST(col AS t)` (and
//    the `date(...)` function-call special case for transform.04).
// 3. A dialect hook for the varchar type (`varchar(255)` vs `text` vs
//    `character varying`).
//
// All of the above is cross-package and out of scope for the
// test-porting loop. Kept as `it.todo` so the cases are visible on the
// tracker.

describe('black-box: transform', () => {
  it.todo('transform.01 — CAST a single attribute to String (blocked: no type-token API + no processTransform)');
  it.todo('transform.02 — Transform-all-columns form (blocked: no type-token API + no processTransform)');
  it.todo('transform.03 — Composed transform [String, Integer] (blocked: no type-token API + no processTransform)');
  it.todo('transform.04 — Composed transform [String, Date] with date() special case (blocked: no type-token API + no processTransform)');
});
