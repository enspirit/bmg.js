import {
  one,
  rename,
  restrict,
  yByX,
} from "../operators";
import {
  AttrName,
  Predicate,
  Relation,
  Renaming,
  Tuple,
} from "../types";

export class MemoryRelation<T> implements Relation<T> {

  constructor(private tuples: Tuple<T>[]) {
    this.tuples = tuples;
  }

  restrict(p: Predicate<T>): MemoryRelation<T> {
    return restrict(this, p) as MemoryRelation<T>;
  }

  rename<R extends Renaming<T>>(r: R): MemoryRelation<T> {
    return rename(this, r) as MemoryRelation<T>;
  }

  one(): Tuple<T> {
    return one(this)
  }

  toArray(): Tuple<T>[] {
    return this.tuples;
  }

  yByX(y: AttrName<T>, x: AttrName<T>): Tuple<T> {
    return yByX(this, y, x);
  }

}
