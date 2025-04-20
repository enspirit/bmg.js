import { one, restrict, yByX } from "../operators";
import { AttrName, Predicate, Relation, Tuple } from "../types";

export class MemoryRelation implements Relation {

  constructor(private tuples: Tuple[]) {
    this.tuples = tuples;
  }

  restrict(p: Predicate): MemoryRelation {
    return restrict(this, p) as MemoryRelation;
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
