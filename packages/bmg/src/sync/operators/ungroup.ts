import { RelationOperand, AttrName, Tuple, Relation } from "../../types";
import { toOperationalOperand } from "./_helpers";
import { isRelation } from "./isRelation";

const toTupleArray = (value: unknown): Tuple[] => {
  if (isRelation(value)) {
    return (value as Relation).toArray();
  }
  if (Array.isArray(value)) {
    return value;
  }
  throw new Error(`Value is not a relation or array`);
}

export const ungroup = (operand: RelationOperand, attr: AttrName): RelationOperand => {
  const op = toOperationalOperand(operand);
  const tuples = [...op.tuples()];
  const result: Tuple[] = [];

  for (const tuple of tuples) {
    const nested = toTupleArray(tuple[attr]);

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
