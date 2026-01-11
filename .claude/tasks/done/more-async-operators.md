# Async Operators To Add

## Rules

1. Every operator must have unit tests using `isEqual` to compare async result with sync equivalent
2. One commit per operator, include checking boxes here
3. Exception: very similar operators can be committed together:
   - `prefix` & `suffix`
   - `matching` & `not_matching`
   - `wrap` & `unwrap`
   - `group` & `ungroup`
   - `cross_product` & `cross_join` (alias)

## Priority 1: Simple Streaming (one tuple at a time)

These operators process tuples individually without needing to buffer or materialize data.

- [x] `extend` - Add computed fields per tuple
- [x] `constants` - Add constant values per tuple
- [x] `rename` - Transform attribute names
- [x] `prefix` - Prefix attribute names
- [x] `suffix` - Suffix attribute names
- [x] `transform` - Apply functions to values

## Priority 2: Set Operations (need deduplication)

These require streaming both operands and handling duplicates.

- [x] `union` - Combine two relations, deduplicate
- [x] `minus` - Set difference (materialize right)
- [x] `intersect` - Set intersection (materialize right)

## Priority 3: Semi-Joins (materialize right side)

Filter left based on presence/absence in right.

- [x] `matching` - Keep left tuples that match right
- [x] `not_matching` - Keep left tuples that don't match right

## Priority 4: Joins (materialize right side)

Combine tuples from two relations.

- [x] `join` - Natural/keyed join
- [x] `left_join` - Left outer join (includes non-matching left tuples)
- [x] `cross_product` / `cross_join` - Cartesian product

## Priority 5: Nesting/Aggregation (complex grouping)

These involve creating or flattening nested structures.

- [x] `group` - Group attributes into nested relations
- [x] `ungroup` - Flatten nested relations
- [x] `wrap` - Wrap attributes into nested object
- [x] `unwrap` - Unwrap nested object into attributes
- [x] `image` - Add nested relation of matching right tuples
- [x] `summarize` - Aggregation with grouping

## Priority 6: Utility

- [x] `autowrap` - Dynamic structure based on attribute naming
- [x] `yByX` - Build key-value map from two attributes
- [x] `isEqual` - Compare two async relations for equality
