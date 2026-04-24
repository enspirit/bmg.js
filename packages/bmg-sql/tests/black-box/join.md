# join

- **Source:** [spec/integration/sequel/base/join.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/join.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 14
- **Ported:** 10/14. `.02`/`.10` blocked (prefix push-down); `.08`/`.09` blocked (CROSS JOIN push-down).
- **bmg-sql support:** full INNER JOIN push-down; CROSS JOIN not wired (cross_product falls back to in-memory).
- **Test file:** `join.test.ts`

## Cases

### join.01 — Simple inner join on single key

**Status:** ported

**Ruby:**
```ruby
suppliers
  .join(supplies, [:sid])
```

**Expected SQLite:**
```sql
SELECT ...
FROM `suppliers` AS 't1'
INNER JOIN `supplies` AS 't2' ON (`t1`.`sid` = `t2`.`sid`)
```

---

### join.02 — Join after rename + prefix

**Status:** blocked — `prefix` push-down not implemented (falls back to in-memory)

**Ruby:**
```ruby
supplies
  .rename(:sid => :supplier_sid)
  .join(suppliers.prefix(:supplier_), [:supplier_sid])
```

**Expected SQLite:** (see YAML for full shape; 6 aliased columns)

---

### join.03 — Join with rename on right-side that creates conflicting attribute

**Status:** ported — bmg-sql drops the right-side's conflicting `city` column in the merged select list (right only contributes `pid`). Matches bmg-rb.

**Ruby:**
```ruby
suppliers
  .join(supplies.rename(:qty => :city), [:sid])
```

**Expected SQLite:** (see YAML)

---

### join.04 — Chained joins (3 relations)

**Status:** ported

**Ruby:**
```ruby
supplies
  .join(suppliers, [:sid])
  .join(parts, [:pid])
```

**Expected SQLite:**
```sql
SELECT ...
FROM `supplies` AS 't1'
INNER JOIN `suppliers` AS 't2' ON (`t1`.`sid` = `t2`.`sid`)
INNER JOIN `parts` AS 't3' ON (`t1`.`pid` = `t3`.`pid`)
```

---

### join.05 — Chained joins (4 relations)

**Status:** ported

**Ruby:**
```ruby
supplies
  .join(suppliers, [:sid])
  .join(parts, [:pid])
  .join(cities, [:city])
```

**Expected SQLite:** 4-way INNER JOIN chain.

---

### join.06 — Right side is itself a join (sub-join as right operand)

**Status:** ported — bmg-sql emits the bracketed form `A JOIN B JOIN C ON x ON y` (accepted by SQLite/Postgres as equivalent to the flat form).

**Ruby:**
```ruby
suppliers
  .join(supplies.join(parts, [:pid]), [:sid])
```

**Expected SQLite:** 3-way flat INNER JOIN.

---

### join.07 — Mixed chained + sub-join

**Status:** ported

**Ruby:**
```ruby
suppliers
  .join(cities, [:city])
  .join(supplies.join(parts, [:pid]), [:sid])
```

**Expected SQLite:** 4-way flat INNER JOIN.

---

### join.08 — Cross join (empty key list)

**Status:** blocked — `cross_join` / `join(other, [])` push-down not implemented

**Ruby:**
```ruby
suppliers
  .join(cities, [])
```

**Expected SQLite:**
```sql
SELECT ...
FROM `suppliers` AS 't1'
CROSS JOIN `cities` AS 't2'
```

---

### join.09 — Cross join then inner join (FROM ordering reshuffled)

**Status:** blocked — `cross_join` push-down not implemented

**Ruby:**
```ruby
suppliers
  .join(cities, [])
  .join(parts, [:city])
```

**Expected SQLite:** (see YAML for exact FROM ordering)

---

### join.10 — Join with explicit attribute-mapping + prefix

**Status:** blocked — `prefix` push-down not implemented (falls back to in-memory)

**Ruby:**
```ruby
supplies
  .join(suppliers.prefix(:supplier_), :sid => :supplier_sid)
  .join(parts.prefix(:part_), :pid => :part_pid)
```

**Expected SQLite:** (see YAML)

---

### join.11 — Restricts on both sides push through to WHERE

**Status:** ported — both restricts land in WHERE. bmg-js's WHERE qualifier
resolves `pid` (the join key) to the left-contributed alias `t1` in the
merged select list, so both conjuncts read `t1.pid = 'P1'`. Since the join
condition enforces `t1.pid = t2.pid`, this is semantically equivalent to
bmg-rb's `t1.pid = 'P1' AND t2.pid = 'P1'`.

**Ruby:**
```ruby
supplies
  .restrict(pid: 'P1')
  .join(parts.restrict(pid: 'P1'), [:pid])
```

**Expected SQLite:** INNER JOIN + `WHERE ((t1.pid = 'P1') AND (t2.pid = 'P1'))`.

---

### join.12 — Restricts on different attributes

**Status:** ported

**Ruby:**
```ruby
supplies
  .restrict(pid: 'P1')
  .join(parts.restrict(name: 'Nut'), [:pid])
```

**Expected SQLite:** INNER JOIN + `WHERE ((t1.pid = 'P1') AND (t2.name = 'Nut'))`.

---

### join.13 — Self-join with contradictory restricts

**Status:** ported — same qualifier resolution as .11: both restricts on
`pid` qualify to `t1` (the left side) because `pid` is a join key. With
`t1.pid = 'P1' AND t1.pid = 'P2'` the query is semantically empty, as
bmg-rb's `t1.pid = 'P1' AND t2.pid = 'P2'` would also be given the equi-join.

**Ruby:**
```ruby
supplies
  .restrict(pid: 'P1')
  .join(supplies.restrict(pid: 'P2'), [:sid])
```

**Expected SQLite:** Self-join + both restricts in WHERE.

---

### join.14 — Self-join on all key attributes (identity join)

**Status:** ported — all 3 keys emit `AND`-joined equi-predicates; select list has only left columns because all right attrs are in the join keys.

**Ruby:**
```ruby
suppliers
  .join(suppliers, [:sid, :name, :city])
```

**Expected SQLite:** INNER JOIN with compound ON across all 3 key attrs.
