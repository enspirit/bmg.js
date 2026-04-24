import { or, match } from '@enspirit/predicate';
import type { AsyncRelationOperand } from '../types';
import type { AttrName, RxmatchOptions } from '../../types';
import { restrict } from './restrict';

/**
 * Async substring match across multiple attributes: compiles to
 * `restrict(or(match(a1), match(a2), ...))`.
 */
export const rxmatch = <T>(
  operand: AsyncRelationOperand<T>,
  attrs: AttrName[],
  pattern: string,
  options?: RxmatchOptions,
): AsyncIterable<T> => {
  if (attrs.length === 0) return operand as AsyncIterable<T>;
  const opts = options?.caseSensitive === false ? { caseSensitive: false } : undefined;
  const preds = attrs.map(a => match(a, pattern, opts));
  const p = preds.length === 1 ? preds[0] : or(...preds);
  return restrict(operand, p);
};
