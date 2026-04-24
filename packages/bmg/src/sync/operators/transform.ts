import { RelationOperand, Transformation, Tuple } from "../../types";
import { applyTransformation } from "../../support/applyTransform";
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
};
