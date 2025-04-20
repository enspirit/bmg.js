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
functional expressions like this:

```livescript
{ Bmg } = require('bmg.js')

suppliers = Bmg([
  {sid: 'S1', name: 'Smith'},
  {sid: 'S2', name: 'Jones'},
])

smith = suppliers
  |> restrict(sid: 'S2')
  |> one

console.log(smith)
```

[Livescript](https://livescript.net) allows.

## Available operators

```typescript
// Relational operators
restrict(r: Relation, p: Predicate)                    # Keep only tuples accepted by a predicate

// Non relational operators
isRelation(r: Relation): boolean                       # Returns whether `r` is a Bmg `Relation` instance
one(r: Relation): Tuple                                # Returns the single tuple of `r`, or raises an error (empty or more than one)
yByX(r: Relation: y: AttrName, x: AttrName): Record    # Returns a `{ tuple[y] => tuple[x] }` mapping for each tuple of the operand
```
