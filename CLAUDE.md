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
