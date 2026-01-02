import {
  allbut,
  constants,
  exclude,
  extend,
  group,
  image,
  intersect,
  isEqual,
  join,
  left_join,
  matching,
  minus,
  not_matching,
  one,
  project,
  rename,
  restrict,
  summarize,
  where,
  transform,
  ungroup,
  union,
  unwrap,
  wrap,
  yByX,
} from "../operators";
import {
  Aggregators,
  AttrName,
  Extension,
  JoinKeys,
  Predicate,
  Relation,
  RelationOperand,
  Renaming,
  Transformation,
  Tuple,
} from "../types";

export class MemoryRelation implements Relation {

  constructor(private tuples: Tuple[]) {
    this.tuples = tuples;
  }

  restrict(p: Predicate): MemoryRelation {
    return restrict(this, p) as MemoryRelation;
  }

  where(p: Predicate): MemoryRelation {
    return where(this, p) as MemoryRelation;
  }

  exclude(p: Predicate): MemoryRelation {
    return exclude(this, p) as MemoryRelation;
  }

  project(attrs: AttrName[]): MemoryRelation {
    return project(this, attrs) as MemoryRelation;
  }

  allbut(attrs: AttrName[]): MemoryRelation {
    return allbut(this, attrs) as MemoryRelation;
  }

  extend(e: Extension): MemoryRelation {
    return extend(this, e) as MemoryRelation;
  }

  union(right: RelationOperand): MemoryRelation {
    return union(this, right) as MemoryRelation;
  }

  minus(right: RelationOperand): MemoryRelation {
    return minus(this, right) as MemoryRelation;
  }

  intersect(right: RelationOperand): MemoryRelation {
    return intersect(this, right) as MemoryRelation;
  }

  matching(right: RelationOperand, keys?: JoinKeys): MemoryRelation {
    return matching(this, right, keys) as MemoryRelation;
  }

  not_matching(right: RelationOperand, keys?: JoinKeys): MemoryRelation {
    return not_matching(this, right, keys) as MemoryRelation;
  }

  join(right: RelationOperand, keys?: JoinKeys): MemoryRelation {
    return join(this, right, keys) as MemoryRelation;
  }

  left_join(right: RelationOperand, keys?: JoinKeys): MemoryRelation {
    return left_join(this, right, keys) as MemoryRelation;
  }

  image(right: RelationOperand, as: AttrName, keys?: JoinKeys): MemoryRelation {
    return image(this, right, as, keys) as MemoryRelation;
  }

  summarize(by: AttrName[], aggs: Aggregators): MemoryRelation {
    return summarize(this, by, aggs) as MemoryRelation;
  }

  group(attrs: AttrName[], as: AttrName): MemoryRelation {
    return group(this, attrs, as) as MemoryRelation;
  }

  ungroup(attr: AttrName): MemoryRelation {
    return ungroup(this, attr) as MemoryRelation;
  }

  wrap(attrs: AttrName[], as: AttrName): MemoryRelation {
    return wrap(this, attrs, as) as MemoryRelation;
  }

  unwrap(attr: AttrName): MemoryRelation {
    return unwrap(this, attr) as MemoryRelation;
  }

  rename(r: Renaming): MemoryRelation {
    return rename(this, r) as MemoryRelation;
  }

  constants(consts: Tuple): MemoryRelation {
    return constants(this, consts) as MemoryRelation;
  }

  transform(t: Transformation): MemoryRelation {
    return transform(this, t) as MemoryRelation;
  }

  one(): Tuple {
    return one(this)
  }

  toArray(): Tuple[] {
    return this.tuples;
  }

  yByX(y: AttrName, x: AttrName): Tuple {
    return yByX(this, y, x);
  }

  isEqual(right: RelationOperand): boolean {
    return isEqual(this, right);
  }

}
