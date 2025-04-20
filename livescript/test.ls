Bmg = require '../dist/bmg.cjs'

restrict = (predicate, relation) -->
  Bmg.restrict(relation, predicate)

one = (relation) -->
  relation.one!

suppliers = Bmg.Bmg([
  {sid: 'S1', name: 'Smith'},
  {sid: 'S2', name: 'Jones'},
])

result = suppliers
  |> restrict(sid: 'S2')
  |> one

console.log(result)
