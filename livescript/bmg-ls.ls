Bmg = require '../dist/bmg.cjs'

restrict = (predicate, relation) -->
  Bmg.restrict(relation, predicate)

rename = (renaming, relation) -->
  Bmg.rename(relation, renaming)

one = (relation) -->
  Bmg.one(relation)

yByX = (y, x, relation) -->
  Bmg.yByX(y, x, relation)

module.exports = {
  Bmg: Bmg.Bmg,
  restrict,
  rename,
  one,
  yByX,
}
