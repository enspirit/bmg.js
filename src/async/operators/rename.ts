import type { AsyncRelationOperand } from '../types';
import type { Renaming, Tuple } from '../../types';
import { toAsyncOperationalOperand } from './_helpers';
import { toRenamingFunc } from '../../sync/operators/_helpers';

/**
 * Async generator that renames attributes in each tuple.
 */
async function* renameGen<T>(
  source: AsyncIterable<T>,
  renaming: Renaming
): AsyncGenerator<Tuple> {
  const renamingFunc = toRenamingFunc(renaming);
  for await (const tuple of source) {
    const t = tuple as Tuple;
    const renamed = Object.keys(t).reduce((memo, attr) => {
      memo[renamingFunc(attr)] = t[attr];
      return memo;
    }, {} as Tuple);
    yield renamed;
  }
}

/**
 * Renames attributes in each tuple.
 */
export const rename = <T>(
  operand: AsyncRelationOperand<T>,
  renaming: Renaming
): AsyncIterable<Tuple> => {
  const op = toAsyncOperationalOperand(operand);
  return renameGen(op.tuples(), renaming);
};
