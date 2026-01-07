# Bmg.js - Relational Algebra for Modern Times

A Typescript/Javascript implementation of [BMG](https://www.relational-algebra.dev/)

## Work in progress

This library is not ready yet. The current aim is NOT to reimplement SQL compilation
from algebra expression, but to provide BMG operators and the Relation abstraction
for Typescript/Javascript developers.

## Examples

Using the Relation abstraction :

```typescript
import { Bmg } from 'bmg.js'

const suppliers = Bmg([ {sid: 'S1', name: 'Smith'} ])
const smith = suppliers.restrict({sid: 'S1'}).one()
```

Simply reusing the algebra operators on your own arrays :

```typescript
import { restrict } from 'bmg.js'

const suppliers = [ {sid: 'S1', name: 'Smith'} ]
const smith = restrict(suppliers, {sid: 'S1'})[0]
```

Check [a full type-safe example here](./example/index.ts)

## Horizon

Let's admit it, the aim is to finally have a language where one can write beautiful
functional expressions like this :

```lifescript
suppliers = [
  {sid: 'S1', name: 'Smith', status: 20, city: 'London' },
  {sid: 'S2', name: 'Jones', status: 10, city: 'Paris' },
  {sid: 'S3', name: 'Blake', status: 30, city: 'Paris' },
  {sid: 'S4', name: 'Clark', status: 20, city: 'London' },
  {sid: 'S5', name: 'Adams', status: 30, city: 'Athens' },
]

result = suppliers
  |> restrict( _ ~> _.status > 20 )
  |> rename(sid: 'id', name: 'lastname')
  |> restrict(city: 'Paris')
  |> one

console.log(result)
# => { id: 'S3', lastname: 'Blake', status: 30, city: 'Paris' }
```

This will most probably be provided by [Elo](https://elo-lang.org)

## Available operators

```typescript
// Relational operators
restrict(r: Relation, p: Predicate)                    # Keep only tuples accepted by a predicate
where(r: Relation, p: Predicate)                       # Alias for restrict
exclude(r: Relation, p: Predicate)                     # Keep tuples NOT matching predicate
project(r: Relation, attrs: AttrName[])                # Keep only specified attributes
allbut(r: Relation, attrs: AttrName[])                 # Keep all attributes except specified ones
extend(r: Relation, e: Extension)                      # Add computed attributes
union(r: Relation, right: Relation)                    # Set union of two relations
minus(r: Relation, right: Relation)                    # Set difference (tuples in r but not in right)
intersect(r: Relation, right: Relation)                # Set intersection (tuples in both)
matching(r: Relation, right: Relation, keys?: JoinKeys)     # Semi-join (tuples with a match in right)
not_matching(r: Relation, right: Relation, keys?: JoinKeys) # Anti-join (tuples without a match in right)
join(r: Relation, right: Relation, keys?: JoinKeys)    # Natural join on common/specified attributes
left_join(r: Relation, right: Relation, keys?: JoinKeys)   # Left outer join
cross_product(r: Relation, right: Relation)            # Cartesian product of two relations
cross_join(r: Relation, right: Relation)               # Alias for cross_product
image(r: Relation, right: Relation, as: AttrName, keys?: JoinKeys)  # Relational image (nested matching tuples)
summarize(r: Relation, by: AttrName[], aggs: Aggregators)  # Group by attributes and aggregate
group(r: Relation, attrs: AttrName[], as: AttrName)    # Group attributes into nested relation
ungroup(r: Relation, attr: AttrName)                   # Flatten nested relation back to tuples
wrap(r: Relation, attrs: AttrName[], as: AttrName)     # Wrap attributes into tuple-valued attribute
unwrap(r: Relation, attr: AttrName)                    # Flatten tuple-valued attribute back to attributes
autowrap(r: Relation, options?)                        # Auto-wrap attributes by separator pattern
rename(r: Relation, r: Renaming)                       # Rename some or all attributes
prefix(r: Relation, pfx: string, options?)             # Add prefix to all attribute names
suffix(r: Relation, sfx: string, options?)             # Add suffix to all attribute names
constants(r: Relation, consts: Tuple)                  # Add constant attributes to all tuples
transform(r: Relation, t: Transformation)              # Transform attribute values using functions

// Non relational operators
isRelation(r: Relation): boolean                       # Returns whether `r` is a Bmg `Relation` instance
isEqual(r: Relation, s: Relation): boolean             # Returns whether two relations are equal (set equality)
one(r: Relation): Tuple                                # Returns the single tuple of `r`, or raises an error (empty or more than one)
yByX(r: Relation: y: AttrName, x: AttrName): Record    # Returns a `{ tuple[y] => tuple[x] }` mapping for each tuple of the operand
```
