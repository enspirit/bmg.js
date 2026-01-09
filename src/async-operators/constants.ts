import type { AsyncRelationOperand } from '../async-types';
import type { Tuple } from '../types';
import { toAsyncOperationalOperand } from './_helpers';

/**
 * Async generator that adds constant attributes to each tuple.
 */
async function* constantsGen<T>(
  source: AsyncIterable<T>,
  consts: Tuple
): AsyncGenerator<Tuple> {
  for await (const tuple of source) {
    yield { ...(tuple as Tuple), ...consts };
  }
}

/**
 * Adds constant attributes to each tuple.
 */
export const constants = <T>(
  operand: AsyncRelationOperand<T>,
  consts: Tuple
): AsyncIterable<Tuple> => {
  const op = toAsyncOperationalOperand(operand);
  return constantsGen(op.tuples(), consts);
};
