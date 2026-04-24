# left_join

- **Source:** [spec/integration/sequel/base/left_join.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/left_join.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 8
- **Ported:** 6/8. `.03` and `.08` blocked (defaults/COALESCE API missing).
- **bmg-sql support:** full LEFT JOIN push-down (join-alias bug fixed). Defaults/COALESCE API not implemented.
- **Test file:** `left_join.test.ts`

## Cases

## Cases

### left_join.01 — Simple left join, no defaults

**Status:** ported

**Warnings:** Ruby `left_join(supplies, [:sid], {})` has a third arg `{}` — defaults map. Verify bmg-js signature: likely `leftJoin(other, keys, defaults?)` or `left_join` (snake_case matches bmg-rb).

**Ruby:**
```ruby
suppliers
  .left_join(supplies, [:sid], {})
```

**Expected SQLite:**
```sql
SELECT ... FROM `suppliers` AS 't1'
LEFT JOIN `supplies` AS 't2' ON (`t1`.`sid` = `t2`.`sid`)
```

---

### left_join.02 — Left join with attribute-mapping (hash key)

**Status:** ported

**Warnings:** Uses `{:sid => :id}` mapping form.

**Ruby:**
```ruby
suppliers
  .left_join(supplies.rename(:sid => :id), {:sid => :id}, {})
```

**Expected SQLite:** LEFT JOIN with ON `t1.sid = t2.sid` (bmg-rb resolves the rename back to the underlying column).

---

### left_join.03 — Left join with default values (COALESCE)

**Status:** blocked — defaults/COALESCE API not implemented in bmg-js

**Warnings:** Defaults `{pid: 'P9', qty: 0}` become `COALESCE(col, default) AS 'col'`. Important feature — verify bmg-sql supports this, otherwise `blocked`.

**Ruby:**
```ruby
suppliers
  .left_join(supplies, [:sid], { pid: 'P9', qty: 0 })
```

**Expected SQLite:**
```sql
SELECT ..., coalesce(`t2`.`pid`, 'P9') AS 'pid', coalesce(`t2`.`qty`, 0) AS 'qty'
FROM `suppliers` AS 't1'
LEFT JOIN `supplies` AS 't2' ON (`t1`.`sid` = `t2`.`sid`)
```

---

### left_join.04 — Chained left joins

**Status:** ported

**Ruby:**
```ruby
supplies
  .left_join(suppliers, [:sid])
  .left_join(parts, [:pid])
```

**Expected SQLite:** Two chained LEFT JOINs.

---

### left_join.05 — INNER then LEFT mix

**Status:** ported

**Ruby:**
```ruby
supplies
  .join(suppliers, [:sid])
  .left_join(parts, [:pid])
```

**Expected SQLite:** INNER JOIN then LEFT JOIN (natural left-to-right ordering).

---

### left_join.06 — LEFT then INNER mix (reordering expected)

**Status:** divergent — bmg-sql emits joins in source order (`LEFT JOIN ... JOIN ...`); bmg-rb reorders FROM so INNER appears before LEFT. Semantically equivalent; literal SQL differs.

**Ruby:**
```ruby
supplies
  .left_join(suppliers, [:sid])
  .join(parts, [:pid])
```

**Expected SQLite:** `FROM supplies t1 INNER JOIN parts t3 ... LEFT JOIN suppliers t2 ...` (reordered).

---

### left_join.07 — Restrict after left_join (referencing right-side col)

**Status:** ported

**Warnings:** Restrict on `qty` (from right side) is placed at the outer WHERE — effectively turns the left join into a semi-filtered join. No CTE wrap required here because the restrict can reference t2 directly.

**Ruby:**
```ruby
suppliers
  .left_join(supplies, [:sid])
  .restrict(qty: 50)
```

**Expected SQLite:** LEFT JOIN + `WHERE (t2.qty = 50)`.

---

### left_join.08 — Restrict after left_join with defaults → CTE wrap required

**Status:** blocked — defaults/COALESCE API not implemented in bmg-js

**Warnings:** When the left_join has defaults (COALESCE) and a subsequent restrict references the defaulted attribute, bmg-rb wraps the left_join in a CTE so the restrict operates on the COALESCEd value. Important correctness test.

**Ruby:**
```ruby
suppliers
  .left_join(supplies, [:sid], { pid: 'P9', qty: 1 })
  .restrict(qty: 50)
```

**Expected SQLite:**
```sql
WITH `t3` AS (
  SELECT ..., coalesce(`t2`.`pid`, 'P9') AS 'pid', coalesce(`t2`.`qty`, 1) AS 'qty'
  FROM `suppliers` AS 't1'
  LEFT JOIN `supplies` AS 't2' ON (`t1`.`sid` = `t2`.`sid`)
)
SELECT ... FROM `t3` AS 't3' WHERE (`t3`.`qty` = 50)
```
