# not_matching

- **Source:** [spec/integration/sequel/base/not_matching.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/not_matching.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 4
- **Ported:** 4/4 (.04 ported by unblocker D)
- **bmg-sql support:** full — anti-join via `WHERE NOT EXISTS (...)` (via processSemiJoin)
- **Test file:** `not_matching.test.ts`
- **Port notes:** bmg-sql emits `SELECT 1 AS "_exists"` inside EXISTS (where bmg-rb uses `SELECT *`) and adds a vacuous `WHERE 1=1` in the empty-key case. Both are semantically equivalent for EXISTS evaluation.

## Cases

### not_matching.01 — Anti-join on single key

**Status:** ported

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

**Status:** ported

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

**Status:** ported

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

**Status:** ported (unblocker D)

**Note:** Same pattern as matching.07 — uses `BmgSql.fromSubquery`.

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
