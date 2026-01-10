import { RelationOperand, Tuple } from "../../types";
import { toOperationalOperand, deduplicate } from "./_helpers";

export const cross_product = (left: RelationOperand, right: RelationOperand): RelationOperand => {
  const opLeft = toOperationalOperand(left);
  const opRight = toOperationalOperand(right);
  const leftTuples = [...opLeft.tuples()];
  const rightTuples = [...opRight.tuples()];
  const result: Tuple[] = [];

  for (const l of leftTuples) {
    for (const r of rightTuples) {
      result.push({ ...r, ...l });
    }
  }

  return opLeft.output(deduplicate(result));
}

export { cross_product as cross_join };
