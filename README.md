# Bmg.js - Relational Algebra for JavaScript/TypeScript

A TypeScript/JavaScript implementation of [BMG](https://www.relational-algebra.dev/), providing relational algebra operators for in-memory arrays and SQL databases.

## Packages

This is a monorepo with the following packages:

| Package | Description |
|---------|-------------|
| [`@enspirit/bmg-js`](./packages/bmg) | Core relational algebra for in-memory arrays |
| [`@enspirit/predicate`](./packages/predicate) | Boolean predicate algebra with AST, evaluation, and SQL compilation |
| [`@enspirit/bmg-sql`](./packages/bmg-sql) | SQL AST, compiler, processors, and `SqlRelation` |
| [`@enspirit/bmg-pg`](./packages/bmg-pg) | PostgreSQL adapter for `bmg-sql` |

## Quick Start (in-memory)

```bash
npm install @enspirit/bmg-js
```

```typescript
import { Bmg } from '@enspirit/bmg-js'

const suppliers = Bmg([
  { sid: 'S1', name: 'Smith', status: 20, city: 'London' },
  { sid: 'S2', name: 'Jones', status: 10, city: 'Paris' },
  { sid: 'S3', name: 'Blake', status: 30, city: 'Paris' },
  { sid: 'S4', name: 'Clark', status: 20, city: 'London' },
  { sid: 'S5', name: 'Adams', status: 30, city: 'Athens' },
])

const parisSuppliers = suppliers
  .restrict({ city: 'Paris' })
  .project(['sid', 'name'])

console.log(parisSuppliers.toArray())
// [{ sid: 'S2', name: 'Jones' }, { sid: 'S3', name: 'Blake' }]

console.log(parisSuppliers.toText())
// +-----+-------+
// | sid | name  |
// +-----+-------+
// | S2  | Jones |
// | S3  | Blake |
// +-----+-------+
```

## Quick Start (PostgreSQL)

```bash
npm install @enspirit/bmg-pg @enspirit/predicate pg
```

```typescript
import { Pool } from 'pg'
import { PostgresAdapter, BmgSql } from '@enspirit/bmg-pg'
import { Pred } from '@enspirit/predicate'

// Connect to your database
const pool = new Pool({ connectionString: 'postgresql://user:pass@localhost/mydb' })
const adapter = new PostgresAdapter({ pool })

// Create a SQL-backed relation (lazy — no query yet)
const suppliers = BmgSql(adapter, 'suppliers', ['sid', 'name', 'status', 'city'], {
  keys: [['sid']],  // declare the primary key for DISTINCT optimization
})

// Chain operations — builds a SQL AST, nothing hits the DB
const london = suppliers
  .restrict(Pred.eq('city', 'London'))
  .project(['sid', 'name'])

// Inspect the generated SQL without executing
console.log(london.toSql())
// {
//   sql: 'SELECT "t1"."sid", "t1"."name" FROM "suppliers" "t1" WHERE "t1"."city" = $1',
//   params: ['London']
// }

// Execute against the database
const rows = await london.toArray()
// [{ sid: 'S1', name: 'Smith' }, { sid: 'S4', name: 'Clark' }]

// Stream large results via cursor
for await (const row of suppliers) {
  console.log(row)
}

// Clean up
await adapter.close()
```

### Structured predicates

The `@enspirit/predicate` package provides a typed predicate AST that compiles to SQL:

```typescript
import { Pred } from '@enspirit/predicate'

// Simple comparisons
suppliers.restrict(Pred.eq('city', 'London'))
suppliers.restrict(Pred.gt('status', 20))

// Compound predicates
suppliers.restrict(
  Pred.and(Pred.gte('status', 20), Pred.neq('city', 'Athens'))
)

// Set membership
suppliers.restrict(Pred.in('city', ['London', 'Paris']))

// Plain objects still work (converted to eq predicates automatically)
suppliers.restrict({ city: 'London' })

// JS functions work too (triggers fallback to in-memory evaluation)
suppliers.restrict(t => t.status > 20)
```

### SQL push-down and transparent fallback

`SqlRelation` pushes as many operations as possible to the database. When an operation can't be compiled to SQL (e.g., a JS function predicate, or structural operations like `group`/`wrap`), it materializes the current query and continues in-memory transparently:

```typescript
// All pushed to SQL — single query to the DB
const result = await suppliers
  .restrict(Pred.eq('city', 'London'))  // → SQL WHERE
  .project(['sid', 'name'])             // → SQL SELECT
  .rename({ name: 'sname' })            // → SQL AS
  .toArray()

// Mixed: SQL push-down + in-memory fallback
const result = await suppliers
  .restrict(Pred.gt('status', 10))      // → SQL WHERE
  .restrict(t => customLogic(t))        // → materializes, continues in-memory
  .project(['sid', 'name'])             // → in-memory project
  .toArray()
```

**Operations pushed to SQL:**
restrict, where, exclude, project, allbut, rename, extend (attr refs), constants, union, minus, intersect, join, left_join, summarize (built-in aggregators), matching, not_matching

**Operations that fall back to in-memory:**
prefix, suffix, transform, group, ungroup, wrap, unwrap, image, autowrap, cross_product, function predicates

### Joins and set operations

Binary operations (join, union, etc.) check whether both operands target the same database. If so, they merge into a single SQL query. Otherwise, both sides are materialized and the operation runs in-memory:

```typescript
const suppliers = BmgSql(adapter, 'suppliers', ['sid', 'name', 'city'])
const shipments = BmgSql(adapter, 'shipments', ['sid', 'pid', 'qty'])

// Same adapter → single SQL query with JOIN
const joined = await suppliers.join(shipments, ['sid']).toArray()

// Suppliers who have at least one shipment (EXISTS subquery)
const active = await suppliers.matching(shipments, ['sid']).toArray()

// Suppliers with no shipments (NOT EXISTS subquery)
const idle = await suppliers.not_matching(shipments, ['sid']).toArray()

// Set operations on same adapter → UNION/EXCEPT/INTERSECT in SQL
const london = suppliers.restrict(Pred.eq('city', 'London'))
const paris = suppliers.restrict(Pred.eq('city', 'Paris'))
const both = await london.union(paris).toArray()
```

### Aggregation

```typescript
// GROUP BY + aggregates → pushed to SQL
const stats = await suppliers
  .summarize(['city'], {
    cnt: { op: 'count', attr: 'sid' },
    avg_status: { op: 'avg', attr: 'status' },
  })
  .toArray()
// [{ city: 'London', cnt: 2, avg_status: 20 }, ...]
```

## Available Operators

| Category | Operator | Description |
|----------|----------|-------------|
| **Filtering** | `restrict(predicate)` | Keep tuples matching predicate |
| | `where(predicate)` | Alias for restrict |
| | `exclude(predicate)` | Keep tuples NOT matching predicate |
| | `matching(other, keys?)` | Semi-join (tuples with match in other) |
| | `not_matching(other, keys?)` | Anti-join (tuples without match) |
| **Projection** | `project(attrs)` | Keep only specified attributes |
| | `allbut(attrs)` | Keep all attributes except specified |
| **Extension** | `extend(extensions)` | Add computed attributes |
| | `constants(values)` | Add constant attributes |
| **Renaming** | `rename(mapping)` | Rename attributes |
| | `prefix(pfx, options?)` | Add prefix to attribute names |
| | `suffix(sfx, options?)` | Add suffix to attribute names |
| **Set Operations** | `union(other)` | Set union of two relations |
| | `minus(other)` | Set difference (tuples in left but not right) |
| | `intersect(other)` | Set intersection (tuples in both) |
| **Join Operations** | `join(other, keys?)` | Natural join on common/specified attributes |
| | `left_join(other, keys?)` | Left outer join |
| | `cross_product(other)` | Cartesian product |
| | `cross_join(other)` | Alias for cross_product |
| **Nesting & Grouping** | `image(other, as, keys?)` | Nest matching tuples as relation attribute |
| | `group(attrs, as, options?)` | Group attributes into nested relation |
| | `ungroup(attr)` | Flatten nested relation |
| | `wrap(attrs, as)` | Wrap attributes into tuple-valued attribute |
| | `unwrap(attr)` | Flatten tuple-valued attribute |
| | `autowrap(options?)` | Auto-wrap by separator pattern |
| **Aggregation** | `summarize(by, aggregators)` | Group and aggregate |
| **Transformation** | `transform(transformation)` | Transform attribute values |
| **Non-Relational** | `one()` | Extract single tuple (throws if not exactly one) |
| | `toArray()` | Convert relation to array |
| | `isEqual(other)` | Check set equality |
| | `yByX(y, x)` | Create `{ x-value: y-value }` mapping |
| | `toText(options?)` | Render as ASCII table |

Built-in aggregators for `summarize`: `count`, `sum`, `min`, `max`, `avg`, `collect`

## TypeScript Support

All packages provide full TypeScript support with generic types:

```typescript
interface Supplier {
  sid: string
  name: string
  status: number
  city: string
}

const suppliers = Bmg<Supplier>([...])

// Type-safe operations with autocomplete
const projected = suppliers.project(['sid', 'name'])
// Type: Relation<{ sid: string; name: string }>

const one = suppliers.restrict({ sid: 'S1' }).one()
// Type: Supplier
```

## Development

```bash
# Install dependencies
pnpm install

# Run unit tests (all packages)
pnpm test

# Run integration tests (requires Docker)
docker compose up -d
pnpm test:integration
docker compose down

# Build all packages
pnpm build
```

## Theory

Bmg.js implements relational algebra with these principles:

1. **No duplicates** - Relations are sets; duplicate tuples are automatically removed
2. **Order independence** - Tuple order and attribute order have no semantic meaning
3. **Set equality** - Two relations are equal if they contain the same tuples

## Horizon

The aim is to have a language where one can write beautiful functional expressions:

```
suppliers
  |> restrict( _ ~> _.status > 20 )
  |> rename(sid: 'id', name: 'lastname')
  |> restrict(city: 'Paris')
  |> one
```

This will be provided by [Elo](https://elo-lang.org).

## License

MIT
