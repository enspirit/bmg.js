# project

- **Source:** [spec/integration/sequel/base/project.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/project.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 3
- **Ported:** 0/3
- **bmg-sql support:** full — pushed down via `processProject`, DISTINCT-aware via `RelationType`

## Cases

### project.01 — Project key → no DISTINCT

**Status:** todo

**Warnings:** Relies on `keys: [['sid']]` being set on `suppliers`. Key is preserved by the projection, so no DISTINCT needed.

**Ruby:**
```ruby
suppliers.project([:sid, :name])
```

**Expected SQLite:**
```sql
SELECT `t1`.`sid`, `t1`.`name`
FROM `suppliers` AS 't1'
```

---

### project.02 — Project non-key → DISTINCT

**Status:** todo

**Warnings:** Key dropped from projection → DISTINCT required to preserve set semantics.

**Ruby:**
```ruby
suppliers.project([:name])
```

**Expected SQLite:**
```sql
SELECT DISTINCT `t1`.`name`
FROM `suppliers` AS 't1'
```

---

### project.03 — allbut then project → DISTINCT propagates through

**Status:** todo

**Ruby:**
```ruby
suppliers.allbut([:sid, :status]).project([:name])
```

**Expected SQLite:**
```sql
SELECT DISTINCT `t1`.`name`
FROM `suppliers` AS 't1'
```
