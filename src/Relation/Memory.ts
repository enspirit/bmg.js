import {
  one,
  project,
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

export class MemoryRelation implements Relation {

  constructor(private tuples: Tuple[]) {
    this.tuples = tuples;
  }

  restrict(p: Predicate): MemoryRelation {
    return restrict(this, p) as MemoryRelation;
  }

  project(attrs: AttrName[]): MemoryRelation {
    return project(this, attrs) as MemoryRelation;
  }

  rename(r: Renaming): MemoryRelation {
    return rename(this, r) as MemoryRelation;
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

}
