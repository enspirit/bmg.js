# union

- **Source:** [spec/integration/sequel/base/union.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/union.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 3
- **Ported:** 2/3 (1 blocked)
- **bmg-sql support:** full — UNION; UNION ALL supported in `processMerge` but not exposed on `Relation.union()` surface
- **Test file:** `union.test.ts`

## Cases

### union.01 — Self-union (deduped via UNION)

**Status:** ported

**Port notes:** bmg-sql wraps each SELECT in parens: `(SELECT ...) UNION (SELECT ...)`. bmg-rb does not. Syntactic difference, same query.

**Ruby:**
```ruby
suppliers.union(suppliers)
```

**Expected SQLite:**
```sql
SELECT ... FROM `suppliers` AS 't1'
UNION
SELECT ... FROM `suppliers` AS 't1'
```

---

### union.02 — Chained union

**Status:** ported

**Port notes:** bmg-sql left-nests chained unions: `((A) UNION (B)) UNION (C)`. bmg-rb flattens. Same query.

**Ruby:**
```ruby
suppliers.union(suppliers).union(suppliers)
```

**Expected SQLite:**
```sql
SELECT ... UNION SELECT ... UNION SELECT ...
```

---

### union.03 — UNION ALL via `all: true` option

**Status:** blocked — Relation.union() API does not accept options

**Warnings:** `processMerge()` in bmg-sql accepts an `all: boolean` flag, but `SqlRelation.union()` hardcodes `false`. Exposing the option requires extending `Relation.union()` in bmg core (`types.ts`, `lib-definitions.ts`, `Memory.ts`, `async/types.ts`, `async/Relation/Base.ts`) plus the SqlRelation method. Cross-package change — out of scope for test porting.

**Ruby:**
```ruby
suppliers.union(suppliers, all: true)
```

**Expected SQLite:**
```sql
SELECT ... FROM `suppliers` AS 't1'
UNION ALL
SELECT ... FROM `suppliers` AS 't1'
```
