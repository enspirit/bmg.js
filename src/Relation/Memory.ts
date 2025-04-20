import { one, restrict } from "../operators";
import { Predicate, Relation, Tuple } from "../types";

export class MemoryRelation implements Relation {

  constructor(private tuples: Tuple[]) {
    this.tuples = tuples;
  }

  restrict(p: Predicate): MemoryRelation {
    return restrict(this, p);
  }

  one(): Tuple {
    return one(this)
  }

  toArray(): Tuple[] {
    return this.tuples;
  }

}
