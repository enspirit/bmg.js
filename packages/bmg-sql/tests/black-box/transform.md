# transform

- **Source:** [spec/integration/sequel/base/transform.yml](https://github.com/enspirit/bmg/blob/fa8c7e0/spec/integration/sequel/base/transform.yml)
- **Imported SHA:** `fa8c7e0`
- **Total cases:** 4
- **Ported:** 4/4
- **bmg-sql support:** full — `Transformation` now accepts declarative tokens (`'string'`, `'integer'`, `'date'`) alongside JS functions. Token-only transforms push down to `CAST(col AS ...)` / `date(col)` via `processTransform`; transforms containing any JS function fall back to in-memory.
- **Test file:** `transform.test.ts`

**Why all 4 are blocked (shared reason):**

bmg core's `Transformation` type is strictly JS-function-based:

```ts
// packages/bmg/src/types.ts:184-185
export type TransformFunc = (value: unknown) => unknown;
export type Transformation =
  | TransformFunc
  | TransformFunc[]
  | Record<AttrName, TransformFunc | TransformFunc[]>;
```

There is no type-token channel equivalent to bmg-rb's class literals
(`String`, `Integer`, `Date`). A `(value) => String(value)` function
reads the data in memory; it cannot be pushed to SQL as
`CAST(col AS varchar(255))` without a declarative marker the
SQL processor can recognize.

**What unblocking would require (out of scope here):**

1. A typed-token extension to `Transformation` — a declarative marker
   the in-memory impl can also evaluate (so the type change is
   non-breaking). Shape TBD; options include `'string' | 'integer' |
   'date'` string literals, or a structural `{ kind: 'cast', to: ... }`
   object.
2. A `processTransform` in bmg-sql producing `CAST(col AS t)` for
   standard casts and `date(col)` for the SQLite-specific Date case
   (transform.04). Probably needs a dialect hook for the varchar
   spelling (`varchar(255)` vs `text` vs `character varying`).
3. Wiring `SqlRelation.transform()` to the new processor and falling
   back only when functions are present.

All three steps are cross-package; they're a feature, not a fix.
Tests are kept as `it.todo` so the blocker stays visible.

## Cases

### transform.01 — CAST a single attribute to String (varchar)

**Status:** ported

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

**Status:** ported

**Warnings:** Ruby bare `String` (no hash) means "apply to all attrs". bmg-js API TBD — likely `transform('string')` as a shorthand.

**Ruby:**
```ruby
supplies.transform(String)
```

**Expected SQLite:** CAST on every column.

---

### transform.03 — Composed transform (array-of-types pipeline)

**Status:** ported

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

**Status:** ported

**Warnings:** `[String, Date]` → `date(CAST(...))`. Ruby `Date` class token must be mapped. SQLite `date(...)` is a function, not a CAST — the emitter must recognize this special case.

**Ruby:**
```ruby
supplies.transform(:qty => [String, Date])
```

**Expected SQLite:**
```sql
date(CAST(`t1`.`qty` AS varchar(255))) AS 'qty'
```
