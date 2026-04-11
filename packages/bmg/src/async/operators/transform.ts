import type { AsyncRelationOperand } from '../types';
import type { Transformation, Tuple } from '../../types';

/**
 * Applies transformation functions to attribute values.
 * - Single function: applies to all values
 * - Array of functions: chains them in order
 * - Object with attr keys: applies per-attribute transformers
 */
export async function* transform<T>(
  operand: AsyncRelationOperand<T>,
  transformation: Transformation
): AsyncIterable<Tuple> {
  for await (const tuple of operand) {
    const transformed: Tuple = {};

    for (const [attr, value] of Object.entries(tuple as Tuple)) {
      transformed[attr] = applyTransformation(value, attr, transformation);
    }

    yield transformed;
  }
}

const applyTransformation = (value: unknown, attr: string, transformation: Transformation): unknown => {
  if (typeof transformation === 'function') {
    // Single function - apply to all values
    return transformation(value);
  } else if (Array.isArray(transformation)) {
    // Array of functions - chain them
    return transformation.reduce((v, fn) => fn(v), value);
  } else {
    // Object with attr-specific transformers
    const fn = transformation[attr];
    if (fn) {
      if (Array.isArray(fn)) {
        return fn.reduce((v, f) => f(v), value);
      }
      return fn(value);
    }
    return value;
  }
};
