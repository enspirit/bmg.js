import { RelationOperand, Transformation, Tuple } from "../types";
import { toOperationalOperand } from "./_helpers";

export const transform = (operand: RelationOperand, transformation: Transformation): RelationOperand => {
  const op = toOperationalOperand(operand);
  const iterable = op.tuples();
  const result: Tuple[] = [];

  for (const tuple of iterable) {
    const transformed: Tuple = {};

    for (const [attr, value] of Object.entries(tuple)) {
      transformed[attr] = applyTransformation(value, attr, transformation);
    }

    result.push(transformed);
  }

  return op.output(result);
}

const applyTransformation = (value: unknown, attr: string, transformation: Transformation): unknown => {
  if (typeof transformation === 'function') {
    // Single function - apply to all values
    return transformation(value);
  } else if (Array.isArray(transformation)) {
    // Array of functions - chain them
    return transformation.reduce((v, fn) => fn(v), value);
  } else {
    // Object with attr-specific transformers
    const fn = transformation[attr];
    if (fn) {
      if (Array.isArray(fn)) {
        return fn.reduce((v, f) => f(v), value);
      }
      return fn(value);
    }
    return value;
  }
}
