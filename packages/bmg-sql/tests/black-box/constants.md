# constants

- **Source:** [spec/integration/sequel/base/constants.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/constants.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 1
- **Ported:** 0/1
- **bmg-sql support:** **fallback only** — `SqlRelation.constants()` falls back to in-memory evaluation. Emitted SQL will not match bmg-rb until push-down is added.

## Cases

### constants.01 — Add two literal columns

**Status:** blocked (SQL push-down not implemented)

**Warnings:** bmg-sql currently evaluates `constants` in memory. To match bmg-rb's output this case needs a push-down: add literal expressions (`'bar' AS 'foo'`, `2 AS 'baz'`) to the SELECT list. Mark `divergent` or `blocked` until processor added.

**Ruby:**
```ruby
suppliers.constants(foo: 'bar', baz: 2)
```

**Expected SQLite:**
```sql
SELECT
  `t1`.`sid`,
  `t1`.`name`,
  `t1`.`city`,
  `t1`.`status`,
  'bar' AS 'foo',
  2 AS 'baz'
FROM `suppliers` AS 't1'
```
