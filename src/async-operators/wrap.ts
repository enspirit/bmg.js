import type { AsyncRelationOperand } from '../async-types';
import type { AttrName, Tuple } from '../types';

/**
 * Wraps specified attributes into a nested object.
 */
export async function* wrap<T>(
  operand: AsyncRelationOperand<T>,
  attrs: AttrName[],
  as: AttrName
): AsyncIterable<Tuple> {
  const wrappedSet = new Set(attrs);

  for await (const tuple of operand) {
    const t = tuple as Tuple;
    const wrapped: Tuple = {};
    const remaining: Tuple = {};

    for (const [key, value] of Object.entries(t)) {
      if (wrappedSet.has(key)) {
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
