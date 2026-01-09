import type { AsyncRelationOperand } from '../async-types';
import type { Extension, Tuple } from '../types';
import { toAsyncOperationalOperand } from './_helpers';

/**
 * Async generator that extends tuples with computed or copied attributes.
 */
async function* extendGen<T>(
  source: AsyncIterable<T>,
  extension: Extension
): AsyncGenerator<Tuple> {
  for await (const tuple of source) {
    const t = tuple as Tuple;
    const extended = { ...t };
    for (const [attr, spec] of Object.entries(extension)) {
      if (typeof spec === 'function') {
        extended[attr] = spec(t);
      } else {
        extended[attr] = t[spec];
      }
    }
    yield extended;
  }
}

/**
 * Extends each tuple with new attributes.
 * Extension can be functions (computed) or attribute names (copied).
 */
export const extend = <T>(
  operand: AsyncRelationOperand<T>,
  extension: Extension
): AsyncIterable<Tuple> => {
  const op = toAsyncOperationalOperand(operand);
  return extendGen(op.tuples(), extension);
};
