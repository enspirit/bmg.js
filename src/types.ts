export type AttrName = string
export type Tuple = Record<AttrName, unknown>

export interface Relation {
  one(): Tuple
  toArray(): Tuple[]
}

export type RelationOperand = Relation|Tuple[]

export interface OperationalOperand {
  tuples(): Iterable<Tuple>
  output(tuples: Tuple[]): RelationOperand
}

export type PredicateFunc = ((t: Tuple) => any)
export type Predicate = Tuple|PredicateFunc
