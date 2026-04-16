# join

- **Source:** [spec/integration/sequel/base/join.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/join.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 14
- **Ported:** 0/14
- **bmg-sql support:** full — INNER JOIN + CROSS JOIN (empty key list)

## Cases

### join.01 — Simple inner join on single key

**Status:** todo

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

**Status:** todo

**Warnings:** Depends on prefix push-down (currently fallback-only). May be `blocked` or `divergent`.

**Ruby:**
```ruby
supplies
  .rename(:sid => :supplier_sid)
  .join(suppliers.prefix(:supplier_), [:supplier_sid])
```

**Expected SQLite:** (see YAML for full shape; 6 aliased columns)

---

### join.03 — Join with rename on right-side that creates conflicting attribute

**Status:** todo

**Warnings:** `supplies.rename(:qty => :city)` makes right-side's `city` conflict with left's `city`. bmg-rb resolves this by… projecting away the conflicting column on the right? Inspect expected output carefully — right side only contributes `pid`, suggesting bmg-rb either drops the conflict or the join keys propagate in a specific way. Investigate semantic during port.

**Ruby:**
```ruby
suppliers
  .join(supplies.rename(:qty => :city), [:sid])
```

**Expected SQLite:** (see YAML)

---

### join.04 — Chained joins (3 relations)

**Status:** todo

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

**Status:** todo

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

**Status:** todo

**Warnings:** bmg-rb flattens the sub-join into the parent FROM clause rather than wrapping it in a subquery. Verify bmg-sql does the same flattening.

**Ruby:**
```ruby
suppliers
  .join(supplies.join(parts, [:pid]), [:sid])
```

**Expected SQLite:** 3-way flat INNER JOIN.

---

### join.07 — Mixed chained + sub-join

**Status:** todo

**Ruby:**
```ruby
suppliers
  .join(cities, [:city])
  .join(supplies.join(parts, [:pid]), [:sid])
```

**Expected SQLite:** 4-way flat INNER JOIN.

---

### join.08 — Cross join (empty key list)

**Status:** todo

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

**Status:** todo

**Warnings:** bmg-rb reorders FROM to `cities CROSS JOIN suppliers INNER JOIN parts ON (suppliers.city = parts.city)`. The cross-join inversion is an optimization — may `divergent` in bmg-sql; note expected ordering carefully.

**Ruby:**
```ruby
suppliers
  .join(cities, [])
  .join(parts, [:city])
```

**Expected SQLite:** (see YAML for exact FROM ordering)

---

### join.10 — Join with explicit attribute-mapping + prefix

**Status:** todo

**Warnings:** Uses hash-form key `:sid => :supplier_sid` to express "left.sid = right.supplier_sid". bmg-js equivalent: `join(other, { sid: 'supplier_sid' })` or similar. Verify API.

**Ruby:**
```ruby
supplies
  .join(suppliers.prefix(:supplier_), :sid => :supplier_sid)
  .join(parts.prefix(:part_), :pid => :part_pid)
```

**Expected SQLite:** (see YAML)

---

### join.11 — Restricts on both sides push through to WHERE

**Status:** todo

**Warnings:** bmg-rb merges the restrict from both sides into a single WHERE after the INNER JOIN. Verify bmg-sql does the same merge.

**Ruby:**
```ruby
supplies
  .restrict(pid: 'P1')
  .join(parts.restrict(pid: 'P1'), [:pid])
```

**Expected SQLite:** INNER JOIN + `WHERE ((t1.pid = 'P1') AND (t2.pid = 'P1'))`.

---

### join.12 — Restricts on different attributes

**Status:** todo

**Ruby:**
```ruby
supplies
  .restrict(pid: 'P1')
  .join(parts.restrict(name: 'Nut'), [:pid])
```

**Expected SQLite:** INNER JOIN + `WHERE ((t1.pid = 'P1') AND (t2.name = 'Nut'))`.

---

### join.13 — Self-join with contradictory restricts

**Status:** todo

**Warnings:** Both sides of `supplies` with conflicting `pid` values. Semantically empty but bmg-rb does NOT short-circuit — it emits the full query and lets SQL return empty. Good test for "don't over-optimize".

**Ruby:**
```ruby
supplies
  .restrict(pid: 'P1')
  .join(supplies.restrict(pid: 'P2'), [:sid])
```

**Expected SQLite:** Self-join + both restricts in WHERE.

---

### join.14 — Self-join on all key attributes (identity join)

**Status:** todo

**Warnings:** Left projection is just the left side's columns; bmg-rb does not duplicate right-side attrs because all are key attrs.

**Ruby:**
```ruby
suppliers
  .join(suppliers, [:sid, :name, :city])
```

**Expected SQLite:** INNER JOIN with compound ON across all 3 key attrs.
