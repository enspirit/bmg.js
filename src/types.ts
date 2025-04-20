export type Tuple = Record<string, unknown>

export interface Relation {
  one(): Tuple
  toArray(): Tuple[]
}

export type RelationOperand = Tuple[]|Relation|OperationalOperand

export interface OperationalOperand {
  tuples(): Iterable<Tuple>
  output(tuples: Tuple[]): RelationOperand
}

export type PredicateFunc = ((t: Tuple) => any)
export type Predicate = Tuple|PredicateFunc
