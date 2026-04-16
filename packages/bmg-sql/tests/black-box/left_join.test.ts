import { describe } from 'vitest';
// import { buildFixtures } from './helpers/fixtures';

// All 8 cases blocked pending fix of the join-alias bug (see matching.md
// and CLAUDE_PLAN.md). Brief summary: buildJoinPredicate() uses each
// relation's own SqlBuilder for alias resolution, so both operands start
// at `t1`. After processRequalify renames the right side's table during
// the merge, the pre-built ON predicate still references the left alias
// on both sides, producing e.g. `ON "t1"."sid" = "t1"."sid"`. All join-
// based push-downs (.join, .left_join, and matching-against-a-join) are
// affected. Fix is a non-trivial API reshape in processJoin.

describe('black-box: left_join', () => {
  // left_join.01-08 all blocked on join alias bug.
  // left_join.03, .08 additionally blocked on defaults API (COALESCE).
  it.todo('left_join.01 — Simple left join, no defaults (blocked: join alias bug)');
  it.todo('left_join.02 — Left join with attribute-mapping (blocked: join alias bug)');
  it.todo('left_join.03 — Left join with COALESCE defaults (blocked: defaults API + join alias bug)');
  it.todo('left_join.04 — Chained left joins (blocked: join alias bug)');
  it.todo('left_join.05 — INNER then LEFT (blocked: join alias bug)');
  it.todo('left_join.06 — LEFT then INNER (blocked: join alias bug)');
  it.todo('left_join.07 — Restrict after left_join (blocked: join alias bug)');
  it.todo('left_join.08 — Restrict after left_join with defaults (blocked: defaults API + join alias bug)');
});
