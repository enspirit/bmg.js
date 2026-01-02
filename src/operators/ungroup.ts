import { RelationOperand, AttrName, Tuple } from "../types";
import { toOperationalOperand } from "./_helpers";

export const ungroup = (operand: RelationOperand, attr: AttrName): RelationOperand => {
  const op = toOperationalOperand(operand);
  const tuples = [...op.tuples()];
  const result: Tuple[] = [];

  for (const tuple of tuples) {
    const nested = tuple[attr] as Tuple[];
    if (!Array.isArray(nested)) {
      throw new Error(`Attribute '${attr}' is not a relation (array)`);
    }

    // Get base attributes (all except the grouped one)
    const base: Tuple = {};
    for (const [key, value] of Object.entries(tuple)) {
      if (key !== attr) {
        base[key] = value;
      }
    }

    // Flatten each nested tuple
    for (const nestedTuple of nested) {
      result.push({
        ...base,
        ...nestedTuple
      });
    }
  }

  return op.output(result);
}
