# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Bmg.js?

A TypeScript implementation of BMG, a relational algebra originally implemented in Ruby:
- https://github.com/enspirit/bmg
- https://www.relational-algebra.dev/

The aim is to provide relational algebra operators for arrays of JavaScript objects, NOT to implement an SQL compiler.

## Commands

```bash
npm run test          # Run all tests (vitest)
npm run test:watch    # Run tests in watch mode
npm run build         # Build the library (generates lib-definitions, bundles, and types)
```

Run a single test file:
```bash
npx vitest run tests/operators/restrict.test.ts
```

## Architecture

**Entry point:** `src/index.ts` - Exports `Bmg` factory function, all operators, and types

**Core abstractions:**
- `Relation<T>` interface (`src/types.ts`) - Defines all relational operators with full TypeScript generics
- `MemoryRelation<T>` (`src/Relation/Memory.ts`) - In-memory implementation wrapping an array of tuples
- `AsyncRelation<T>` (`src/async-types.ts`) - Async version for streaming data sources
- `BaseAsyncRelation<T>` (`src/AsyncRelation/Base.ts`) - Async implementation using AsyncIterable

**Operators pattern:** Each operator exists as:
1. Standalone function in `src/operators/<name>.ts` - Works on arrays directly
2. Method on `MemoryRelation` - Delegates to standalone function
3. Async version in `src/async-operators/<name>.ts` for AsyncRelation

**Test fixtures:** `tests/fixtures.ts` provides standard SUPPLIERS relation for tests.

## Relational Algebra Rules

1. Relations NEVER have duplicates
2. Order of tuples and order of attributes in a tuple are not important semantically
3. Relations are sets of tuples; tuples are sets of (attr, value) pairs
4. Two relations are equal if they have the exact same set of tuples

## Unit Test Guidelines

- Use purely relational tests: compare obtained relation with expected using `isEqual`
- NEVER access the "first" tuple (there is no ordering)
- Use `r.restrict(...predicate...).one()` to select a specific tuple for testing

## Development Flow

- Add each operator with unit tests
- One commit per operator
- Update README when adding operators
- Tests MUST succeed at all times
- Build MUST succeed at all times (check for typescript errors)

## Implemented Operators

**Relational:** restrict, where, exclude, project, allbut, extend, rename, prefix, suffix, constants, union, minus, intersect, matching, not_matching, join, left_join, cross_product, cross_join, image, summarize, group, ungroup, wrap, unwrap, autowrap, transform

**Non-relational:** one, yByX, toArray, isRelation, isEqual, toText

## TODO

- [ ] sort - Order tuples by attributes
- [ ] page - Pagination (offset + limit)
- [ ] size, empty, first, exists - Utility helpers
