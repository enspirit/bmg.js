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
