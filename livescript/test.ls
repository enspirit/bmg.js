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
