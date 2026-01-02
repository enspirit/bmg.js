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

## Horizon

Let's admit it, the aim is to finally have a language where one can write beautiful
functional expressions like this :

```livescript
{ restrict, rename, one } = require('./bmg-ls.cjs')

suppliers = [
  {sid: 'S1', name: 'Smith', status: 20, city: 'London' },
  {sid: 'S2', name: 'Jones', status: 10, city: 'Paris' },
  {sid: 'S3', name: 'Blake', status: 30, city: 'Paris' },
  {sid: 'S4', name: 'Clark', status: 20, city: 'London' },
  {sid: 'S5', name: 'Adams', status: 30, city: 'Athens' },
]

result = suppliers
  |> restrict  (_) -> _.status > 20
  |> rename    sid: 'id', name: 'lastname'
  |> restrict  city: 'Paris'
  |> one

console.log(result)
# => { id: 'S3', lastname: 'Blake', status: 30, city: 'Paris' }
```

[Livescript](https://livescript.net) allows (see [./livescript](livescript) & [Makefile](Makefile)).

## Available operators

```typescript
// Relational operators
restrict(r: Relation, p: Predicate)                    # Keep only tuples accepted by a predicate
project(r: Relation, attrs: AttrName[])                # Keep only specified attributes
allbut(r: Relation, attrs: AttrName[])                 # Keep all attributes except specified ones
extend(r: Relation, e: Extension)                      # Add computed attributes
union(r: Relation, right: Relation)                    # Set union of two relations
join(r: Relation, right: Relation, keys?: JoinKeys)    # Natural join on common/specified attributes
summarize(r: Relation, by: AttrName[], aggs: Aggregators)  # Group by attributes and aggregate
rename(r: Relation, r: Renaming)                       # Rename some or all attributes

// Non relational operators
isRelation(r: Relation): boolean                       # Returns whether `r` is a Bmg `Relation` instance
one(r: Relation): Tuple                                # Returns the single tuple of `r`, or raises an error (empty or more than one)
yByX(r: Relation: y: AttrName, x: AttrName): Record    # Returns a `{ tuple[y] => tuple[x] }` mapping for each tuple of the operand
```
