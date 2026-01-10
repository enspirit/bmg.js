import { describe, it, expect } from 'vitest';
import * as BmgExports from 'src';

/**
 * This test ensures the public API exports don't accidentally change.
 * Removing any of these exports would be a breaking change requiring a major version bump.
 */
describe('Public API exports', () => {
  // Factory & Constants
  const factoryAndConstants = [
    'Bmg',
    'DEE',
    'DUM',
    'LIB_DEFINITIONS',
  ] as const;

  // Standalone functions
  const standaloneFunctions = [
    'toText',
    'isRelation',
    'isEqual',
  ] as const;

  // Operators
  const operators = [
    // Filtering
    'restrict',
    'where',
    'exclude',
    // Projection
    'project',
    'allbut',
    // Extension
    'extend',
    'constants',
    // Renaming
    'rename',
    'prefix',
    'suffix',
    // Set ops
    'union',
    'minus',
    'intersect',
    // Semi-joins
    'matching',
    'not_matching',
    // Joins
    'join',
    'left_join',
    'cross_product',
    'cross_join',
    // Nesting
    'group',
    'ungroup',
    'wrap',
    'unwrap',
    'image',
    'summarize',
    'autowrap',
    // Transform
    'transform',
    // Terminal
    'one',
    'yByX',
  ] as const;

  // All expected exports
  const allExpectedExports = [
    ...factoryAndConstants,
    ...standaloneFunctions,
    ...operators,
  ];

  it.each(allExpectedExports)('exports %s', (name) => {
    expect(BmgExports).toHaveProperty(name);
  });

  it('Bmg.isRelation is available', () => {
    expect(BmgExports.Bmg.isRelation).toBe(BmgExports.isRelation);
  });
});
