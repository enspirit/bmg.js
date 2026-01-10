import type { AsyncRelationOperand } from '../types';
import type { AutowrapOptions, Tuple } from '../../types';

/**
 * Automatically wraps attributes based on naming convention.
 * Attributes with separator (default '_') are grouped into nested objects.
 */
export async function* autowrap<T>(
  operand: AsyncRelationOperand<T>,
  options?: AutowrapOptions
): AsyncIterable<Tuple> {
  const sep = options?.separator ?? '_';

  for await (const tuple of operand) {
    const t = tuple as Tuple;
    const wrapped: Tuple = {};

    for (const [attr, value] of Object.entries(t)) {
      const parts = attr.split(sep);
      if (parts.length === 1) {
        wrapped[attr] = value;
      } else {
        const [prefix, ...rest] = parts;
        wrapped[prefix] = wrapped[prefix] ?? {};
        (wrapped[prefix] as Tuple)[rest.join(sep)] = value;
      }
    }

    yield wrapped;
  }
}
