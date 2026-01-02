export type AttrName = string
export type Tuple = Record<AttrName, unknown>

export interface Relation {
  // Relational
  restrict(p: Predicate): Relation
  project(attrs: AttrName[]): Relation
  rename(r: Renaming): Relation

  // Non relational
  one(): Tuple
  yByX(y: AttrName, x: AttrName): Tuple
  toArray(): Tuple[]
}


export type RelationOperand = Relation|Tuple[]

export interface OperationalOperand {
  tuples(): Iterable<Tuple>
  output(tuples: Tuple[]): RelationOperand
}

export type PredicateFunc = ((t: Tuple) => any)
export type Predicate = Tuple|PredicateFunc

export type Renaming = RenamingObj|RenamingFunc
export type RenamingFunc = (AttrName) => AttrName
export type RenamingObj = Record<AttrName, AttrName>
