import { OperationalOperand, Relation, RelationOperand, Renaming, RenamingFunc, Tuple } from "@/types";
import { MemoryRelation } from '@/Relation';
import { isRelation } from "./isRelation";

export const tupleKey = (tuple: Tuple): string => {
  return JSON.stringify(Object.entries(tuple).sort(([a], [b]) => a.localeCompare(b)));
}

export const deduplicate = (tuples: Tuple[]): Tuple[] => {
  const seen = new Set<string>();
  const result: Tuple[] = [];
  for (const tuple of tuples) {
    const key = tupleKey(tuple);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(tuple);
    }
  }
  return result;
}

export const toOperationalOperand = (operand: RelationOperand): OperationalOperand => {
  if (Array.isArray(operand)) {
    return {
      tuples: () => operand,
      output: (tuples) => tuples,
    };
  } else if (isRelation(operand)) {
    return {
      tuples: () => (operand as Relation).toArray(),
      output: (tuples) => new MemoryRelation(tuples),
    };
  } else {
    throw `Unable to iterate ${operand}`
  }
}

export const toRenamingFunc = (renaming: Renaming): RenamingFunc => {
  if (typeof(renaming) === 'function') {
    return renaming;
  } else {
    return (attr) => renaming[attr] || attr;
  }
}

export const error = (msg: string) => {
  throw(msg);
}
