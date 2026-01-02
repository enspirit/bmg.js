# What is Bmg.js ?

A Typescript implementation of BMG, a relational algebra originally implemented
in/for Ruby :

- https://github.com/enspirit/bmg
- https://www.relational-algebra.dev/

The aim of bmg.js is NOT to implement the SQL compiler, but only to provide an
implementation of main algebra operators to work on arrays of javascript objects.

## Development flow

* List operators to support, by order of importance
* Add each operator, in order, with unit tests.
* One commit per operator, don't forget to adapt the README.
* Tests MUST succeed at all times, run them with `npm run test`

## Implemented operators

**Relational:** restrict, project, allbut, extend, rename, union, minus, intersect, matching, not_matching, join, left_join, image, summarize, group, ungroup, wrap, unwrap

**Non-relational:** one, yByX, toArray, isRelation

## TODO

- [ ] sort - Order tuples by attributes
- [ ] distinct - Remove duplicate tuples
- [ ] page - Pagination (offset + limit)
- [ ] size, empty, first, exists - Utility helpers
