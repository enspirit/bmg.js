import { toPredicateFunc } from "../../support/toPredicateFunc";
import { RelationOperand, Predicate, Tuple } from "../../types";
import { toOperationalOperand } from "./_helpers";

export const exclude = (operand: RelationOperand, p: Predicate): RelationOperand => {
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  const f = toPredicateFunc(p)
  const kept: Tuple[] = [];
  for (const tuple of iterable) {
    if (!f(tuple)) kept.push(tuple);
  }
  return op.output(kept)
}
