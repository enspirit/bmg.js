# Bmg.js Public API

Public API available via `import { ... } from '@enspirit/bmg-js'`.

## Factory & Constants

| Export | Description |
|--------|-------------|
| `Bmg(tuples)` | Factory to create relations from arrays |
| `Bmg.isRelation(value)` | Type guard for relations |
| `DEE` | Relation with no attributes, one tuple (identity for join) |
| `DUM` | Relation with no attributes, no tuples (identity for union) |
| `LIB_DEFINITIONS` | TypeScript definitions string (for playgrounds) |

## Standalone Functions

| Export | Description |
|--------|-------------|
| `toText(input, options?)` | Render relation/tuple as ASCII table |
| `isRelation(value)` | Type guard for relations |
| `isEqual(left, right)` | Check set equality of two relations |

## Standalone Operators

All operators work on arrays and return arrays:

| Category | Operators |
|----------|-----------|
| **Filtering** | `restrict`, `where`, `exclude` |
| **Projection** | `project`, `allbut` |
| **Extension** | `extend`, `constants` |
| **Renaming** | `rename`, `prefix`, `suffix` |
| **Set ops** | `union`, `minus`, `intersect` |
| **Semi-joins** | `matching`, `not_matching` |
| **Joins** | `join`, `left_join`, `cross_product` |
| **Nesting** | `group`, `ungroup`, `wrap`, `unwrap`, `image`, `summarize`, `autowrap` |
| **Transform** | `transform` |
| **Terminal** | `one`, `yByX` |

## The `Relation<T>` Interface

All operators above are also available as chainable methods on relations:

```typescript
const result = Bmg(suppliers)
  .restrict({ city: 'London' })
  .project(['sid', 'name'])
  .toArray();
```

Additional methods on `Relation<T>`:
- `toArray()` - Get all tuples as array
- `toText(options?)` - ASCII table representation
- `isEqual(other)` - Set equality check
- `cross_join(other)` - Alias for `cross_product`

## Types

**Core:** `Tuple`, `AttrName`, `Relation`, `RelationOperand`

**Predicates:** `Predicate`, `TypedPredicate`

**Extensions:** `Extension`, `TypedExtension`

**Joins:** `JoinKeys`, `TypedJoinKeysArray`, `TypedJoinKeysObject`

**Aggregation:** `Aggregator`, `Aggregators`, `AggregatorName`, `AggregatorSpec`

**Options:** `TextOptions`, `AutowrapOptions`, `PrefixOptions`, `SuffixOptions`, `GroupOptions`

**Utility types:** `Renamed`, `Prefixed`, `Suffixed`, `Joined`, `LeftJoined`, `Wrapped`, `Unwrapped`, `Ungrouped`, `CommonKeys`
