import { RelationOperand, AttrName, Tuple } from "../types";
import { toOperationalOperand } from "./_helpers";

const groupKey = (tuple: Tuple, byAttrs: AttrName[]): string => {
  const keyParts = byAttrs.map(attr => JSON.stringify(tuple[attr]));
  return keyParts.join('|');
}

const pickAttrs = (tuple: Tuple, attrs: AttrName[]): Tuple => {
  return attrs.reduce((acc, attr) => {
    acc[attr] = tuple[attr];
    return acc;
  }, {} as Tuple);
}

export const group = (operand: RelationOperand, attrs: AttrName[], as: AttrName): RelationOperand => {
  const op = toOperationalOperand(operand);
  const tuples = [...op.tuples()];

  if (tuples.length === 0) {
    return op.output([]);
  }

  // Determine which attributes to keep at the top level (all except grouped ones)
  const allAttrs = Object.keys(tuples[0]);
  const groupedSet = new Set(attrs);
  const byAttrs = allAttrs.filter(a => !groupedSet.has(a));

  // Group tuples
  const groups = new Map<string, { base: Tuple, nested: Tuple[] }>();
  for (const tuple of tuples) {
    const key = groupKey(tuple, byAttrs);
    if (!groups.has(key)) {
      groups.set(key, {
        base: pickAttrs(tuple, byAttrs),
        nested: []
      });
    }
    groups.get(key)!.nested.push(pickAttrs(tuple, attrs));
  }

  // Build result with nested relations
  const result: Tuple[] = [];
  for (const { base, nested } of groups.values()) {
    result.push({
      ...base,
      [as]: nested
    });
  }

  return op.output(result);
}
