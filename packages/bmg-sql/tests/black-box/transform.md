# transform

- **Source:** [spec/integration/sequel/base/transform.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/transform.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 4
- **Ported:** 0/4
- **bmg-sql support:** unknown — `transform` exists in `SqlRelation` and calls `.fallback()`/push-down path; CAST emission specifically may be partial. Verify during port.

## Cases

### transform.01 — CAST a single attribute to String (varchar)

**Status:** todo

**Warnings:** Ruby class literal `String` is used as a type token. bmg-js must map a string token like `'string'` (or a TS type marker) to `CAST(col AS varchar(255))`. Decide the token mapping during port.

**Ruby:**
```ruby
supplies.transform(:qty => String)
```

**Expected SQLite:**
```sql
SELECT `t1`.`sid`, `t1`.`pid`,
       CAST(`t1`.`qty` AS varchar(255)) AS 'qty'
FROM `supplies` AS 't1'
```

---

### transform.02 — Transform-all-columns form (single type applied to every attr)

**Status:** todo

**Warnings:** Ruby bare `String` (no hash) means "apply to all attrs". bmg-js API TBD — likely `transform('string')` as a shorthand.

**Ruby:**
```ruby
supplies.transform(String)
```

**Expected SQLite:** CAST on every column.

---

### transform.03 — Composed transform (array-of-types pipeline)

**Status:** todo

**Warnings:** Ruby `[String, Integer]` means "cast to varchar, then to integer" (left-to-right pipe). Requires bmg-js to support a composed transform chain and emit nested CASTs.

**Ruby:**
```ruby
supplies.transform(:qty => [String, Integer])
```

**Expected SQLite:**
```sql
CAST(CAST(`t1`.`qty` AS varchar(255)) AS integer) AS 'qty'
```

---

### transform.04 — Composed transform with Date

**Status:** todo

**Warnings:** `[String, Date]` → `date(CAST(...))`. Ruby `Date` class token must be mapped. SQLite `date(...)` is a function, not a CAST — the emitter must recognize this special case.

**Ruby:**
```ruby
supplies.transform(:qty => [String, Date])
```

**Expected SQLite:**
```sql
date(CAST(`t1`.`qty` AS varchar(255))) AS 'qty'
```
