# union

- **Source:** [spec/integration/sequel/base/union.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/union.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 3
- **Ported:** 0/3
- **bmg-sql support:** full — UNION / UNION ALL

## Cases

### union.01 — Self-union (deduped via UNION)

**Status:** todo

**Ruby:**
```ruby
suppliers.union(suppliers)
```

**Expected SQLite:**
```sql
SELECT ... FROM `suppliers` AS 't1'
UNION
SELECT ... FROM `suppliers` AS 't1'
```

---

### union.02 — Chained union

**Status:** todo

**Ruby:**
```ruby
suppliers.union(suppliers).union(suppliers)
```

**Expected SQLite:**
```sql
SELECT ... UNION SELECT ... UNION SELECT ...
```

---

### union.03 — UNION ALL via `all: true` option

**Status:** todo

**Warnings:** Ruby uses keyword arg `all: true`. bmg-js equivalent — likely `union(other, { all: true })`. Verify/implement during port.

**Ruby:**
```ruby
suppliers.union(suppliers, all: true)
```

**Expected SQLite:**
```sql
SELECT ... FROM `suppliers` AS 't1'
UNION ALL
SELECT ... FROM `suppliers` AS 't1'
```
