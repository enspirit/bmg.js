import { toPredicateFunc } from "../support/toPredicateFunc";
import { RelationOperand, Predicate, Tuple } from "../types";
import { toOperationalOperand } from "./_helpers";

export const restrict = <T>(operand: RelationOperand<T>, p: Predicate<T>): RelationOperand<T> => {
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  const f = toPredicateFunc(p)
  const kept: Tuple<T>[] = [];
  for (const tuple of iterable) {
    if (f(tuple)) kept.push(tuple);
  }
  return op.output(kept)
}
