# extend

- **Source:** [spec/integration/sequel/base/extend.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/extend.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 1
- **Ported:** 1/1
- **bmg-sql support:** full — pushed down via `processExtend`
- **Test file:** `extend.test.ts`

## Cases

### extend.01 — Add a column aliasing an existing attribute

**Status:** ported (as `extend.test.ts > extend.01`)

**Port notes:** bmg-sql's `extend()` accepts `string` values as column references (pushed down to SQL) or functions (fall back to in-memory). The `:supplier_id => :sid` form maps to `{ supplier_id: 'sid' as const }`.

**Warnings:**
- **Type quirk.** With the string-reference form, TypeScript infers the new attribute's value type as the string literal `'sid'` (e.g. `{ supplier_id: 'sid' }`) rather than the underlying column's value type (`string`). Runtime is correct; only the static type is imprecise. This is documented by the `expectTypeOf` assertion in the test — if typing is improved later, this test will signal the update needed.

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
