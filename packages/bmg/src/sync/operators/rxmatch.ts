import { or, match } from "@enspirit/predicate";
import { AttrName, RelationOperand, RxmatchOptions } from "../../types";
import { restrict } from "./restrict";

/**
 * Restrict to tuples where at least one of the given string attributes
 * contains `pattern` as a substring. Compiles to a disjunction of LIKE
 * predicates in SQL (one per attribute).
 *
 * Options:
 *   - caseSensitive (default true): when false, both sides are wrapped
 *     in UPPER() for a case-insensitive match.
 */
export const rxmatch = (
  operand: RelationOperand,
  attrs: AttrName[],
  pattern: string,
  options?: RxmatchOptions,
): RelationOperand => {
  if (attrs.length === 0) return operand;
  const opts = options?.caseSensitive === false ? { caseSensitive: false } : undefined;
  const preds = attrs.map(a => match(a, pattern, opts));
  const p = preds.length === 1 ? preds[0] : or(...preds);
  return restrict(operand, p);
};
