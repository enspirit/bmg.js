import { RelationOperand, AttrName, GroupOptions } from "../../types";
import { toOperationalOperand, groupTuples } from "./_helpers";
import { MemoryRelation } from "@/sync/Relation";

export const group = (operand: RelationOperand, attrs: AttrName[], as: AttrName, options?: GroupOptions): RelationOperand => {
  const op = toOperationalOperand(operand);
  const tuples = [...op.tuples()];

  const result = groupTuples(tuples, attrs, options);
  if (!result) return op.output([]);

  const output = [...result.groups.values()].map(({ base, nested }) => ({
    ...base,
    [as]: new MemoryRelation(nested)
  }));

  return op.output(output);
}
