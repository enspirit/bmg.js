import type { AsyncRelationOperand } from '../async-types';
import type { PrefixOptions, Tuple } from '../types';
import { rename } from './rename';

/**
 * Prefixes all attribute names (except those in options.except).
 */
export const prefix = <T>(
  operand: AsyncRelationOperand<T>,
  pfx: string,
  options?: PrefixOptions
): AsyncIterable<Tuple> => {
  const except = new Set(options?.except ?? []);
  return rename(operand, (attr) => except.has(attr) ? attr : `${pfx}${attr}`);
};
