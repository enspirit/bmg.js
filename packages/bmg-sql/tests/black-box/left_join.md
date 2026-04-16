# left_join

- **Source:** [spec/integration/sequel/base/left_join.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/left_join.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 8
- **Ported:** 0/8 (all blocked)
- **bmg-sql support:** LEFT JOIN push-down is wired but **broken by a join alias bug** — see "Blocker" below. Defaults/COALESCE API is also missing.
- **Test file:** `left_join.test.ts` (all `it.todo`)

## Blocker: join alias bug

`buildJoinPredicate` (in `relation.ts`) builds the `ON` predicate using each relation's own `SqlBuilder` to resolve aliases. Since every relation's builder starts its counter at `t1`, both operands resolve to `t1`, and the resulting predicate is e.g. `t1.sid = t1.sid`. `processJoin` then calls `processRequalify` to rename the right side's table aliases (→ `t2`), but the pre-built `on` predicate is NOT rewritten — it still says `t1.sid = t1.sid`. All push-down joins emit wrong `ON` clauses.

**Scope:** affects `join`, `left_join`, and `matching`-against-a-joined-right-side (`matching.06`). Query results are incorrect against a real DB, not just cosmetic.

**Fix requires API reshape** in `processJoin` (either pass join keys instead of a pre-built predicate, or return the old→new qualifier map from `processRequalify` so the predicate can be rewritten with the final aliases). Non-trivial — handed back to user.

## Cases

## Cases

### left_join.01 — Simple left join, no defaults

**Status:** blocked — join alias bug (see top of file)

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

**Status:** blocked — join alias bug (see top of file)

**Warnings:** Uses `{:sid => :id}` mapping form.

**Ruby:**
```ruby
suppliers
  .left_join(supplies.rename(:sid => :id), {:sid => :id}, {})
```

**Expected SQLite:** LEFT JOIN with ON `t1.sid = t2.sid` (bmg-rb resolves the rename back to the underlying column).

---

### left_join.03 — Left join with default values (COALESCE)

**Status:** blocked — join alias bug (see top of file)

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

**Status:** blocked — join alias bug (see top of file)

**Ruby:**
```ruby
supplies
  .left_join(suppliers, [:sid])
  .left_join(parts, [:pid])
```

**Expected SQLite:** Two chained LEFT JOINs.

---

### left_join.05 — INNER then LEFT mix

**Status:** blocked — join alias bug (see top of file)

**Ruby:**
```ruby
supplies
  .join(suppliers, [:sid])
  .left_join(parts, [:pid])
```

**Expected SQLite:** INNER JOIN then LEFT JOIN (natural left-to-right ordering).

---

### left_join.06 — LEFT then INNER mix (reordering expected)

**Status:** blocked — join alias bug (see top of file)

**Warnings:** bmg-rb reorders FROM so INNER appears before LEFT in the final FROM clause. Verify — may `divergent`.

**Ruby:**
```ruby
supplies
  .left_join(suppliers, [:sid])
  .join(parts, [:pid])
```

**Expected SQLite:** `FROM supplies t1 INNER JOIN parts t3 ... LEFT JOIN suppliers t2 ...` (reordered).

---

### left_join.07 — Restrict after left_join (referencing right-side col)

**Status:** blocked — join alias bug (see top of file)

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

**Status:** blocked — join alias bug (see top of file)

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
