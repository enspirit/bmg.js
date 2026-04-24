import type { AsyncRelationOperand } from '../types';
import type { Transformation, Tuple } from '../../types';
import { applyTransformation } from '../../support/applyTransform';

/**
 * Applies transformation functions or tokens to attribute values.
 * - Single step (function or token): applies to all values
 * - Array: pipeline applied left-to-right
 * - Object with attr keys: applies per-attribute pipelines
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
