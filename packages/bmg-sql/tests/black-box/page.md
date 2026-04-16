# page

- **Source:** [spec/integration/sequel/base/page.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/page.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 5
- **Ported:** 0/5
- **bmg-sql support:** **missing surface** — `processOrderBy` and `processLimitOffset` exist in `processors.ts`, but `SqlRelation.page()` (and `Relation.page()` in core) is not exposed. All cases are `blocked` on surfacing the operator.

## Cases

### page.01 — First page, asc order by two attrs

**Status:** blocked (operator not exposed)

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

**Status:** blocked

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

**Status:** blocked

**Ruby:**
```ruby
suppliers
  .restrict(:city => 'London')
  .page([:name, :sid], 1, page_size: 2)
```

**Expected SQLite:** WHERE + ORDER BY + LIMIT.

---

### page.04 — Rename + page uses underlying column in ORDER BY

**Status:** blocked

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

**Status:** blocked

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
