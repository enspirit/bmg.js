export type AttrName = string
export type Tuple = Record<AttrName, unknown>

export interface Relation {
  // Relational
  restrict(p: Predicate): Relation
  project(attrs: AttrName[]): Relation
  allbut(attrs: AttrName[]): Relation
  extend(e: Extension): Relation
  union(right: RelationOperand): Relation
  minus(right: RelationOperand): Relation
  intersect(right: RelationOperand): Relation
  matching(right: RelationOperand, keys?: JoinKeys): Relation
  not_matching(right: RelationOperand, keys?: JoinKeys): Relation
  join(right: RelationOperand, keys?: JoinKeys): Relation
  left_join(right: RelationOperand, keys?: JoinKeys): Relation
  image(right: RelationOperand, as: AttrName, keys?: JoinKeys): Relation
  summarize(by: AttrName[], aggs: Aggregators): Relation
  group(attrs: AttrName[], as: AttrName): Relation
  ungroup(attr: AttrName): Relation
  wrap(attrs: AttrName[], as: AttrName): Relation
  unwrap(attr: AttrName): Relation
  rename(r: Renaming): Relation

  // Non relational
  one(): Tuple
  yByX(y: AttrName, x: AttrName): Tuple
  toArray(): Tuple[]
  isEqual(right: RelationOperand): boolean
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

export type ExtensionFunc = (tuple: Tuple) => unknown
export type Extension = Record<AttrName, ExtensionFunc | AttrName>

export type JoinKeys = AttrName[] | Record<AttrName, AttrName>

export type AggregatorName = 'count' | 'sum' | 'min' | 'max' | 'avg' | 'collect'
export type AggregatorSpec = { op: AggregatorName, attr: AttrName }
export type AggregatorFunc = (tuples: Tuple[]) => unknown
export type Aggregator = AggregatorName | AggregatorSpec | AggregatorFunc
export type Aggregators = Record<AttrName, Aggregator>
