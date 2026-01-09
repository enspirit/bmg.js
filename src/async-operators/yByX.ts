import type { AsyncRelationOperand } from '../async-types';
import type { AttrName, Tuple } from '../types';

/**
 * Builds a key-value map from two attributes.
 * Terminal operation - returns a Promise.
 */
export const yByX = async <T>(
  operand: AsyncRelationOperand<T>,
  y: AttrName,
  x: AttrName
): Promise<Tuple> => {
  const hash: Tuple = {};
  for await (const tuple of operand) {
    const t = tuple as Tuple;
    hash[`${t[x]}`] = t[y];
  }
  return hash;
};
