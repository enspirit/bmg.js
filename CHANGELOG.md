# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - Unreleased

### Added

- **Async Relations**: New `AsyncRelation<T>` interface and `BaseAsyncRelation<T>` implementation for streaming data sources using `AsyncIterable`
  - Factory function `AsyncBmg()` to create async relations from async iterables or promises
  - Async versions of all core operators: `restrict`, `where`, `exclude`, `project`, `allbut`, `extend`, `rename`, `prefix`, `suffix`, `constants`
  - Async set operations: `union`, `minus`, `intersect`
  - Async join operations: `join`, `left_join`, `cross_product`, `cross_join`, `matching`, `not_matching`
  - Async nesting operators: `image`, `group`, `ungroup`, `wrap`, `unwrap`
  - Async aggregation: `summarize`
  - Async utility operators: `one`, `toArray`, `yByX`
  - Exported via `asyncOps` namespace and `AsyncBmg` factory

- **Text Rendering**: New `toText()` operator for ASCII table output
  - Renders relations as formatted ASCII tables
  - Supports nested relations (from `group`, `image`) as nested tables within cells
  - Handles special values: `null`, `undefined`, `Date`, objects, arrays
  - Options: `floatPrecision` for decimal places, `trimAt` for line width limiting
  - Available as standalone function and method on `Relation`
  - Properly renders DEE (one tuple, no attributes) and DUM (no tuples, no attributes)

- Added type guard signature to `isRelation()` for proper TypeScript type narrowing

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
