import type { AsyncRelationOperand } from '../types';
import type { AttrName, Tuple, Aggregator, Aggregators } from '../../types';

const groupKey = (tuple: Tuple, by: AttrName[]): string => {
  const keyParts = by.map(attr => JSON.stringify(tuple[attr]));
  return keyParts.join('|');
};

const pickAttrs = (tuple: Tuple, attrs: AttrName[]): Tuple => {
  return attrs.reduce((acc, attr) => {
    acc[attr] = tuple[attr];
    return acc;
  }, {} as Tuple);
};

const applyAggregator = (tuples: Tuple[], agg: Aggregator): unknown => {
  if (typeof agg === 'function') {
    return agg(tuples);
  }

  const spec = typeof agg === 'string' ? { op: agg, attr: '' } : agg;
  const { op, attr } = spec;

  switch (op) {
    case 'count':
      return tuples.length;

    case 'sum': {
      return tuples.reduce((sum, t) => sum + (Number(t[attr]) || 0), 0);
    }

    case 'min': {
      const values = tuples.map(t => t[attr]).filter(v => v !== undefined && v !== null);
      return values.length > 0 ? Math.min(...values.map(Number)) : null;
    }

    case 'max': {
      const values = tuples.map(t => t[attr]).filter(v => v !== undefined && v !== null);
      return values.length > 0 ? Math.max(...values.map(Number)) : null;
    }

    case 'avg': {
      const values = tuples.map(t => Number(t[attr])).filter(v => !isNaN(v));
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
    }

    case 'collect': {
      return tuples.map(t => t[attr]);
    }

    default:
      throw new Error(`Unknown aggregator: ${op}`);
  }
};

/**
 * Aggregates tuples by grouping attributes.
 * Supports count, sum, min, max, avg, collect, and custom functions.
 * Materializes all tuples to perform grouping.
 */
export async function* summarize<T>(
  operand: AsyncRelationOperand<T>,
  by: AttrName[],
  aggs: Aggregators
): AsyncIterable<Tuple> {
  // Materialize all tuples
  const tuples: Tuple[] = [];
  for await (const tuple of operand) {
    tuples.push(tuple as Tuple);
  }

  // Group tuples
  const groups = new Map<string, Tuple[]>();
  for (const tuple of tuples) {
    const key = groupKey(tuple, by);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(tuple);
  }

  // Apply aggregators to each group
  for (const groupTuples of groups.values()) {
    const row: Tuple = pickAttrs(groupTuples[0], by);
    for (const [resultAttr, agg] of Object.entries(aggs)) {
      row[resultAttr] = applyAggregator(groupTuples, agg);
    }
    yield row;
  }
}
