export type AttrName<T> = keyof T
export type Tuple<T> = T
export interface Relation<T> {
  // Relational
  restrict(p: Predicate<T>): Relation<T>
  rename<R extends Renaming<T>>(r: R): RenamedRelation<T, R>

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
export type Predicate<T> = Partial<Tuple<T>>|PredicateFunc<T>

export type RenamingFunc<T> = (k: AttrName<T>) => string
export type RenamingObj<T> = Partial<Record<AttrName<T>, string>>
export type Renaming<T> = RenamingObj<T> | RenamingFunc<T>


export type RenamedTuple<T, R extends Renaming<T>> =
  R extends RenamingFunc<T>
    ? RenameWithFunc<T, R, keyof T>
    : R extends RenamingObj<T>
      ? RenameWithObj<T, R>
      : never

export type RenameWithObj<T, R extends RenamingObj<T>> = {
  [K in keyof T as K extends keyof R
    ? R[K] extends string ? R[K] : K
    : K]: T[K]
}

export type RenameWithFunc<T, F extends RenamingFunc<T>, K extends keyof T> = {
  [P in keyof T as P extends K ? ReturnType<F> : P]: T[P]
}

export type RenamedRelation<T, R extends Renaming<T>> =
  R extends (infer F extends RenamingFunc<T>)
    ? Relation<RenameWithFunc<T, F, keyof T>>
    : R extends RenamingObj<T>
      ? Relation<RenameWithObj<T, R>>
      : never
