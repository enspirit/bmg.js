# not_matching

- **Source:** [spec/integration/sequel/base/not_matching.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/not_matching.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 4
- **Ported:** 0/4
- **bmg-sql support:** full — anti-join via `WHERE NOT (EXISTS (...))`

## Cases

### not_matching.01 — Anti-join on single key

**Status:** todo

**Ruby:**
```ruby
suppliers
  .not_matching(supplies, [:sid])
```

**Expected SQLite:**
```sql
SELECT ... FROM `suppliers` AS 't1'
WHERE NOT (EXISTS (
  SELECT * FROM `supplies` AS 't2'
  WHERE (`t1`.`sid` = `t2`.`sid`)
))
```

---

### not_matching.02 — Empty key list (right-is-empty)

**Status:** todo

**Warnings:** Same alias-numbering quirk as matching.02.

**Ruby:**
```ruby
suppliers
  .not_matching(supplies, [])
```

**Expected SQLite:**
```sql
WHERE NOT (EXISTS (
  SELECT * FROM `supplies` AS 't4'
))
```

---

### not_matching.03 — Multi-attribute key

**Status:** todo

**Ruby:**
```ruby
suppliers
  .not_matching(suppliers, [:sid, :name])
```

**Expected SQLite:**
```sql
WHERE NOT (EXISTS (
  SELECT * FROM `suppliers` AS 't2'
  WHERE ((`t1`.`sid` = `t2`.`sid`) AND (`t1`.`name` = `t2`.`name`))
))
```

---

### not_matching.04 — Against a native SQL relation

**Status:** todo

**Warnings:** Same raw-SQL-subquery concern as matching.07.

**Ruby:**
```ruby
suppliers
  .not_matching(native_sids_of_suppliers_in_london, [:sid])
```

**Expected SQLite:**
```sql
WHERE NOT (EXISTS (
  SELECT * FROM
    (SELECT sid FROM suppliers WHERE city = 'London') AS 't2'
  WHERE (`t1`.`sid` = `t2`.`sid`)
))
```
