import type { AsyncRelationOperand } from '../types';
import type { AttrName, Tuple } from '../../types';

/**
 * Unwraps a nested object attribute back into the parent tuple.
 */
export async function* unwrap<T>(
  operand: AsyncRelationOperand<T>,
  attr: AttrName
): AsyncIterable<Tuple> {
  for await (const tuple of operand) {
    const t = tuple as Tuple;
    const wrapped = t[attr] as Tuple;

    if (typeof wrapped !== 'object' || wrapped === null || Array.isArray(wrapped)) {
      throw new Error(`Attribute '${attr}' is not a tuple (object)`);
    }

    const unwrapped: Tuple = {};
    for (const [key, value] of Object.entries(t)) {
      if (key !== attr) {
        unwrapped[key] = value;
      }
    }

    yield {
      ...unwrapped,
      ...wrapped
    };
  }
}
