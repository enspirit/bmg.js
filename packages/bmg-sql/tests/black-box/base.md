# base

- **Source:** [spec/integration/sequel/base/base.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/base.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 2
- **Ported:** 0/2
- **bmg-sql support:** full — baseline `.toSql()` with no operators applied

## Cases

### base.01 — Plain table relation

**Status:** todo

**Ruby:**
```ruby
suppliers
```

**Expected SQLite:**
```sql
SELECT `t1`.`sid`, `t1`.`name`, `t1`.`city`, `t1`.`status`
FROM `suppliers` AS 't1'
```

---

### base.02 — Relation over an underlying dataset/subquery

**Status:** todo

**Warnings:** `suppliers_dataset` in bmg-rb is a pre-built Sequel dataset (subquery). bmg-js equivalent is a relation built from a SQL fragment / subquery source. Decide during port whether `bmg-sql` exposes this API (likely via a `sql()` or `subquery()` factory). May be `blocked` until that factory exists. Columns are aliased (`AS 'sid'`, etc.) because the subquery is opaque.

**Ruby:**
```ruby
suppliers_dataset
```

**Expected SQLite:**
```sql
SELECT
  `t1`.`sid` AS 'sid',
  `t1`.`name` AS 'name',
  `t1`.`city` AS 'city',
  `t1`.`status` AS 'status'
FROM (
  SELECT * FROM `suppliers`
) AS 't1'
```
