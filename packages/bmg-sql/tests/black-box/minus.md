# minus

- **Source:** [spec/integration/sequel/base/minus.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/minus.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 3
- **Ported:** 3/3
- **bmg-sql support:** full — EXCEPT
- **Test file:** `minus.test.ts`

## Cases

### minus.01 — Self-minus (empty result, but SQL must be emitted)

**Status:** ported

**Ruby:**
```ruby
suppliers.minus(suppliers)
```

**Expected SQLite:**
```sql
SELECT ... FROM `suppliers` AS 't1'
EXCEPT
SELECT ... FROM `suppliers` AS 't1'
```

---

### minus.02 — Chained minus

**Status:** ported

**Ruby:**
```ruby
suppliers.minus(suppliers).minus(suppliers)
```

**Expected SQLite:**
```sql
SELECT ... EXCEPT SELECT ... EXCEPT SELECT ...
```

---

### minus.03 — minus followed by summarize wraps in CTE

**Status:** ported

**Port notes:** bmg-sql wraps the EXCEPT as a **derived table (subquery in FROM)** rather than a CTE (`WITH t2 AS (...)`). Same query semantically — engines plan inline subqueries and CTEs identically.

**Ruby:**
```ruby
suppliers.minus(suppliers).summarize([:sid], :count => :count)
```

**Expected SQLite:**
```sql
WITH `t2` AS (
  SELECT ... FROM `suppliers` AS 't1'
  EXCEPT
  SELECT ... FROM `suppliers` AS 't1'
)
SELECT `t2`.`sid`, count(*) AS 'count'
FROM `t2` AS 't2'
GROUP BY `t2`.`sid`
```
