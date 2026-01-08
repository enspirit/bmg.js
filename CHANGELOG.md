# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-01-08

### Added

- `LIB_DEFINITIONS` export: a string constant containing all TypeScript type definitions, useful for playground editors and type-checking in web workers
- Generator script (`scripts/generate-lib-definitions.ts`) to regenerate `lib-definitions.ts` from `types.ts`

### Changed

- Merged `utility-types.ts` into `types.ts` for simpler maintenance (no API changes)

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
