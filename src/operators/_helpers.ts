import { OperationalOperand, Relation, RelationOperand, Renaming, RenamingFunc, Tuple } from "@/types";
import { MemoryRelation } from '@/Relation';
import { isRelation } from "./isRelation";

const valueKey = (value: unknown): unknown => {
  if (isRelation(value)) {
    // For nested relations, convert to sorted array of tuple keys for comparison
    const tuples = (value as Relation).toArray();
    const keys = tuples.map(t => tupleKey(t)).sort();
    return keys;
  }
  return value;
}

export const tupleKey = (tuple: Tuple): string => {
  const entries = Object.entries(tuple).map(([k, v]) => [k, valueKey(v)]);
  return JSON.stringify(entries.sort(([a], [b]) => (a as string).localeCompare(b as string)));
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
