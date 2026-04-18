# page

- **Source:** [spec/integration/sequel/base/page.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/page.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 5
- **Ported:** 5/5 (unblocker C)
- **bmg-sql support:** full — `SqlRelation.page()` wires to the
  existing `processOrderBy` + `processLimitOffset` processors.

**Notes from porting:**
- `processOrderBy` now wraps complex SELECTs (GROUP BY, LIMIT, or
  computed columns) in a subquery before applying ORDER BY. Without
  this, `ORDER BY "t1"."qty"` after a `MAX(qty) AS qty` aggregate would
  resolve to the underlying column rather than the aggregate alias, and
  fail in most dialects. Fix mirrors `processWhere`'s isComplex wrap.
- `findColumnRef` already resolves SELECT aliases back to underlying
  columns in the ORDER BY path, so page.04 (rename + page) emits
  `ORDER BY "t1"."sid"` (underlying) not `ORDER BY "t1"."id"` (alias).
  Matches bmg-rb.
- bmg-rb uses `WITH t2 AS (...)` CTE wrap for summarize + page; bmg-sql
  uses a derived table in FROM (same precedent as minus.03 /
  summarize.06). Semantically equivalent.

**API:**
```ts
page(ordering: TypedOrdering<T>, page: number, options?: PageOptions): Relation<T>

// where:
type OrderingDirection = 'asc' | 'desc'
type TypedOrderingAttr<T> = (keyof T & string) | [(keyof T & string), OrderingDirection]
type TypedOrdering<T> = TypedOrderingAttr<T>[]
interface PageOptions { pageSize?: number }  // default 20
```

## Cases

### page.01 — First page, asc order by two attrs

**Status:** ported (unblocker C) (operator not exposed)

**Warnings:** `page([:name, :sid], 1, page_size: 2)` → `ORDER BY name ASC, sid ASC LIMIT 2` (no OFFSET for page 1). Needs `Relation.page()` added on core + bmg-sql surface.

**Ruby:**
```ruby
suppliers
  .page([:name, :sid], 1, page_size: 2)
```

**Expected SQLite:**
```sql
SELECT ... FROM `suppliers` AS 't1'
ORDER BY `t1`.`name` ASC, `t1`.`sid` ASC
LIMIT 2
```

---

### page.02 — Later page emits OFFSET

**Status:** ported (unblocker C)

**Warnings:** Page 3 with `page_size: 2` → OFFSET = (3-1)*2 = 4.

**Ruby:**
```ruby
suppliers
  .page([:name, :sid], 3, page_size: 2)
```

**Expected SQLite:**
```sql
... ORDER BY ... LIMIT 2 OFFSET 4
```

---

### page.03 — Restrict + page

**Status:** ported (unblocker C)

**Ruby:**
```ruby
suppliers
  .restrict(:city => 'London')
  .page([:name, :sid], 1, page_size: 2)
```

**Expected SQLite:** WHERE + ORDER BY + LIMIT.

---

### page.04 — Rename + page uses underlying column in ORDER BY

**Status:** ported (unblocker C)

**Warnings:** Page references the renamed attribute `:id`, but the ORDER BY refers to the underlying `t1.sid`. Subtle: bmg-rb resolves aliased names through the rename when emitting ORDER BY.

**Ruby:**
```ruby
suppliers
  .rename(:sid => :id)
  .page([:id, :name], 1, page_size: 2)
```

**Expected SQLite:**
```sql
SELECT `t1`.`sid` AS 'id', `t1`.`name`, `t1`.`city`, `t1`.`status`
FROM `suppliers` AS 't1'
ORDER BY `t1`.`sid` ASC, `t1`.`name` ASC
LIMIT 2
```

---

### page.05 — Summarize + page → CTE wrap

**Status:** ported (unblocker C)

**Warnings:** Summarize precedes page → CTE required.

**Ruby:**
```ruby
supplies
  .summarize([:sid], qty: :max)
  .page([:qty], 1, page_size: 1)
```

**Expected SQLite:**
```sql
WITH `t2` AS (
  SELECT `t1`.`sid`, max(`t1`.`qty`) AS 'qty'
  FROM `supplies` AS 't1' GROUP BY `t1`.`sid`
)
SELECT `t2`.`sid`, `t2`.`qty` FROM `t2` AS 't2'
ORDER BY `t2`.`qty` ASC LIMIT 1
```
