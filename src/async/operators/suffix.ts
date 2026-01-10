import type { AsyncRelationOperand } from '../types';
import type { SuffixOptions, Tuple } from '../../types';
import { rename } from './rename';

/**
 * Suffixes all attribute names (except those in options.except).
 */
export const suffix = <T>(
  operand: AsyncRelationOperand<T>,
  sfx: string,
  options?: SuffixOptions
): AsyncIterable<Tuple> => {
  const except = new Set(options?.except ?? []);
  return rename(operand, (attr) => except.has(attr) ? attr : `${attr}${sfx}`);
};
