# constants

- **Source:** [spec/integration/sequel/base/constants.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/constants.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 1
- **Ported:** 1/1
- **bmg-sql support:** full — `processConstants` appends literal `? AS 'col'` items to the select list. Literals are parameterized (same as `extend` / `restrict`), unlike bmg-rb's inlined form — semantically equivalent.
- **Test file:** `constants.test.ts`

## Cases

### constants.01 — Add two literal columns

**Status:** ported

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
