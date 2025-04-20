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

export type RenamedTuple<T, R> =
  R extends [infer K, infer F]
    ? K extends keyof T
      ? F extends (k: K) => string
        ? RenameWithFunc<T, K, F>
        : never
      : never
    : R extends RenamingObj<T>
      ? RenameWithObj<T, R>
      : never

export type RenameWithObj<T, R extends RenamingObj<T>> = {
  [K in keyof T as K extends keyof R
    ? R[K] extends string ? R[K] : K
    : K]: T[K]
}

export type RenameWithFunc<T, K extends keyof T, F extends (attr: K) => string> = {
  [P in keyof T as P extends K ? ReturnType<F> : P]: T[P]
}

export type RenamedRelation<T, R extends Renaming<T>> =
  Relation<RenamedTuple<T, R>>
