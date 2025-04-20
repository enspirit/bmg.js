export type AttrName<T> = keyof T
export type Tuple<T> = T

export interface Relation<T> {
  // Relational
  restrict(p: Predicate<T>): Relation<T>
  rename<R extends Renaming<T>(r: R): RenamedRelation<T, R>

  // Non relational
  one(): Tuple<T>
  yByX(y: AttrName<T>, x: AttrName<T>): Tuple<T>
  toArray(): Tuple<T>[]
}


export type RelationOperand<T> = Relation<T>|Tuple<T>[]

export interface OperationalOperand<T> {
  tuples(): Iterable<Tuple<T>>
  output(tuples: Tuple<T>[]): RelationOperand<T>
}

export type PredicateFunc<T> = ((t: Tuple<T>) => any)
export type Predicate<T> = Tuple<T>|PredicateFunc<T>

export type Renaming<T> = RenamingObj<T>|RenamingFunc<T>
export type RenamingFunc<T> = (AttrName: AttrName<T>) => string
export type RenamingObj<T> = Record<AttrName<T>, string>
// TODO
export type RenamedRelation<T, R extends Renaming<T>> = unknown
