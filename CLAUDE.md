# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Bmg.js?

A TypeScript implementation of BMG, a relational algebra originally implemented in Ruby:
- https://github.com/enspirit/bmg
- https://www.relational-algebra.dev/

The aim is to provide relational algebra operators for arrays of JavaScript objects, NOT to implement an SQL compiler.

## Repository Structure

This is a pnpm workspace monorepo:
```
packages/
├── bmg/          @enspirit/bmg-js  — core relational algebra (in-memory)
```

## Commands

```bash
# From root (runs across all packages):
pnpm test             # Run all tests
pnpm build            # Build all packages

# From packages/bmg/:
pnpm test             # Run bmg tests (vitest)
pnpm test:watch       # Run tests in watch mode
pnpm build            # Build (generates lib-definitions, bundles with tsup, and types)
```

Run a single test file:
```bash
npx vitest run packages/bmg/tests/operators/restrict.test.ts
```

## Architecture

**Entry point:** `packages/bmg/src/index.ts` - Exports `Bmg` factory function, all operators, and types

**Core abstractions:**
- `Relation<T>` interface (`packages/bmg/src/types.ts`) - Defines all relational operators with full TypeScript generics
- `MemoryRelation<T>` (`packages/bmg/src/sync/Relation/Memory.ts`) - In-memory implementation wrapping an array of tuples
- `AsyncRelation<T>` (`packages/bmg/src/async/types.ts`) - Async version for streaming data sources
- `BaseAsyncRelation<T>` (`packages/bmg/src/async/Relation/Base.ts`) - Async implementation using AsyncIterable

**Operators pattern:** Each operator exists as:
1. Standalone function in `packages/bmg/src/sync/operators/<name>.ts` - Works on arrays directly
2. Method on `MemoryRelation` - Delegates to standalone function
3. Async version in `packages/bmg/src/async/operators/<name>.ts` for AsyncRelation

**Test fixtures:** `packages/bmg/tests/fixtures.ts` provides standard SUPPLIERS relation for tests.

## Relational Algebra Rules

1. Relations NEVER have duplicates
2. Order of tuples and order of attributes in a tuple are not important semantically
3. Relations are sets of tuples; tuples are sets of (attr, value) pairs
4. Two relations are equal if they have the exact same set of tuples
5. `DEE` is the relation with no attribute and one tuple
6. `DUM` is the relation with no attribute and no tuple

## Unit Test Guidelines

- Use purely relational tests: compare obtained relation with expected using `isEqual`
- NEVER access the "first" tuple (there is no ordering)
- Use `r.restrict(...predicate...).one()` to select a specific tuple for testing
- Tests should cover `DUM` and `DEE`

## Development rules

### Todolist

* Always check .claude/tasks for .md files
* Work on ONGOING tasks by default
* If you're asked to work on a TODO task, move it to ONGOING first
* Track your own subtasks in these .md task files
* You MUST commit those .md task files if you change them as a result of your work

### When adding an operator (relational or not)

- Add each operator with unit tests
- One commit per operator
- An operator MUST ALWAYS be provided on `Relation` and `AsyncRelation`
- Update README when adding operators
- Tests MUST succeed at all times
- Build MUST succeed at all times (check for typescript errors)

### Commit and release flow

- When you commit, you MUST update the CHANGELOG
- The CHANGELOG is end-user oriented
- Track new features and briefly tells which APIs are improved
- You MUST clearly identify BROKEN apis too

## Implemented Operators

**Relational:** restrict, where, exclude, project, allbut, extend, rename, prefix, suffix, constants, union, minus, intersect, matching, not_matching, join, left_join, cross_product, cross_join, image, summarize, group, ungroup, wrap, unwrap, autowrap, transform

**Non-relational:** one, yByX, toArray, isRelation, isEqual, toText
