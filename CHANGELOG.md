# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-10

### Added

- **Text Rendering**: New `toText()` method on `Relation` for ASCII table output
  - Renders relations as formatted ASCII tables
  - Supports nested relations (from `group`, `image`) as nested tables within cells
  - Handles special values: `null`, `undefined`, `Date`, objects, arrays
  - Options: `floatPrecision` for decimal places, `trimAt` for line width limiting
  - Properly renders DEE (one tuple, no attributes) and DUM (no tuples, no attributes)

- **Border Styles for toText**: New `border` option for customizable table borders
  - Built-in styles: `'ascii'` (default), `'single'`, `'double'`, `'rounded'`
  - Nested relations inherit border style from parent table

- Added type guard signature to `isRelation()` for proper TypeScript type narrowing

- **DEE and DUM constants**: Fundamental relational algebra constants
  - `DEE`: Relation with no attributes and one tuple (identity element for join)
  - `DUM`: Relation with no attributes and no tuples (identity element for union)
  - Added DEE/DUM edge case tests for `project`, `join`, `left_join`, `matching`, `not_matching`, and `image` operators

### Internal (not part of public API)

- Reorganized sync implementation into `src/sync/` directory to cleanly separate sync/async code
  - Backward-compatible re-exports maintained at `src/operators/` and `src/Relation/`
- Async relations implementation available via `src/async` for internal use
  - `AsyncRelation<T>` interface and `BaseAsyncRelation<T>` implementation
  - Not yet stable for public consumption

## [1.0.2] - 2026-01-08

### Added

- `LIB_DEFINITIONS` export: a string constant containing all TypeScript type definitions, useful for playground editors and type-checking in web workers
- Generator script (`scripts/generate-lib-definitions.ts`) to regenerate `lib-definitions.ts` from `types.ts`
- Typed join keys (`TypedJoinKeysArray`, `TypedJoinKeysObject`) for compile-time validation of join keys in `join`, `left_join`, `matching`, `not_matching`, and `image` operators

### Changed

- Merged `utility-types.ts` into `types.ts` for simpler maintenance (no API changes)

### Fixed

- Declaration files now output to correct path (`dist/index.d.ts` instead of `dist/src/src/index.d.ts`)

## [1.0.1] - 2026-01-07

### Changed

- Upgraded vitest from v1.4.0 to v4.0.16

### Fixed

- Added `files` field to package.json to include `dist` and `src` in published package

## [1.0.0] - 2026-01-07

### Added

- Initial release
- Core relational operators: restrict, where, exclude, project, allbut, extend, rename, prefix, suffix, constants
- Set operations: union, minus, intersect
- Join operations: join, left_join, cross_product, cross_join, matching, not_matching
- Nesting & grouping: image, group, ungroup, wrap, unwrap, autowrap
- Aggregation: summarize with count, sum, min, max, avg, collect
- Transformation: transform
- Non-relational: one, yByX, toArray, isRelation, isEqual
- Full TypeScript support with generic types
