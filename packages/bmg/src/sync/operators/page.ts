import { RelationOperand, Ordering, PageOptions, Tuple } from "../../types";
import { toOperationalOperand } from "./_helpers";

const DEFAULT_PAGE_SIZE = 20;

const compareTuples = (a: Tuple, b: Tuple, ordering: Ordering): number => {
  for (const entry of ordering) {
    const [attr, dir] = Array.isArray(entry) ? entry : [entry, 'asc' as const];
    const av = a[attr];
    const bv = b[attr];
    if (av === bv) continue;
    if (av == null) return dir === 'asc' ? -1 : 1;
    if (bv == null) return dir === 'asc' ? 1 : -1;
    const cmp = (av as any) < (bv as any) ? -1 : 1;
    return dir === 'asc' ? cmp : -cmp;
  }
  return 0;
};

export const page = (
  operand: RelationOperand,
  ordering: Ordering,
  pageNumber: number,
  options?: PageOptions,
): RelationOperand => {
  const op = toOperationalOperand(operand);
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const tuples = [...op.tuples()];
  tuples.sort((a, b) => compareTuples(a, b, ordering));
  const offset = (pageNumber - 1) * pageSize;
  return op.output(tuples.slice(offset, offset + pageSize));
};
