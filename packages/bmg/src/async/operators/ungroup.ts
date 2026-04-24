import type { AsyncRelationOperand } from '../types';
import type { AttrName, Tuple, Relation } from '../../types';
import { isRelation } from '../../sync/operators/isRelation';

const toTupleArray = (value: unknown): Tuple[] => {
  if (isRelation(value)) {
    return (value as Relation).toArray();
  }
  if (Array.isArray(value)) {
    return value;
  }
  throw new Error(`Value is not a relation or array`);
};

/**
 * Flattens a nested relation attribute back into parent tuples.
 * Materializes all tuples to perform ungrouping.
 */
export async function* ungroup<T>(
  operand: AsyncRelationOperand<T>,
  attr: AttrName
): AsyncIterable<Tuple> {
  for await (const tuple of operand) {
    const t = tuple as Tuple;
    const nested = toTupleArray(t[attr]);

    // Get base attributes (all except the grouped one)
    const base: Tuple = {};
    for (const [key, value] of Object.entries(t)) {
      if (key !== attr) {
        base[key] = value;
      }
    }

    // Flatten each nested tuple
    for (const nestedTuple of nested) {
      yield {
        ...base,
        ...nestedTuple
      };
    }
  }
}
