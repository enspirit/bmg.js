import { toOperationalOperand, tupleKey } from "./_helpers";

export const isEqual = (left: any, right: any): boolean => {
  const opLeft = toOperationalOperand(left);
  const opRight = toOperationalOperand(right);

  const leftKeys = new Set<string>();
  for (const tuple of opLeft.tuples()) {
    leftKeys.add(tupleKey(tuple));
  }

  const rightKeys = new Set<string>();
  for (const tuple of opRight.tuples()) {
    rightKeys.add(tupleKey(tuple));
  }

  if (leftKeys.size !== rightKeys.size) {
    return false;
  }

  for (const key of leftKeys) {
    if (!rightKeys.has(key)) {
      return false;
    }
  }

  return true;
}
