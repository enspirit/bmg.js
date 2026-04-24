# summarize

- **Source:** [spec/integration/sequel/base/summarize.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/summarize.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 10
- **Ported:** 10/10. `.05` and `.07` unblocked by the join-alias + WHERE-qualifier fix.
- **bmg-sql support:** full — GROUP BY, standard aggregates, `distinct_count`, restrict-over-summarize (derived-table wrap), summarize-over-join.

**API divergence (resolved by convention):**
bmg-rb's `:qty => :sum` means "SUM the `qty` column, name the result
`qty`". bmg-js's short form `{ qty: 'sum' }` produces `SUM(*)` (attr is
undefined) — NOT equivalent. Tests use the verbose `AggregatorSpec`
form `{ qty: { op: 'sum', attr: 'qty' } }` to match bmg-rb semantics.
Tracked at the top of `summarize.test.ts`.

**Divergences and blockers:**
- **distinct_count (.09, .10)**: unblocked by unblocker B.
  `'distinct_count'` is now in `AggregatorName` (bmg core),
  `applyAggregator` (sync + async in-memory paths), and
  `compilableOps` (bmg-sql). Both cases ported via the verbose
  `{ name: { op: 'distinct_count', attr: 'qty' } }` form.
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

**Status:** ported (unblocked by join-alias fix)

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

**Status:** ported (unblocked by join-alias + WHERE-qualifier fix)

**Delta:** bmg-rb emits `WITH t3 AS (...) SELECT ... FROM suppliers t1
INNER JOIN t3 ... WHERE t3.qty = 2`. bmg-sql uses a derived-table
subquery in FROM instead of a CTE (same precedent as minus.03 /
summarize.06). The inner subquery reuses alias `t1` inside its own
scope; that shadows but does not clash with the outer suppliers `t1`
(subquery scope). The WHERE's `qty` resolves to `t4.qty` via the
select-list lookup added in the join-alias fix.

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

**Status:** ported (unblocker B)

**Note:** bmg-js has no true short form — the verbose
`{ qty: { op: 'distinct_count', attr: 'qty' } }` is the only form,
because bmg-sql's short form attaches no column (same story as
`'sum'` vs the verbose sum spec; see API-divergence note at the top).

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

**Status:** ported (unblocker B)

**Note:** `{ count: { op: 'distinct_count', attr: 'qty' } }` — same
operator as .09, differs only in the result name.

**Ruby:**
```ruby
supplies
  .summarize([], :count => Bmg::Summarizer.distinct_count(:qty))
```

**Expected SQLite:**
```sql
SELECT count(DISTINCT `t1`.`qty`) AS 'count' FROM `supplies` AS 't1'
```
