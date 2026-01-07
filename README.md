# Bmg.js - Relational Algebra for JavaScript/TypeScript

A TypeScript/JavaScript implementation of [BMG](https://www.relational-algebra.dev/), providing relational algebra operators for working with arrays of objects.

## Installation

```bash
npm install bmg.js
```

## Quick Start

Using the Relation abstraction:

```typescript
import { Bmg } from 'bmg.js'

const suppliers = Bmg([
  { sid: 'S1', name: 'Smith', status: 20, city: 'London' },
  { sid: 'S2', name: 'Jones', status: 10, city: 'Paris' },
  { sid: 'S3', name: 'Blake', status: 30, city: 'Paris' },
])

// Chain operations fluently
const parisSuppliers = suppliers
  .restrict({ city: 'Paris' })
  .project(['sid', 'name'])

console.log(parisSuppliers.toArray())
// => [{ sid: 'S2', name: 'Jones' }, { sid: 'S3', name: 'Blake' }]

// Extract a single tuple
const smith = suppliers.restrict({ sid: 'S1' }).one()
// => { sid: 'S1', name: 'Smith', status: 20, city: 'London' }
```

Using standalone operators on plain arrays:

```typescript
import { restrict, project } from 'bmg.js'

const suppliers = [
  { sid: 'S1', name: 'Smith', city: 'London' },
  { sid: 'S2', name: 'Jones', city: 'Paris' },
]

const result = project(restrict(suppliers, { city: 'Paris' }), ['name'])
// => [{ name: 'Jones' }]
```

## TypeScript Support

Bmg.js provides full TypeScript support with generic types:

```typescript
import { Bmg } from 'bmg.js'

interface Supplier {
  sid: string
  name: string
  status: number
  city: string
}

const suppliers = Bmg<Supplier>([
  { sid: 'S1', name: 'Smith', status: 20, city: 'London' },
])

// Type-safe operations with autocomplete
const projected = suppliers.project(['sid', 'name'])
// Type: Relation<{ sid: string; name: string }>

const one = suppliers.restrict({ sid: 'S1' }).one()
// Type: Supplier
```

See the [full type-safe example](./example/index.ts) for more.

## Available Operators

### Filtering

| Operator | Description |
|----------|-------------|
| `restrict(predicate)` | Keep tuples matching predicate |
| `where(predicate)` | Alias for restrict |
| `exclude(predicate)` | Keep tuples NOT matching predicate |

### Projection

| Operator | Description |
|----------|-------------|
| `project(attrs)` | Keep only specified attributes |
| `allbut(attrs)` | Keep all attributes except specified |

### Extension

| Operator | Description |
|----------|-------------|
| `extend(extensions)` | Add computed attributes |
| `constants(values)` | Add constant attributes |

### Renaming

| Operator | Description |
|----------|-------------|
| `rename(mapping)` | Rename attributes |
| `prefix(pfx, options?)` | Add prefix to attribute names |
| `suffix(sfx, options?)` | Add suffix to attribute names |

### Set Operations

| Operator | Description |
|----------|-------------|
| `union(other)` | Set union of two relations |
| `minus(other)` | Set difference (tuples in left but not right) |
| `intersect(other)` | Set intersection (tuples in both) |

### Join Operations

| Operator | Description |
|----------|-------------|
| `join(other, keys?)` | Natural join on common/specified attributes |
| `left_join(other, keys?)` | Left outer join |
| `cross_product(other)` | Cartesian product |
| `cross_join(other)` | Alias for cross_product |
| `matching(other, keys?)` | Semi-join (tuples with match in other) |
| `not_matching(other, keys?)` | Anti-join (tuples without match) |

### Nesting & Grouping

| Operator | Description |
|----------|-------------|
| `image(other, as, keys?)` | Nest matching tuples as relation attribute |
| `group(attrs, as)` | Group attributes into nested relation |
| `ungroup(attr)` | Flatten nested relation |
| `wrap(attrs, as)` | Wrap attributes into tuple-valued attribute |
| `unwrap(attr)` | Flatten tuple-valued attribute |
| `autowrap(options?)` | Auto-wrap by separator pattern |

### Aggregation

| Operator | Description |
|----------|-------------|
| `summarize(by, aggregators)` | Group and aggregate |

Built-in aggregators: `count`, `sum`, `min`, `max`, `avg`, `collect`

### Transformation

| Operator | Description |
|----------|-------------|
| `transform(transformation)` | Transform attribute values |

### Non-Relational

| Operator | Description |
|----------|-------------|
| `one()` | Extract single tuple (throws if not exactly one) |
| `toArray()` | Convert relation to array |
| `isEqual(other)` | Check set equality |
| `yByX(y, x)` | Create `{ x-value: y-value }` mapping |

Static method:

| Method | Description |
|--------|-------------|
| `Bmg.isRelation(value)` | Check if value is a Relation |

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
