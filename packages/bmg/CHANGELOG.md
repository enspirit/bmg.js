# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - Unreleased

### Changed

- **Monorepo structure**: Repository converted to pnpm workspace monorepo. Core package moved to `packages/bmg/`.
- **Build tool**: Replaced microbundle with tsup for more reliable TypeScript builds.
- **Exports**: Updated package exports to standard ESM/CJS dual format (`.js`/`.cjs`).
- **Structured predicates**: `restrict()`, `where()`, and `exclude()` now accept structured predicate AST nodes from `@enspirit/predicate` alongside plain objects and functions.

### Fixed

- **`@enspirit/bmg-sql`: join-alias bug**: fixed a long-standing bug where INNER / LEFT join ON clauses emitted both operands qualified as `t1`, producing incorrect SQL (`ON t1.sid = t1.sid`). The fix also affects:
  - Nested joins under `matching()` / `not_matching()` — the inner `ON` was previously not requalified when the enclosing semi-join was.
  - Multi-way joins (`a.join(b, [x]).join(c, [y])`) — each key's qualifier is now resolved from the select list, so a key that lives on a nested table resolves to that table's alias.
  - `restrict()` after a join on a right-side attribute — WHERE qualifiers now resolve from the select list instead of defaulting to the leftmost table alias.

- **`distinct_count` aggregator**: new aggregator name alongside `count`/`sum`/`avg`/`min`/`max`/`collect`. Counts distinct non-null values of an attribute. Usage: `r.summarize(['city'], { n: { op: 'distinct_count', attr: 'sid' } })`. In `@enspirit/bmg-sql` this compiles to `COUNT(DISTINCT col)`.

- **`page` operator**: pagination on `Relation` and `AsyncRelation`. Sorts by an ordering then slices to a page. Default `pageSize` is 20, pages are 1-indexed. Usage: `r.page(['name', 'sid'], 2, { pageSize: 10 })` or with direction: `r.page([['status', 'desc'], 'name'], 1)`. New types: `OrderingDirection`, `Ordering`, `TypedOrdering<T>`, `PageOptions`. In `@enspirit/bmg-sql` this compiles to `ORDER BY ... LIMIT ... OFFSET ...`.

- **`BmgSql.fromSubquery` factory** (in `@enspirit/bmg-sql`): build a relation from an opaque raw-SQL fragment, with optional bind params. Usage: `BmgSql.fromSubquery(adapter, 'SELECT sid FROM suppliers WHERE city = ?', ['sid'], { params: ['London'] })`. New AST node `RawSubqueryRef` carries the fragment verbatim in FROM. Composes with all existing operators.

### Added

- **`allbut` option for `group` operator**: New `{ allbut: true }` option inverts the meaning of the attrs parameter
  - Without allbut: `group(['item', 'qty'], 'items')` groups `item` and `qty` into nested relation
  - With allbut: `group(['city'], 'people', { allbut: true })` keeps `city` at top level, groups all other attributes
  - Matches Ruby BMG syntax: `r.group([:city], { allbut: true })`

- **`allbut` option for `wrap` operator**: New `{ allbut: true }` option inverts the meaning of the attrs parameter
  - Without allbut: `wrap(['status', 'city'], 'details')` wraps `status` and `city` into nested object
  - With allbut: `wrap(['sid', 'name'], 'details', { allbut: true })` keeps `sid` and `name` at top level, wraps all other attributes
  - Matches Ruby BMG syntax: `r.wrap([:sid, :name], { allbut: true })`

- Extended DEE/DUM edge case tests to cover all remaining operators:
  - Filtering: `restrict`, `where`, `exclude`
  - Projection: `allbut`
  - Extension: `extend`, `constants`
  - Renaming: `rename`, `prefix`, `suffix`
  - Set operations: `union`, `minus`, `intersect`
  - Aggregation: `summarize`
  - Grouping: `group`, `ungroup`
  - Wrapping: `wrap`, `unwrap`, `autowrap`
  - Transformation: `transform`

## [1.1.1] - 2026-01-11

### Added

- **Border Styles for toText**: New `border` option for customizable table borders
  - Built-in styles: `'ascii'` (default), `'single'`, `'double'`, `'rounded'`
  - Nested relations inherit border style from parent table

## [1.1.0] - 2026-01-10

### Added

- **Text Rendering**: New `toText()` method on `Relation` for ASCII table output
  - Renders relations as formatted ASCII tables
  - Supports nested relations (from `group`, `image`) as nested tables within cells
  - Handles special values: `null`, `undefined`, `Date`, objects, arrays
  - Options: `floatPrecision` for decimal places, `trimAt` for line width limiting
  - Properly renders DEE (one tuple, no attributes) and DUM (no tuples, no attributes)

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
