# allbut

- **Source:** [spec/integration/sequel/base/allbut.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/allbut.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 5
- **Ported:** 5/5 (1 divergent)
- **bmg-sql support:** full — pushed down via `processAllbut`, DISTINCT-aware via `RelationType`
- **Test file:** `allbut.test.ts`

## Cases

### allbut.01 — Remove two attributes (key preserved → no DISTINCT)

**Status:** ported

**Ruby:**
```ruby
suppliers.allbut([:city, :status])
```

**Expected SQLite:**
```sql
SELECT `t1`.`sid`, `t1`.`name`
FROM `suppliers` AS 't1'
```

---

### allbut.02 — Remove all but city (key dropped → DISTINCT required)

**Status:** ported

**Warnings:** Tests the DISTINCT optimization. With `keys: [['sid']]` and the key dropped, bmg-sql must emit `SELECT DISTINCT`.

**Ruby:**
```ruby
suppliers.allbut([:sid, :name, :status])
```

**Expected SQLite:**
```sql
SELECT DISTINCT `t1`.`city`
FROM `suppliers` AS 't1'
```

---

### allbut.03 — project then allbut (key still preserved → no DISTINCT)

**Status:** ported

**Warnings:** project reduces attrs but keeps key; subsequent allbut removes non-key attr — key still present, no DISTINCT.

**Ruby:**
```ruby
suppliers.project([:sid, :name, :city]).allbut([:city])
```

**Expected SQLite:**
```sql
SELECT `t1`.`sid`, `t1`.`name`
FROM `suppliers` AS 't1'
```

---

### allbut.04 — restrict then allbut (predicate pushed through)

**Status:** divergent — bmg-sql adds a redundant DISTINCT

**Divergence:** bmg-rb recognizes that `restrict(sid = 'S1')` on a relation keyed by `[sid, pid]` functionally restores uniqueness via `pid` alone, so `allbut(sid)` produces unique `(pid, qty)` tuples without DISTINCT. bmg-sql's `RelationType` only tracks whole-key preservation; it sees `[sid, pid]` broken by allbut and emits DISTINCT defensively. Same result set, different query. Fixing this needs smarter key inference in `RelationType.restrict()` (track functional dependencies from equality restricts).

**Ruby:**
```ruby
supplies
  .restrict(sid: "S1")
  .allbut([:sid])
```

**Expected SQLite:**
```sql
SELECT `t1`.`pid`, `t1`.`qty`
FROM `supplies` AS 't1'
WHERE (`t1`.`sid` = 'S1')
```

---

### allbut.05 — allbut a key-component after OR-restrict → DISTINCT

**Status:** ported

**Warnings:** Uses `Predicate.eq(...) | Predicate.eq(...)` disjunction. bmg-js equivalent likely via `@enspirit/predicate`. Removing `sid` (part of supplies key) requires DISTINCT.

**Ruby:**
```ruby
supplies
  .restrict(Predicate.eq(sid: "S1") | Predicate.eq(sid: "S2"))
  .allbut([:sid])
```

**Expected SQLite:**
```sql
SELECT DISTINCT `t1`.`pid`, `t1`.`qty`
FROM `supplies` AS 't1'
WHERE ((`t1`.`sid` = 'S1') OR (`t1`.`sid` = 'S2'))
```
