# summarize

- **Source:** [spec/integration/sequel/base/summarize.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/summarize.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 10
- **Ported:** 7/10 (6 ported, 1 known-bug via `it.fails`, 3 blocked)
- **bmg-sql support:** GROUP BY + standard aggregates are solid; the
  join-dependent cases hit the cross-cutting join-alias bug, and
  `distinct_count` is not reachable via the public API.

**API divergence (resolved by convention):**
bmg-rb's `:qty => :sum` means "SUM the `qty` column, name the result
`qty`". bmg-js's short form `{ qty: 'sum' }` produces `SUM(*)` (attr is
undefined) — NOT equivalent. Tests use the verbose `AggregatorSpec`
form `{ qty: { op: 'sum', attr: 'qty' } }` to match bmg-rb semantics.
Tracked at the top of `summarize.test.ts`.

**Divergences and blockers:**
- **Join alias bug (.05, .07)**: same cross-cutting bug that blocks
  `left_join.*` and `matching.06`. `.05` is marked `it.fails` against
  the correct expected SQL so a future fix alerts us. `.07` is
  `it.todo` because the subquery requalify bug layers on top of the
  alias bug and isn't expressible as a single correct-SQL snapshot.
- **distinct_count (.09, .10)**: bmg-sql's AST already emits
  `COUNT(DISTINCT x)`, but `'distinct_count'` isn't in bmg core's
  `AggregatorName` nor in bmg-sql's `compilableOps` allowlist. Cases
  left `it.todo` until distinct_count is added end-to-end.
- **CTE vs derived table (.06)**: bmg-rb wraps post-summarize in `WITH
  ... AS (...)`; bmg-sql uses a subquery in FROM. Same semantics, same
  precedent as minus.03. Ported as-is.

## Cases

### summarize.01 — Aggregate with empty grouping (no GROUP BY)

**Status:** ported

**Note:** bmg-js uses `{ qty: { op: 'sum', attr: 'qty' }, count: 'count' }`
(verbose form for sum) — see "API divergence" at the top of this file.

**Ruby:**
```ruby
supplies
  .summarize([], :qty => :sum, :count => :count)
```

**Expected SQLite:**
```sql
SELECT sum(`t1`.`qty`) AS 'qty', count(*) AS 'count'
FROM `supplies` AS 't1'
```

---

### summarize.02 — Group-by single attribute

**Status:** ported

**Ruby:**
```ruby
supplies
  .summarize([:sid], :qty => :sum, :count => :count)
```

**Expected SQLite:**
```sql
SELECT `t1`.`sid`, sum(`t1`.`qty`) AS 'qty', count(*) AS 'count'
FROM `supplies` AS 't1'
GROUP BY `t1`.`sid`
```

---

### summarize.03 — Group-by multiple attributes

**Status:** ported

**Ruby:**
```ruby
supplies
  .summarize([:sid, :pid], :qty => :sum, :count => :count)
```

**Expected SQLite:** GROUP BY `t1.sid, t1.pid`.

---

### summarize.04 — Restrict pushed down before GROUP BY

**Status:** ported

**Ruby:**
```ruby
supplies
  .restrict(:pid => 'P1')
  .summarize([:sid], :qty => :sum, :count => :count)
```

**Expected SQLite:** WHERE + GROUP BY in the same SELECT.

---

### summarize.05 — Summarize over a join

**Status:** known-bug (it.fails with correct expected SQL)

**Delta:** bmg-sql emits `ON "t1"."sid" = "t1"."sid"` — the cross-cutting
join-alias bug in `buildJoinPredicate` / `processJoin`. See matching.06
and `left_join.md` for the root cause. Test asserts the CORRECT join
predicate under `it.fails`; when the bug is fixed, the test flips to
passing and alerts us.

**Ruby:**
```ruby
suppliers
  .join(supplies, [:sid])
  .summarize([:sid], :qty => :sum, :count => :count)
```

**Expected SQLite:** INNER JOIN + GROUP BY `t1.sid`, aggregate on `t2.qty`.

---

### summarize.06 — Restrict after summarize → CTE wrap

**Status:** ported

**Note:** bmg-rb wraps the summarize in `WITH t2 AS (...) SELECT ...
FROM t2 WHERE ...`. bmg-sql uses a derived table in FROM. Same
semantics, same precedent as minus.03.

**Ruby:**
```ruby
supplies
  .summarize([:sid], :qty => :sum, :count => :count)
  .restrict(:qty => 2)
```

**Expected SQLite:**
```sql
WITH `t2` AS (
  SELECT `t1`.`sid`, sum(`t1`.`qty`) AS 'qty', count(*) AS 'count'
  FROM `supplies` AS 't1' GROUP BY `t1`.`sid`
)
SELECT ... FROM `t2` AS 't2' WHERE (`t2`.`qty` = 2)
```

---

### summarize.07 — Join against a summarized relation (right side as CTE)

**Status:** blocked (it.todo)

**Delta:** three layered bugs fire: (1) join-alias bug (`t1.sid = t1.sid`);
(2) the inner (right-side) subquery is not requalified, so it keeps `"t1"`
aliases inside while the outer query also uses `t1`; (3) the outer WHERE
references `"t1"."qty"` when `qty` lives on the right-side derived table.
All three are rooted in the same `processJoin` / `processRequalify`
refactor that blocks `left_join.*`. Not snapshotable as a single
correct-SQL expected string without fixing the processor family.

**Ruby:**
```ruby
suppliers
  .join(supplies.summarize([:sid], :qty => :sum), [:sid])
  .restrict(:qty => 2)
```

**Expected SQLite:**
```sql
WITH `t3` AS (
  SELECT `t2`.`sid`, sum(`t2`.`qty`) AS 'qty'
  FROM `supplies` AS 't2' GROUP BY `t2`.`sid`
)
SELECT ... FROM `suppliers` AS 't1' INNER JOIN `t3` ON ...
WHERE (`t3`.`qty` = 2)
```

---

### summarize.08 — Explicit `Bmg::Summarizer.min` helper

**Status:** ported

**Note:** bmg-js uses `{ min_qty: { op: 'min', attr: 'qty' } }` — the
same verbose `AggregatorSpec` form as the sum cases above. No separate
helper class; the object literal is the helper.

**Ruby:**
```ruby
supplies
  .summarize([], :min_qty => Bmg::Summarizer.min(:qty))
```

**Expected SQLite:**
```sql
SELECT min(`t1`.`qty`) AS 'min_qty' FROM `supplies` AS 't1'
```

---

### summarize.09 — `distinct_count` as keyword aggregator

**Status:** blocked (it.todo)

**Reason:** bmg-sql's SQL AST already handles `distinct_count`
(emits `COUNT(DISTINCT col)`), but the public API won't let you reach
it: bmg core's `AggregatorName` union and bmg-sql's `compilableOps`
allowlist both exclude it. Adding it requires:
1. `'distinct_count'` added to `AggregatorName` in `packages/bmg/src/types.ts`
   (and `lib-definitions.ts`).
2. A `distinct_count` case in in-memory `applyAggregator`
   (`packages/bmg/src/sync/operators/summarize.ts` and async).
3. `'distinct_count'` added to `compilableOps` in bmg-sql's
   `SqlRelation.summarize()` allowlist.
Cross-package change, out of scope for test porting.

**Ruby:**
```ruby
supplies
  .summarize([], :qty => :distinct_count)
```

**Expected SQLite:**
```sql
SELECT count(DISTINCT `t1`.`qty`) AS 'qty' FROM `supplies` AS 't1'
```

---

### summarize.10 — `Summarizer.distinct_count(:qty)` helper form

**Status:** blocked (it.todo)

**Reason:** same as summarize.09. bmg-js would express this as
`{ count: { op: 'distinct_count', attr: 'qty' } }` — verbose form — but
the `distinct_count` op isn't in `AggregatorName`, so the type rejects
it before it reaches bmg-sql.

**Ruby:**
```ruby
supplies
  .summarize([], :count => Bmg::Summarizer.distinct_count(:qty))
```

**Expected SQLite:**
```sql
SELECT count(DISTINCT `t1`.`qty`) AS 'count' FROM `supplies` AS 't1'
```
