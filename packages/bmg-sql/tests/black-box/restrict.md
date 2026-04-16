# restrict

- **Source:** [spec/integration/sequel/base/restrict.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/restrict.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 11
- **Ported:** 0/11
- **bmg-sql support:** full — pushed down via `processWhere`

## Cases

### restrict.01 — Equality on single attribute

**Status:** todo

**Ruby:**
```ruby
suppliers
  .restrict(:sid => 'S1')
```

**Expected SQLite:**
```sql
SELECT `t1`.`sid`, `t1`.`name`, `t1`.`city`, `t1`.`status`
FROM `suppliers` AS 't1'
WHERE (`t1`.`sid` = 'S1')
```

---

### restrict.02 — IN with explicit list of values

**Status:** todo

**Ruby:**
```ruby
suppliers
  .restrict(:sid => ['S1', 'S2'])
```

**Expected SQLite:**
```sql
SELECT `t1`.`sid`, `t1`.`name`, `t1`.`city`, `t1`.`status`
FROM `suppliers` AS 't1'
WHERE (`t1`.`sid` IN ('S1', 'S2'))
```

---

### restrict.03 — IN list mixing NULL and values (NULL pulled out via OR)

**Status:** todo

**Warnings:** NULL-in-IN semantics — bmg-rb splits NULL into a separate `IS NULL` disjunct because SQL `IN` does not match NULL.

**Ruby:**
```ruby
suppliers
  .restrict(:sid => [nil, 'S1', 'S2'])
```

**Expected SQLite:**
```sql
WHERE ((`t1`.`sid` IS NULL) OR (`t1`.`sid` IN ('S1', 'S2')))
```

---

### restrict.04 — NULL + single value (IN degenerates to `=`)

**Status:** todo

**Warnings:** single-value IN optimization.

**Ruby:**
```ruby
suppliers
  .restrict(:sid => [nil, 'S2'])
```

**Expected SQLite:**
```sql
WHERE ((`t1`.`sid` IS NULL) OR (`t1`.`sid` = 'S2'))
```

---

### restrict.05 — List containing only NULL → `IS NULL`

**Status:** todo

**Ruby:**
```ruby
suppliers
  .restrict(:sid => [nil])
```

**Expected SQLite:**
```sql
WHERE (`t1`.`sid` IS NULL)
```

---

### restrict.06 — Chained restricts combine via AND

**Status:** todo

**Warnings:** bmg-rb orders the outer restrict first in the AND. Order may differ in bmg-sql — commutative AND; normalizer must be order-insensitive or we accept divergence.

**Ruby:**
```ruby
suppliers
  .restrict(:sid => ['S1', 'S2'])
  .restrict(:sid => 'S3')
```

**Expected SQLite:**
```sql
WHERE ((`t1`.`sid` = 'S3') AND (`t1`.`sid` IN ('S1', 'S2')))
```

---

### restrict.07 — Restrict after rename resolves aliased attribute

**Status:** todo

**Warnings:** bmg-rb pushes the predicate through the rename and references the underlying column (`name`), not the alias (`firstname`). Important optimization to preserve.

**Ruby:**
```ruby
suppliers
  .rename(:name => :firstname)
  .restrict(:firstname => 'Smith')
```

**Expected SQLite:**
```sql
SELECT `t1`.`sid`, `t1`.`name` AS 'firstname', `t1`.`city`, `t1`.`status`
FROM `suppliers` AS 't1'
WHERE (`t1`.`name` = 'Smith')
```

---

### restrict.08 — LIKE via `Predicate.match`

**Status:** todo

**Warnings:** Requires `match` predicate in `@enspirit/predicate` compiling to `LIKE '%x%' ESCAPE '\'`. Verify current predicate algebra supports this; may be `blocked`.

**Ruby:**
```ruby
suppliers
  .restrict(Predicate.match(:city, "Lon"))
```

**Expected SQLite:**
```sql
WHERE (`t1`.`city` LIKE '%Lon%' ESCAPE '\')
```

---

### restrict.09 — Case-insensitive LIKE via `case_sensitive: false`

**Status:** todo

**Warnings:** Extension of restrict.08. `UPPER(col) LIKE UPPER('%x%')`. Depends on predicate algebra support.

**Ruby:**
```ruby
suppliers
  .restrict(Predicate.match(:city, "Lon", case_sensitive: false))
```

**Expected SQLite:**
```sql
WHERE (UPPER(`t1`.`city`) LIKE UPPER('%Lon%') ESCAPE '\')
```

---

### restrict.10 — Restrict push-down across UNION

**Status:** todo

**Warnings:** Restrict applied *after* a union is pushed down into *both* branches. Non-trivial optimization — verify bmg-sql does this.

**Ruby:**
```ruby
suppliers
  .union(suppliers)
  .restrict(:city => "London")
```

**Expected SQLite:**
```sql
SELECT ... FROM `suppliers` AS 't1' WHERE (`t1`.`city` = 'London')
UNION
SELECT ... FROM `suppliers` AS 't1' WHERE (`t1`.`city` = 'London')
```

---

### restrict.11 — Restrict push-down across UNION with existing branch restricts

**Status:** todo

**Warnings:** The pre-union restricts and post-union restrict are combined per branch. bmg-rb appears to collapse "restrict(A).union(x.restrict(B)).restrict(A)" — the trailing A is absorbed because each branch already restricts. Verify.

**Ruby:**
```ruby
suppliers
  .restrict(:city => "London")
  .union(suppliers.restrict(:city => "Paris"))
  .restrict(:city => "London")
```

**Expected SQLite:**
```sql
SELECT ... FROM `suppliers` AS 't1'
WHERE (`t1`.`city` = 'London')
```

(The Paris branch is eliminated because the trailing restrict(city='London') applied to it yields an empty result that collapses away. This is an aggressive optimization — may be `divergent` in bmg-sql.)
