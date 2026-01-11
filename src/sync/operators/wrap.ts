import { RelationOperand, AttrName, Tuple, WrapOptions } from "../../types";
import { toOperationalOperand } from "./_helpers";

export const wrap = (operand: RelationOperand, attrs: AttrName[], as: AttrName, options?: WrapOptions): RelationOperand => {
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  const attrSet = new Set(attrs);
  const result: Tuple[] = [];

  for (const tuple of iterable) {
    const allAttrs = Object.keys(tuple);

    // With allbut: attrs are the ones to KEEP at top level (wrap all others)
    // Without allbut: attrs are the ones to WRAP into nested object
    const wrapAttrs = options?.allbut
      ? allAttrs.filter(a => !attrSet.has(a))
      : attrs.filter(a => allAttrs.includes(a));

    const wrapped: Tuple = {};
    const remaining: Tuple = {};

    for (const [key, value] of Object.entries(tuple)) {
      if (wrapAttrs.includes(key)) {
        wrapped[key] = value;
      } else {
        remaining[key] = value;
      }
    }

    result.push({
      ...remaining,
      [as]: wrapped
    });
  }

  return op.output(result);
}
