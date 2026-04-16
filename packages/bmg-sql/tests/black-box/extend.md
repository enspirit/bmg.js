# extend

- **Source:** [spec/integration/sequel/base/extend.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/extend.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 1
- **Ported:** 0/1
- **bmg-sql support:** full — pushed down via `processExtend`

## Cases

### extend.01 — Add a column aliasing an existing attribute

**Status:** todo

**Warnings:** Ruby `:supplier_id => :sid` means "bind new attribute `supplier_id` to the value of `sid`" — a column-to-column alias, not a computation. The bmg-js `extend` API takes `{ newAttr: (tuple) => expr }` for in-memory; for SQL push-down the equivalent must accept a symbolic column reference (e.g. `extend({ supplier_id: col('sid') })`). Verify bmg-sql's extend signature during port.

**Ruby:**
```ruby
supplies.extend(:supplier_id => :sid)
```

**Expected SQLite:**
```sql
SELECT
  `t1`.`sid`,
  `t1`.`pid`,
  `t1`.`qty`,
  `t1`.`sid` AS 'supplier_id'
FROM `supplies` AS 't1'
```
