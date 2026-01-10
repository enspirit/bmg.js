import type { AsyncRelationOperand } from '../types';
import { toAsyncOperationalOperand, error } from './_helpers';

/**
 * Returns the single tuple from the relation.
 * Throws if the relation is empty or has more than one tuple.
 */
export const one = async <T>(
  operand: AsyncRelationOperand<T>
): Promise<T> => {
  const op = toAsyncOperationalOperand(operand);
  let result: T | undefined;

  for await (const tuple of op.tuples()) {
    if (result !== undefined) {
      return error('More than one tuple found');
    }
    result = tuple;
  }

  if (result !== undefined) {
    return result;
  }
  return error('Relation is empty');
};
