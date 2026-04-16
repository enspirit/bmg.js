# minus

- **Source:** [spec/integration/sequel/base/minus.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/minus.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 3
- **Ported:** 0/3
- **bmg-sql support:** full — EXCEPT

## Cases

### minus.01 — Self-minus (empty result, but SQL must be emitted)

**Status:** todo

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

**Status:** todo

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

**Status:** todo

**Warnings:** Summarizing over a set-operation result requires wrapping the EXCEPT query in a CTE (`WITH t2 AS (...)`). bmg-sql must recognize this and emit the CTE boundary.

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
