# TypeScript Type Safety Implementation Plan

## Goal
Add opt-in generic type parameters to enable:
- IDE autocomplete on tuple attributes
- Compile-time validation of attribute names
- Type transformation tracking through operator chains

## Core Changes

### 1. Generic Relation Interface (`src/types.ts`)

```typescript
export interface Relation<T extends Tuple = Tuple> {
  one(): T;
  toArray(): T[];

  // Preserve type
  restrict(p: TypedPredicate<T>): Relation<T>;
  where(p: TypedPredicate<T>): Relation<T>;

  // Transform type
  project<K extends keyof T>(attrs: K[]): Relation<Pick<T, K>>;
  allbut<K extends keyof T>(attrs: K[]): Relation<Omit<T, K>>;
  rename<R extends RenameMap<T>>(r: R): Relation<Renamed<T, R>>;
  extend<E extends Record<string, unknown>>(e: TypedExtension<T, E>): Relation<T & E>;
  constants<C extends Tuple>(c: C): Relation<T & C>;

  // Binary ops - combine types
  join<R extends Tuple>(right: RelationOperand<R>, keys?: JoinKeys<T, R>): Relation<Joined<T, R>>;
  left_join<R extends Tuple>(right: RelationOperand<R>, keys?: JoinKeys<T, R>): Relation<LeftJoined<T, R>>;
  cross_product<R extends Tuple>(right: RelationOperand<R>): Relation<T & R>;

  // Nesting
  group<K extends keyof T, As extends string>(attrs: K[], as: As): Relation<Grouped<T, K, As>>;
  ungroup<K extends keyof T>(attr: K): Relation<Ungrouped<T, K>>;
  // ...
}
```

### 2. Generic MemoryRelation Class (`src/Relation/Memory.ts`)

```typescript
export class MemoryRelation<T extends Tuple = Tuple> implements Relation<T> {
  constructor(private tuples: T[]) {}

  project<K extends keyof T>(attrs: K[]): MemoryRelation<Pick<T, K>> {
    return project(this, attrs as string[]) as MemoryRelation<Pick<T, K>>;
  }
  // ...
}
```

### 3. Generic Bmg Factory (`src/index.ts`)

```typescript
export function Bmg<T extends Tuple>(tuples: T[]): MemoryRelation<T>;
export function Bmg(tuples: Tuple[]): MemoryRelation<Tuple>;
export function Bmg<T extends Tuple = Tuple>(tuples: T[]): MemoryRelation<T> {
  return new MemoryRelation<T>(tuples);
}
```

### 4. Utility Types (`src/utility-types.ts` - new file)

```typescript
// Rename: { name: 'fullName' } transforms { name, age } to { fullName, age }
export type RenameMap<T> = { [K in keyof T]?: string };
export type Renamed<T, R extends RenameMap<T>> = {
  [K in keyof T as K extends keyof R ? (R[K] extends string ? R[K] : K) : K]: T[K];
};

// Join: combine left & right, remove duplicate keys from right
export type CommonKeys<L, R> = Extract<keyof L, keyof R>;
export type Joined<L, R> = L & Omit<R, CommonKeys<L, R>>;
export type LeftJoined<L, R> = L & Partial<Omit<R, CommonKeys<L, R>>>;

// Group/Ungroup
export type Grouped<T, K extends keyof T, As extends string> =
  Omit<T, K> & Record<As, Relation<Pick<T, K>>>;
export type Ungrouped<T, K extends keyof T> =
  T[K] extends Relation<infer N> ? Omit<T, K> & N : never;

// Wrap/Unwrap
export type Wrapped<T, K extends keyof T, As extends string> =
  Omit<T, K> & Record<As, Pick<T, K>>;
export type Unwrapped<T, K extends keyof T> =
  T[K] extends Record<string, unknown> ? Omit<T, K> & T[K] : never;

// Prefix/Suffix (template literal types)
export type Prefixed<T, P extends string, Ex extends keyof T = never> = {
  [K in keyof T as K extends Ex ? K : `${P}${K & string}`]: T[K];
};
```

### 5. Typed Predicates (`src/types.ts`)

```typescript
export type TypedPredicateFunc<T> = (t: T) => boolean;
export type TypedPredicate<T> = TypedPredicateFunc<T> | Partial<T>;
```

## Implementation Phases

### Phase 1: Foundation
1. Add `Relation<T = Tuple>` interface with generics
2. Add `MemoryRelation<T = Tuple>` class
3. Update `Bmg<T>()` factory
4. Type these operators first (highest value):
   - `one()`, `toArray()` - return `T` / `T[]`
   - `project()` - `Pick<T, K>`
   - `allbut()` - `Omit<T, K>`
   - `restrict()`, `where()`, `exclude()` - preserve `T` with typed predicate

### Phase 2: Structure-Changing Operators
- `extend()` - `T & E`
- `constants()` - `T & C`
- `rename()` - `Renamed<T, R>`
- `prefix()`, `suffix()` - template literal types

### Phase 3: Binary Operations
- `union()`, `minus()`, `intersect()` - require same `T`
- `join()` - `Joined<T, R>`
- `left_join()` - `LeftJoined<T, R>`
- `cross_product()` - `T & R`
- `matching()`, `not_matching()` - preserve `T`

### Phase 4: Nesting Operators
- `group()` - `Grouped<T, K, As>`
- `ungroup()` - `Ungrouped<T, K>`
- `wrap()` - `Wrapped<T, K, As>`
- `unwrap()` - `Unwrapped<T, K>`
- `image()` - adds `Relation<...>` attribute

### Phase 5: Complex Operators
- `summarize()` - infer result from aggregators
- `transform()` - preserve structure, optional value type tracking
- `autowrap()` - return `Relation<Tuple>` (dynamic, un-typeable)

## Backwards Compatibility

- Default type parameter `= Tuple` ensures existing untyped code compiles
- When `T = Tuple = Record<string, unknown>`, `keyof T = string`, so any string[] is accepted
- No breaking changes to existing API

## Files to Modify

| File | Changes |
|------|---------|
| `src/types.ts` | Add generics to `Relation`, typed predicates |
| `src/utility-types.ts` (new) | Utility types: `Renamed`, `Joined`, `Grouped`, etc. |
| `src/Relation/Memory.ts` | Add `<T>` parameter, update method signatures |
| `src/index.ts` | Update `Bmg` factory with type inference |
| `src/operators/_helpers.ts` | Generic `toOperationalOperand<T>` |

## Example Usage After Implementation

```typescript
// Opt-in: provide type for full type safety
interface Supplier {
  sid: string;
  name: string;
  status: number;
  city: string;
}

const suppliers = Bmg<Supplier>([
  { sid: 'S1', name: 'Smith', status: 20, city: 'London' },
]);

// IDE autocomplete: suggests 'sid', 'name', 'status', 'city'
const result = suppliers
  .project(['sid', 'name'])      // Relation<{ sid: string; name: string }>
  .rename({ name: 'fullName' })  // Relation<{ sid: string; fullName: string }>
  .extend({ upper: t => t.fullName.toUpperCase() }); // t.fullName autocompletes

// Compile error for invalid attributes
suppliers.project(['invalid']); // Error: 'invalid' not in keyof Supplier

// Untyped usage still works (backwards compatible)
const r = Bmg([{ a: 1 }]);  // Relation<Tuple>
r.project(['a']);           // Works, no validation
```

## Test Plan

### 1. Compile-Time Type Tests

Create `tests/types/relation.test-d.ts` using vitest's type testing:

```typescript
import { Bmg } from 'src';
import { expectTypeOf } from 'vitest';

interface Person { id: number; name: string; age: number }

describe('Type Safety', () => {
  const people = Bmg<Person>([{ id: 1, name: 'Alice', age: 30 }]);

  it('project narrows type to Pick<T, K>', () => {
    const result = people.project(['id', 'name']);
    expectTypeOf(result.one()).toEqualTypeOf<{ id: number; name: string }>();
  });

  it('rejects invalid attribute names', () => {
    // @ts-expect-error - 'invalid' is not a key of Person
    people.project(['invalid']);
  });

  it('restrict preserves type with typed predicate', () => {
    const result = people.restrict(t => t.age > 25);
    expectTypeOf(result.one()).toEqualTypeOf<Person>();
  });

  it('predicate function receives typed tuple', () => {
    people.restrict(t => {
      expectTypeOf(t.id).toBeNumber();
      expectTypeOf(t.name).toBeString();
      return true;
    });
  });

  it('join combines types correctly', () => {
    interface Order { orderId: number; personId: number; total: number }
    const orders = Bmg<Order>([]);
    const joined = people.join(orders, { id: 'personId' });
    expectTypeOf(joined.one()).toEqualTypeOf<{
      id: number; name: string; age: number; orderId: number; total: number
    }>();
  });

  it('rename transforms keys', () => {
    const renamed = people.rename({ name: 'fullName' });
    expectTypeOf(renamed.one()).toEqualTypeOf<{ id: number; fullName: string; age: number }>();
  });

  it('untyped usage still works', () => {
    const r = Bmg([{ a: 1 }]);  // Relation<Tuple>
    r.project(['a']);           // Should compile
    r.project(['anything']);    // Should compile (no validation when T=Tuple)
  });
});
```

### 2. Runtime Tests

All 152 existing tests must continue to pass without modification - validates backwards compatibility.

### 3. Type Test Coverage by Phase

| Phase | Type Tests |
|-------|-----------|
| Phase 1 | `project`, `allbut`, `restrict`, `one`, `toArray` |
| Phase 2 | `extend`, `constants`, `rename`, `prefix`, `suffix` |
| Phase 3 | `join`, `left_join`, `cross_product`, `union`, `minus` |
| Phase 4 | `group`, `ungroup`, `wrap`, `unwrap`, `image` |
| Phase 5 | `summarize`, `transform`, `autowrap` (escape hatch) |

### 4. Test File Structure

```
tests/
  types/
    relation.test-d.ts    # Core Relation<T> type tests
    operators.test-d.ts   # Operator type transformation tests
    utility-types.test-d.ts  # Utility type unit tests
```

## Limitations

- Function-based `rename()` loses type tracking (only object syntax typed)
- `autowrap()` returns `Relation<Tuple>` (dynamic structure)
- Requires TypeScript 4.1+ for template literal types
