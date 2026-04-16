# rxmatch

- **Source:** [spec/integration/sequel/base/rxmatch.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/rxmatch.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 2
- **Ported:** 0/2
- **bmg-sql support:** **not implemented** — operator does not exist in bmg-js core or bmg-sql. All cases are `blocked` until the operator lands.

## Cases

### rxmatch.01 — Match substring across multiple columns (case-sensitive default)

**Status:** blocked (operator missing)

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

**Status:** blocked

**Warnings:** Adds `UPPER(col) LIKE UPPER('%x%')` wrapping. Option keyword arg `case_sensitive: false`.

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
