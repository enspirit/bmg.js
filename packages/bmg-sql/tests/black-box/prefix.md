# prefix

- **Source:** [spec/integration/sequel/base/prefix.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/prefix.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 1
- **Ported:** 1/1
- **bmg-sql support:** full — `SqlRelation.prefix()` delegates to `.rename()` with a generated renaming map when the relType is known.
- **Test file:** `prefix.test.ts`

## Cases

### prefix.01 — Prefix all attribute names with `supplier_`

**Status:** ported

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
