import type { AsyncRelationOperand } from '../types';
import { toAsyncOperationalOperand } from './_helpers';

/**
 * Collects all tuples from the async relation into an array.
 */
export const toArray = async <T>(
  operand: AsyncRelationOperand<T>
): Promise<T[]> => {
  const op = toAsyncOperationalOperand(operand);
  const result: T[] = [];

  for await (const tuple of op.tuples()) {
    result.push(tuple);
  }

  return result;
};
