# Bmg.js - Relational Algebra for Modern Times

A Typescript/Javascript implementation of [BMG](https://www.relational-algebra.dev/)

## Work in progress

This library is not ready yet. The current aim is NOT to reimplement SQL compilation
from algebra expression, but to provide BMG operators and the Relation abstraction
for Typescript/Javascript developers.

## Examples

Using the Relation abstraction :

```
import { Bmg } from 'bmg.js'

const suppliers = Bmg([ {sid: 'S1', name: 'Smith'} ])
const smith = suppliers.restrict({sid: 'S1'}).one()
```

Simply reusing the algebra operators on your own arrays :

```
import { restrict } from 'bmg.js'

const suppliers = [ {sid: 'S1', name: 'Smith'} ]
const smith = restrict(suppliers, {sid: 'S1'})[0]
```

## Horizon

Let's admit it, the aim is to finally have a language where one can write beautiful
functional expressions like this:

```
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

[Lifescript](https://livescript.net) allows.
