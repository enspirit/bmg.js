# suffix

- **Source:** [spec/integration/sequel/base/suffix.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/suffix.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 1
- **Ported:** 0/1
- **bmg-sql support:** **fallback only** — same situation as prefix.

## Cases

### suffix.01 — Suffix all attribute names with `_supplier`

**Status:** blocked (SQL push-down not implemented)

**Warnings:** See prefix.md. Same fallback story; same push-down fix (thin layer over rename).

**Ruby:**
```ruby
suppliers.suffix(:_supplier)
```

**Expected SQLite:**
```sql
SELECT
  `t1`.`sid` AS 'sid_supplier',
  `t1`.`name` AS 'name_supplier',
  `t1`.`city` AS 'city_supplier',
  `t1`.`status` AS 'status_supplier'
FROM `suppliers` AS 't1'
```
