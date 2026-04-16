# prefix

- **Source:** [spec/integration/sequel/base/prefix.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/prefix.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 1
- **Ported:** 0/1
- **bmg-sql support:** **fallback only** — `SqlRelation.prefix()` falls back to in-memory. SQL output will not match bmg-rb until push-down is added.

## Cases

### prefix.01 — Prefix all attribute names with `supplier_`

**Status:** blocked (SQL push-down not implemented)

**Warnings:** bmg-rb compiles this to a SELECT with `AS 'supplier_<attr>'` on every column. bmg-sql currently drops to the in-memory fallback path. Push-down is a thin layer over `rename` — add during port or mark `divergent`.

**Ruby:**
```ruby
suppliers.prefix(:supplier_)
```

**Expected SQLite:**
```sql
SELECT
  `t1`.`sid` AS 'supplier_sid',
  `t1`.`name` AS 'supplier_name',
  `t1`.`city` AS 'supplier_city',
  `t1`.`status` AS 'supplier_status'
FROM `suppliers` AS 't1'
```
