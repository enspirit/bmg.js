import { OperationalOperand, Relation, RelationOperand, Renaming, RenamingFunc, Tuple, JoinKeys, AttrName } from "@/types";
import { MemoryRelation } from '@/sync/Relation';
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

/**
 * Generates a unique string key for a tuple, used for equality comparison and deduplication.
 * Handles nested relations by converting them to sorted tuple keys.
 *
 * @example
 * tupleKey({ name: 'Alice', age: 30 })
 * // => '[["age",30],["name","Alice"]]'
 *
 * @example
 * tupleKey({ id: 1, items: Bmg([{ x: 1 }, { x: 2 }]) })
 * // => '[["id",1],["items",[...]]]' (nested relation converted to sorted keys)
 */
export const tupleKey = (tuple: Tuple): string => {
  const entries = Object.entries(tuple).map(([k, v]) => [k, valueKey(v)]);
  return JSON.stringify(entries.sort(([a], [b]) => (a as string).localeCompare(b as string)));
}

/**
 * Removes duplicate tuples from an array, preserving order of first occurrence.
 * Uses tupleKey() for equality comparison.
 *
 * @example
 * deduplicate([
 *   { id: 1, name: 'Alice' },
 *   { id: 2, name: 'Bob' },
 *   { id: 1, name: 'Alice' },  // duplicate
 * ])
 * // => [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
 */
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

/**
 * Converts a RelationOperand (Relation or Tuple[]) to an OperationalOperand
 * that provides a uniform interface for iteration and output.
 *
 * @example
 * // With array input, output remains array
 * const op = toOperationalOperand([{ id: 1 }]);
 * [...op.tuples()];        // => [{ id: 1 }]
 * op.output([{ id: 2 }]);  // => [{ id: 2 }]
 *
 * @example
 * // With Relation input, output is a new Relation
 * const op = toOperationalOperand(Bmg([{ id: 1 }]));
 * [...op.tuples()];        // => [{ id: 1 }]
 * op.output([{ id: 2 }]);  // => Bmg([{ id: 2 }])
 */
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

/**
 * Converts a Renaming (object or function) to a RenamingFunc.
 *
 * @example
 * // Object renaming
 * const fn = toRenamingFunc({ name: 'fullName', age: 'years' });
 * fn('name');  // => 'fullName'
 * fn('age');   // => 'years'
 * fn('other'); // => 'other' (unchanged)
 *
 * @example
 * // Function renaming (passed through)
 * const fn = toRenamingFunc(attr => attr.toUpperCase());
 * fn('name'); // => 'NAME'
 */
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

// Join helpers

/**
 * Finds attribute names that exist in both left and right tuple arrays.
 * Used for natural joins when no explicit keys are provided.
 *
 * @example
 * const left = [{ id: 1, name: 'Alice', city: 'NYC' }];
 * const right = [{ city: 'NYC', country: 'USA' }];
 * getCommonAttrs(left, right);
 * // => ['city']
 *
 * @example
 * const left = [{ a: 1, b: 2 }];
 * const right = [{ b: 2, c: 3 }];
 * getCommonAttrs(left, right);
 * // => ['b']
 */
export const getCommonAttrs = (left: Tuple[], right: Tuple[]): AttrName[] => {
  if (left.length === 0 || right.length === 0) return [];
  const leftAttrs = new Set(Object.keys(left[0]));
  const rightAttrs = Object.keys(right[0]);
  return rightAttrs.filter(attr => leftAttrs.has(attr));
}

/**
 * Normalizes JoinKeys to a Record<AttrName, AttrName> mapping left attrs to right attrs.
 *
 * @example
 * // undefined => use common attributes
 * normalizeKeys(undefined, [{ id: 1, city: 'NYC' }], [{ city: 'NYC' }]);
 * // => { city: 'city' }
 *
 * @example
 * // Array of common attribute names
 * normalizeKeys(['city', 'country'], leftTuples, rightTuples);
 * // => { city: 'city', country: 'country' }
 *
 * @example
 * // Object mapping left attr to right attr
 * normalizeKeys({ city: 'location' }, leftTuples, rightTuples);
 * // => { city: 'location' }
 */
export const normalizeKeys = (keys: JoinKeys | undefined, leftTuples: Tuple[], rightTuples: Tuple[]): Record<AttrName, AttrName> => {
  if (!keys) {
    const common = getCommonAttrs(leftTuples, rightTuples);
    return common.reduce((acc, attr) => {
      acc[attr] = attr;
      return acc;
    }, {} as Record<AttrName, AttrName>);
  }
  if (Array.isArray(keys)) {
    return keys.reduce((acc, attr) => {
      acc[attr] = attr;
      return acc;
    }, {} as Record<AttrName, AttrName>);
  }
  return keys;
}

/**
 * Checks if two tuples match on the specified key mapping.
 *
 * @example
 * const keyMap = { city: 'location' };
 * tuplesMatch({ id: 1, city: 'NYC' }, { location: 'NYC', pop: 8 }, keyMap);
 * // => true (left.city === right.location)
 *
 * @example
 * const keyMap = { city: 'city' };
 * tuplesMatch({ city: 'NYC' }, { city: 'LA' }, keyMap);
 * // => false
 */
export const tuplesMatch = (left: Tuple, right: Tuple, keyMap: Record<AttrName, AttrName>): boolean => {
  for (const [leftAttr, rightAttr] of Object.entries(keyMap)) {
    if (left[leftAttr] !== right[rightAttr]) return false;
  }
  return true;
}

/**
 * Creates a string key from a tuple's join attributes for fast Set-based lookups.
 * Used by matching/not_matching for efficient semi-join operations.
 *
 * @example
 * const keyMap = { first: 'fname', last: 'lname' };
 *
 * // Left side uses left attr names (keys of keyMap)
 * matchKey({ id: 1, first: 'John', last: 'Doe' }, keyMap, 'left');
 * // => '"John"|"Doe"'
 *
 * // Right side uses right attr names (values of keyMap)
 * matchKey({ fname: 'John', lname: 'Doe', age: 30 }, keyMap, 'right');
 * // => '"John"|"Doe"'
 */
export const matchKey = (tuple: Tuple, keyMap: Record<AttrName, AttrName>, side: 'left' | 'right'): string => {
  const attrs = side === 'left' ? Object.keys(keyMap) : Object.values(keyMap);
  const values = attrs.map(attr => JSON.stringify(tuple[attr]));
  return values.join('|');
}

/**
 * Removes join key attributes from a right tuple when merging.
 * Used to avoid duplicate columns in join results.
 *
 * @example
 * const keyMap = { city: 'location' };
 * projectOutKeys({ location: 'NYC', country: 'USA', pop: 8 }, keyMap);
 * // => { country: 'USA', pop: 8 }  (location removed)
 *
 * @example
 * const keyMap = { a: 'a', b: 'b' };
 * projectOutKeys({ a: 1, b: 2, c: 3 }, keyMap);
 * // => { c: 3 }  (a and b removed)
 */
export const projectOutKeys = (tuple: Tuple, keyMap: Record<AttrName, AttrName>): Tuple => {
  const rightKeys = new Set(Object.values(keyMap));
  const result: Tuple = {};
  for (const [attr, value] of Object.entries(tuple)) {
    if (!rightKeys.has(attr)) {
      result[attr] = value;
    }
  }
  return result;
}
