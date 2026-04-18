# base

- **Source:** [spec/integration/sequel/base/base.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/base.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 2
- **Ported:** 2/2 (unblocker D)
- **Test file:** `base.test.ts`
- **bmg-sql support:** full — baseline `.toSql()` with no operators applied

## Cases

### base.01 — Plain table relation

**Status:** ported (as `base.test.ts > base.01`)

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

**Status:** ported (unblocker D)

**Note:** `BmgSql.fromSubquery(adapter, sql, attrs, { params? })`
factory added. Builds a `SelectExpr` whose FROM is a new
`RawSubqueryRef` AST node carrying the opaque SQL and bind params.
bmg-rb aliases every projected column (`AS 'sid'`, etc.); bmg-sql
elides the AS clause when alias == column name (same precedent as
restrict.01). Same query shape.

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
