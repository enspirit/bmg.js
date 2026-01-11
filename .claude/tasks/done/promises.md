## Problem to solve

Unlike Ruby, Bmg.js typical environment is often async. This means that relations
that we could obtain on databases and files won't provide an array easily.

Example, we don't want the example below, because it would mean loading all
suppliers in memory first, then applying relational algebra, instead of being
able to delegate the query the database (eventually, when we'll have a SQL
compiler for relational expressions).

```typescript
const suppliers = await db.suppliers()
const smith = Bmg(suppliers).restrict({name: 'Smith'}).one()
```

## Idea

Maybe we could have an async implementation of the Relation interface ?

Then we would have something like this :

```typescript
const smith = await db.suppliers().restrict({name: 'Smith'}).one()
```

How to implement that in practice ?

Let's start with some unit tests that would simulate having a database,
not connect with a real async API.

## After a first AsyncRelation

The real objective is to let specific implementations (like files, redis, sql
handlers) override the default behavior and "optimize" the calls, implementing
certain operators when possible.

Let's build an example of that in tests.

Let's say we have a FooAsyncRelation that is able to optimize calls to `restrict`
when provided with an object having only an `id` field. In that case it can jump
to the data. Any other `restrict` or call to another operator should have the
default implementation.

