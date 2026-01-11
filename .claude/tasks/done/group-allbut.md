## Problem to solve

I'd like to group all BUT some attributes into a sub-relation.

## Idea

BMG ruby supports the following syntax :

```ruby
r.group([:city], { allbut: true })
```

This actually groups all tuples per city, instead of grouping the city as
sub-relation.

Let's add similar support to sync and async relations.

TESTS are super important here.

## Implementation

- [x] Add GroupOptions type with `allbut?: boolean`
- [x] Update Relation interface with overloaded group signatures
- [x] Update sync group operator to handle allbut option
- [x] Update async group operator to handle allbut option
- [x] Update MemoryRelation class
- [x] Update BaseAsyncRelation class
- [x] Add unit tests for sync group with allbut
- [x] Add unit tests for async group with allbut
- [x] Update README
- [x] Update CHANGELOG
