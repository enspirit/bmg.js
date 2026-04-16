# matching

- **Source:** [spec/integration/sequel/base/matching.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/matching.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 7
- **Ported:** 0/7
- **bmg-sql support:** full — semi-join via `WHERE EXISTS (...)` (commit 9a676bb)

## Cases

### matching.01 — Single-key semi-join

**Status:** todo

**Ruby:**
```ruby
suppliers
  .matching(supplies, [:sid])
```

**Expected SQLite:**
```sql
SELECT ... FROM `suppliers` AS 't1'
WHERE (EXISTS (
  SELECT * FROM `supplies` AS 't2'
  WHERE (`t1`.`sid` = `t2`.`sid`)
))
```

---

### matching.02 — Empty key list (degenerates to "right is non-empty")

**Status:** todo

**Warnings:** bmg-rb uses alias `t4` in the subquery (fresh counter), and omits the WHERE clause since there are no equi-predicates. Alias-numbering mismatch is expected — normalizer or test must be alias-agnostic.

**Ruby:**
```ruby
suppliers
  .matching(supplies, [])
```

**Expected SQLite:**
```sql
SELECT ... FROM `suppliers` AS 't1'
WHERE (EXISTS (
  SELECT * FROM `supplies` AS 't4'
))
```

---

### matching.03 — Multi-attribute key

**Status:** todo

**Ruby:**
```ruby
suppliers
  .matching(suppliers, [:sid, :name])
```

**Expected SQLite:**
```sql
WHERE (EXISTS (
  SELECT * FROM `suppliers` AS 't2'
  WHERE ((`t1`.`sid` = `t2`.`sid`) AND (`t1`.`name` = `t2`.`name`))
))
```

---

### matching.04 — Matching against a restricted relation

**Status:** todo

**Warnings:** The right side's restrict is preserved *inside* the EXISTS subquery. Order in AND may differ.

**Ruby:**
```ruby
suppliers
  .matching(supplies.restrict(:sid => 'S1'), [:sid])
```

**Expected SQLite:**
```sql
WHERE (EXISTS (
  SELECT * FROM `supplies` AS 't2'
  WHERE ((`t2`.`sid` = 'S1') AND (`t1`.`sid` = `t2`.`sid`))
))
```

---

### matching.05 — Matching against a projection

**Status:** todo

**Ruby:**
```ruby
suppliers
  .matching(parts.project([:name]), [:name])
```

**Expected SQLite:**
```sql
WHERE (EXISTS (
  SELECT * FROM `parts` AS 't2'
  WHERE (`t1`.`name` = `t2`.`name`)
))
```

---

### matching.06 — Matching against an inner-join

**Status:** todo

**Ruby:**
```ruby
suppliers
  .matching(supplies.join(parts, [:pid]), [:sid])
```

**Expected SQLite:**
```sql
WHERE (EXISTS (
  SELECT * FROM `supplies` AS 't2'
  INNER JOIN `parts` AS 't3' ON (`t2`.`pid` = `t3`.`pid`)
  WHERE (`t1`.`sid` = `t2`.`sid`)
))
```

---

### matching.07 — Matching against a native SQL relation

**Status:** todo

**Warnings:** `native_sids_of_suppliers_in_london` is a bmg-rb relation built from a raw SQL string. Requires bmg-sql to expose a raw-SQL/subquery relation factory. May be `blocked` until that factory exists (see base.02).

**Ruby:**
```ruby
suppliers
  .matching(native_sids_of_suppliers_in_london, [:sid])
```

**Expected SQLite:**
```sql
WHERE (EXISTS (
  SELECT * FROM (
    SELECT sid FROM suppliers WHERE city = 'London'
  ) AS 't2'
  WHERE (`t1`.`sid` = `t2`.`sid`)
))
```
