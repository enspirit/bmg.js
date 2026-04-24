# rxmatch

- **Source:** [spec/integration/sequel/base/rxmatch.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/rxmatch.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 2
- **Ported:** 2/2
- **bmg-sql support:** full — `Relation.rxmatch(attrs, pattern, {caseSensitive?})` lands in core + bmg-sql, compiling to a disjunction of `LIKE ... ESCAPE '\'` (plus `UPPER(...)` wrapping when case-insensitive).
- **Test file:** `rxmatch.test.ts`

## Cases

### rxmatch.01 — Match substring across multiple columns (case-sensitive default)

**Status:** ported

**Warnings:** `rxmatch([:city, :name], "S")` compiles to a disjunction of `LIKE '%S%' ESCAPE '\'` predicates, one per listed column. Needs core operator + bmg-sql push-down. Consider whether this is truly "regex match" (name suggests so) or just substring match — bmg-rb implements it as `LIKE`, not true regex.

**Ruby:**
```ruby
suppliers
  .rxmatch([:city, :name], "S")
```

**Expected SQLite:**
```sql
SELECT ... FROM `suppliers` AS 't1'
WHERE (
  (`t1`.`city` LIKE '%S%' ESCAPE '\')
  OR
  (`t1`.`name` LIKE '%S%' ESCAPE '\')
)
```

---

### rxmatch.02 — Case-insensitive match via `case_sensitive: false`

**Status:** ported — bmg-js uses `{ caseSensitive: false }` (camelCase) rather than the Ruby snake_case option.

**Ruby:**
```ruby
suppliers
  .rxmatch([:city, :name], "S", case_sensitive: false)
```

**Expected SQLite:**
```sql
WHERE (
  (UPPER(`t1`.`city`) LIKE UPPER('%S%') ESCAPE '\')
  OR
  (UPPER(`t1`.`name`) LIKE UPPER('%S%') ESCAPE '\')
)
```
