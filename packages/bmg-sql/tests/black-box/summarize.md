# summarize

- **Source:** [spec/integration/sequel/base/summarize.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/summarize.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 10
- **Ported:** 0/10
- **bmg-sql support:** full core (GROUP BY + aggregates + CTE-wrap for post-summarize ops); divergences in aggregator API — see warnings per case.

## Cases

### summarize.01 — Aggregate with empty grouping (no GROUP BY)

**Status:** todo

**Warnings:** Ruby `:qty => :sum` means "aggregate qty via SUM, named qty". bmg-js API TBD — decide `summarize([], { qty: 'sum', count: 'count' })` or similar.

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

**Status:** todo

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

**Status:** todo

**Ruby:**
```ruby
supplies
  .summarize([:sid, :pid], :qty => :sum, :count => :count)
```

**Expected SQLite:** GROUP BY `t1.sid, t1.pid`.

---

### summarize.04 — Restrict pushed down before GROUP BY

**Status:** todo

**Ruby:**
```ruby
supplies
  .restrict(:pid => 'P1')
  .summarize([:sid], :qty => :sum, :count => :count)
```

**Expected SQLite:** WHERE + GROUP BY in the same SELECT.

---

### summarize.05 — Summarize over a join

**Status:** todo

**Ruby:**
```ruby
suppliers
  .join(supplies, [:sid])
  .summarize([:sid], :qty => :sum, :count => :count)
```

**Expected SQLite:** INNER JOIN + GROUP BY `t1.sid`, aggregate on `t2.qty`.

---

### summarize.06 — Restrict after summarize → CTE wrap

**Status:** todo

**Warnings:** Post-summarize restrict requires a CTE because WHERE cannot follow GROUP BY. This is the HAVING vs. WHERE distinction handled via CTE.

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

**Status:** todo

**Warnings:** bmg-rb hoists the summarized right-side into a CTE named `t3` and joins against it. Subtle but important.

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

**Status:** todo

**Warnings:** API divergence — bmg-rb uses a `Summarizer.min(:qty)` helper class; bmg-js likely uses `{ min_qty: { min: 'qty' } }` or a functional helper. Decide during port.

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

**Status:** todo

**Warnings:** Ruby `:qty => :distinct_count` — short-form aggregator name. bmg-js equivalent TBD.

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

**Status:** todo

**Warnings:** Same aggregator (distinct_count of qty), different API syntax vs summarize.09. Both should compile to the same SQL.

**Ruby:**
```ruby
supplies
  .summarize([], :count => Bmg::Summarizer.distinct_count(:qty))
```

**Expected SQLite:**
```sql
SELECT count(DISTINCT `t1`.`qty`) AS 'count' FROM `supplies` AS 't1'
```
