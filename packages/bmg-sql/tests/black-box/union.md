# union

- **Source:** [spec/integration/sequel/base/union.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/union.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 3
- **Ported:** 3/3
- **bmg-sql support:** full — UNION and UNION ALL (via `{ all: true }` option).
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

**Status:** ported — `Relation.union(other, { all: true })` / `AsyncRelation.union(other, { all: true })`.

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
