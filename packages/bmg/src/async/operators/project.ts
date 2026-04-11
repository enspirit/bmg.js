import type { AsyncRelationOperand } from '../types';
import type { Tuple, AttrName } from '../../types';
import { toAsyncOperationalOperand, deduplicateAsync } from './_helpers';

/**
 * Async generator that projects tuples to specified attributes.
 */
async function* projectGen<T>(
  source: AsyncIterable<T>,
  attrs: AttrName[]
): AsyncGenerator<Tuple> {
  for await (const tuple of source) {
    const t = tuple as Tuple;
    const projected = attrs.reduce((memo, attr) => {
      if (attr in t) {
        memo[attr] = t[attr];
      }
      return memo;
    }, {} as Tuple);
    yield projected;
  }
}

/**
 * Projects tuples to specified attributes with deduplication.
 */
export const project = <T>(
  operand: AsyncRelationOperand<T>,
  attrs: AttrName[]
): AsyncIterable<Tuple> => {
  const op = toAsyncOperationalOperand(operand);
  return deduplicateAsync(projectGen(op.tuples(), attrs));
};

/**
 * Async generator that projects out (removes) specified attributes.
 */
async function* allbutGen<T>(
  source: AsyncIterable<T>,
  attrs: AttrName[]
): AsyncGenerator<Tuple> {
  const excludeSet = new Set(attrs);
  for await (const tuple of source) {
    const t = tuple as Tuple;
    const projected: Tuple = {};
    for (const [attr, value] of Object.entries(t)) {
      if (!excludeSet.has(attr)) {
        projected[attr] = value;
      }
    }
    yield projected;
  }
}

/**
 * Projects out (removes) specified attributes with deduplication.
 */
export const allbut = <T>(
  operand: AsyncRelationOperand<T>,
  attrs: AttrName[]
): AsyncIterable<Tuple> => {
  const op = toAsyncOperationalOperand(operand);
  return deduplicateAsync(allbutGen(op.tuples(), attrs));
};
