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

## Theory

IMPORTANT rules:

1. Relations NEVER have duplicates
2. Order of tuples and order or attributes in a tuple are not important semantically
3. Mathematically, relations are sets of tuples ; tuples are sets of (attr, value) pairs.
4. Two relations are equal of they have the exact same set of exact same tuples.

## About unit tests

IMPORTANT rules:

* Favor purely relational tests: compare an obtained relation with the expected relation
  using `isEqual`.
* Do NEVER access the "first" tuple, since there is no such tuple.
* Instead, use `r.restrict(...predicate...).one` with a predicate that selects the
  tuple you are interested in. `one` will correctly fail if your assumption is wrong.

## Implemented operators

**Relational:** restrict, project, allbut, extend, rename, union, minus, intersect, matching, not_matching, join, left_join, image, summarize, group, ungroup, wrap, unwrap

**Non-relational:** one, yByX, toArray, isRelation, isEqual

## TODO

- [ ] sort - Order tuples by attributes
- [ ] page - Pagination (offset + limit)
- [ ] size, empty, first, exists - Utility helpers
