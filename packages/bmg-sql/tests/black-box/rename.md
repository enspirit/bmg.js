# rename

- **Source:** [spec/integration/sequel/base/rename.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/rename.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 4
- **Ported:** 4/4
- **bmg-sql support:** full — pushed down via `processRename`
- **Test file:** `rename.test.ts`
- **Port notes:** bmg-sql parameterizes restrict literals (`?` placeholder + params). Semantically identical to bmg-rb's inline literals; tests assert both `sql` and `params`.

## Cases

### rename.01 — Rename a single attribute

**Status:** ported

**Ruby:**
```ruby
suppliers
  .rename(:name => :firstname)
```

**Expected SQLite:**
```sql
SELECT `t1`.`sid`, `t1`.`name` AS 'firstname', `t1`.`city`, `t1`.`status`
FROM `suppliers` AS 't1'
```

---

### rename.02 — Rename after project (DISTINCT preserved)

**Status:** ported

**Ruby:**
```ruby
suppliers
  .project([:name])
  .rename(:name => :firstname)
```

**Expected SQLite:**
```sql
SELECT DISTINCT `t1`.`name` AS 'firstname'
FROM `suppliers` AS 't1'
```

---

### rename.03 — restrict then rename (predicate on original name)

**Status:** ported

**Warnings:** Restrict uses original column name `name`; rename aliases after restrict.

**Ruby:**
```ruby
suppliers
  .restrict(:name => 'Smith')
  .rename(:name => :firstname)
```

**Expected SQLite:**
```sql
SELECT `t1`.`sid`, `t1`.`name` AS 'firstname', `t1`.`city`, `t1`.`status`
FROM `suppliers` AS 't1'
WHERE (`t1`.`name` = 'Smith')
```

---

### rename.04 — Duplicate of rename.03 in upstream YAML

**Status:** ported

**Warnings:** bmg-rb YAML contains two identical cases. Port both (or dedupe and note it) — probably a copy-paste leftover upstream. Worth opening an issue upstream during the port.

**Ruby:**
```ruby
suppliers
  .restrict(:name => 'Smith')
  .rename(:name => :firstname)
```

**Expected SQLite:** _(same as rename.03)_
