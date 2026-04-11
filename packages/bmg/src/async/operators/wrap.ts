import type { AsyncRelationOperand } from '../types';
import type { AttrName, Tuple, WrapOptions } from '../../types';

/**
 * Wraps specified attributes into a nested object.
 *
 * With `options.allbut: true`, the attrs specify which attributes to KEEP
 * at the top level, and all others are wrapped into the nested object.
 */
export async function* wrap<T>(
  operand: AsyncRelationOperand<T>,
  attrs: AttrName[],
  as: AttrName,
  options?: WrapOptions
): AsyncIterable<Tuple> {
  const attrSet = new Set(attrs);

  for await (const tuple of operand) {
    const t = tuple as Tuple;
    const allAttrs = Object.keys(t);

    // With allbut: attrs are the ones to KEEP at top level (wrap all others)
    // Without allbut: attrs are the ones to WRAP into nested object
    const wrapAttrs = options?.allbut
      ? allAttrs.filter(a => !attrSet.has(a))
      : attrs.filter(a => allAttrs.includes(a));

    const wrapped: Tuple = {};
    const remaining: Tuple = {};

    for (const [key, value] of Object.entries(t)) {
      if (wrapAttrs.includes(key)) {
        wrapped[key] = value;
      } else {
        remaining[key] = value;
      }
    }

    yield {
      ...remaining,
      [as]: wrapped
    };
  }
}
