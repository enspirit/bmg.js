import { restrict } from "../operators/restrict";
import { Predicate, Relation, Tuple } from "../types";

export class MemoryRelation implements Relation {

  constructor(private tuples: Tuple[]) {
    this.tuples = tuples;
  }

  restrict(p: Predicate): MemoryRelation {
    return restrict(this, p);
  }

  one(): Tuple {
    if (this.tuples.length === 0) {
      throw 'Relation is empty';
    } else if (this.tuples.length > 1) {
      throw 'Relation has more than one tuple';
    }
    return this.tuples[0];
  }

  toArray(): Tuple[] {
    return this.tuples;
  }

}
