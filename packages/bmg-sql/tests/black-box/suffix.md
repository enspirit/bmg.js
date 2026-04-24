# suffix

- **Source:** [spec/integration/sequel/base/suffix.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/suffix.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 1
- **Ported:** 1/1
- **bmg-sql support:** full — same implementation as prefix.
- **Test file:** `suffix.test.ts`

## Cases

### suffix.01 — Suffix all attribute names with `_supplier`

**Status:** ported

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
