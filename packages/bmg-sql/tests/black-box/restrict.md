# restrict

- **Source:** [spec/integration/sequel/base/restrict.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/restrict.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 11
- **Ported:** 9/11 (6 strictly ported, 3 divergent, 2 blocked)
- **bmg-sql support:** full (WHERE push-down); several optimizations missing

**Resolved by unblocker A (NULL-in-IN split):**
- .03, .05 are now semantically equivalent to bmg-rb. Both
  `@enspirit/predicate`'s `toSql.ts` and bmg-sql's `compile.ts`
  partition nulls out of `InPredicate.values`, emitting
  `col IS NULL` / `(col IS NULL OR col IN (non-nulls))` as appropriate.
- .04 is ported with a minor cosmetic note: bmg-rb degrades the
  1-element post-split IN to `=` (`IS NULL OR sid = 'S2'`); bmg-sql
  keeps `IN (?)`. Same query, same rows.

**Remaining divergences:**
- Rename push-down into WHERE: bmg-rb resolves the renamed alias back to
  the underlying column inside WHERE. bmg-sql leaves the predicate on
  the SELECT alias — **emits invalid SQL in strict dialects**. Affects
  restrict.07. Needs rename-aware `processWhere`.
- Restrict push-down across UNION: bmg-rb pushes a post-union restrict
  into each branch; bmg-sql wraps the UNION and applies WHERE outside.
  Queries are semantically equivalent but the shape differs. Affects
  restrict.10, .11 (plus .11's aggressive branch-elimination).

## Cases

### restrict.01 — Equality on single attribute

**Status:** ported

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

**Status:** ported

**Note:** bmg-js uses `Pred.in('sid', ['S1','S2'])`; bmg-rb uses the
`:sid => [...]` hash shortcut which maps to the same IN construct.

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

**Status:** ported

**Note:** NULL split was added to both `@enspirit/predicate`'s `toSql.ts`
and bmg-sql's `compile.ts`. Emits
`WHERE ("t1"."sid" IS NULL OR "t1"."sid" IN (?, ?))`.

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

**Status:** ported (minor cosmetic delta)

**Delta:** bmg-rb degrades the 1-element post-split IN to `=`
(`IS NULL OR sid = 'S2'`); bmg-sql keeps `IN (?)`
(`(sid IS NULL OR sid IN (?))`). Semantically equivalent.

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

**Status:** ported

**Note:** Null-only lists collapse to `WHERE "t1"."sid" IS NULL`.

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

**Status:** ported

**Note:** bmg-rb orders the outer restrict first; bmg-sql orders the
inner first. AND is commutative — same query, different string. Test
asserts bmg-sql's order.

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

**Status:** divergent (arguably broken)

**Delta:** bmg-sql leaves the predicate on the SELECT alias
(`"t1"."firstname" = ?`). In Postgres and standard SQL, WHERE cannot
reference SELECT aliases — so the emitted SQL is **invalid** at execution
time, not just suboptimal. Fix requires `processWhere` to consult the
current SELECT list and rewrite alias references back to their
underlying columns. Snapshotted so a future fix flips the assertion.

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

**Status:** blocked

**Reason:** `@enspirit/predicate` does not implement a `match`/LIKE
predicate kind. Adding it requires a new `MatchPredicate` in `types.ts`,
a builder, an evaluator, and a `toSql` branch emitting
`LIKE '%x%' ESCAPE '\'`. Cross-package change out of scope for test
porting.

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

**Status:** blocked

**Reason:** same as restrict.08, plus a `case_sensitive` option on the
match predicate that toggles `UPPER(col) LIKE UPPER('%x%')`.

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

**Status:** divergent

**Delta:** bmg-sql wraps the UNION in a derived table and applies WHERE
at the outer level (`SELECT "t2".* FROM (union) "t2" WHERE ...`).
bmg-rb pushes the restrict into each branch. Both queries return the
same rows; bmg-sql's is one extra subquery hop.

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

**Status:** divergent

**Delta:** bmg-sql keeps both pre-union restricts on their branches
(`city='London'` / `city='Paris'`) and wraps the UNION with the outer
`city='London'` restrict. bmg-rb detects that the outer restrict makes
the Paris branch unsatisfiable and collapses the whole chain to a
single `WHERE city='London'`. Aggressive optimization; bmg-sql would
need branch-aware predicate folding to match it.

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
