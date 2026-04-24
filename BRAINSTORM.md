# Brainstorm: SQL Database Targeting for bmg.js

## Context

bmg.js currently operates in-memory only (`MemoryRelation<T>` wrapping `T[]`
and `BaseAsyncRelation<T>` wrapping `AsyncIterable<T>`). The Ruby version
(`bmg`) has mature SQL support through a layered architecture:

- `Bmg::Sql::Relation` — holds an S-expression AST representing SQL
- `Bmg::Sequel::Relation` — extends the above, adds database execution via
  Sequel ORM
- ~20 **Processor** classes (one per operator) that rewrite the AST
- A **Translator** that converts the AST to Sequel dataset calls
- Graceful **fallback to in-memory** when an operation can't be compiled to SQL

The goal: bring similar capabilities to bmg.js so that relational algebra
expressions can be compiled to SQL and executed against real databases.

---

## 1. Architecture Overview: What the Ruby Version Does

```
Algebra API (restrict, project, join, ...)
            |
    _operation() template method
            |
    Processor (rewrites S-expression AST)
            |
    ┌───────────────────────────────────┐
    │ Compilable to SQL?                │
    │ YES → new Sql::Relation(new AST)  │
    │ NO  → Operator::* (in-memory)     │
    └───────────────────────────────────┘
            |
    On iteration (.each):
        Translator converts AST → Sequel dataset → SQL string → DB
```

Key design properties:
- **Lazy**: algebra calls build an AST, never touch the DB
- **Optimistic push-down**: each operator _tries_ SQL compilation, falls back
  to in-memory transparently
- **Compatibility check**: binary operators (join, union) verify both operands
  target the same database before merging ASTs
- **S-expression grammar**: a formal grammar (`grammar.sexp.yml`) defines valid
  AST shapes, enforced by the Sexpr library

---

## 2. Key Design Decisions for bmg.js

### 2.1 SQL AST Representation

**Ruby approach:** S-expressions (nested arrays) + Sexpr library for
validation and rewriting.

**Options for JS:**

**(A) Typed AST nodes (recommended)**
Define TypeScript discriminated unions for each SQL construct:

```typescript
type SqlExpr =
  | SelectExpr
  | UnionExpr
  | ExceptExpr
  | IntersectExpr
  | WithExpr;

interface SelectExpr {
  kind: 'select';
  quantifier: 'all' | 'distinct';
  selectList: SelectItem[];
  from: FromClause;
  where?: Predicate;
  groupBy?: ColumnRef[];
  orderBy?: OrderByTerm[];
  limit?: number;
  offset?: number;
}

interface SelectItem {
  expr: ScalarExpr;       // qualified_name, literal, summarizer, func_call
  alias: string;
}

// ... etc
```

Pros: full TypeScript type safety, IDE support, compile-time correctness.
Cons: more verbose than S-expressions, more code to write.

**(B) Plain nested arrays (like Ruby)**
Mirror the S-expression approach with `['select', quantifier, selectList, ...]`.

Pros: closer to Ruby, easy to port processors.
Cons: no type safety, easy to get wrong, hard to refactor.

**(C) Builder/fluent API that produces an AST**
A `SqlBuilder` that constructs typed AST nodes:

```typescript
builder.selectFrom('suppliers', 't1')
  .where(pred.eq('t1.city', 'London'))
  .project(['sid', 'sname'])
```

Pros: nice DX. Cons: may conflate building with representation.

**Recommendation:** Option (A) for the AST, with a Builder helper (C) for
constructing nodes ergonomically. This gives us type safety AND convenience.

### 2.2 Predicate Representation

The Ruby version depends on the external `predicate` gem (a full boolean
algebra library with its own AST and SQL compilation).

bmg.js currently only has `toPredicateFunc` which converts predicates to JS
functions — opaque, not compilable.

**Options:**

**(A) Structured predicate AST (recommended)**
Define a predicate algebra as TypeScript types:

```typescript
type SqlPredicate =
  | { kind: 'eq'; left: ScalarExpr; right: ScalarExpr }
  | { kind: 'neq'; left: ScalarExpr; right: ScalarExpr }
  | { kind: 'lt'; left: ScalarExpr; right: ScalarExpr }
  | { kind: 'gt'; left: ScalarExpr; right: ScalarExpr }
  | { kind: 'and'; operands: SqlPredicate[] }
  | { kind: 'or'; operands: SqlPredicate[] }
  | { kind: 'not'; operand: SqlPredicate }
  | { kind: 'in'; left: ScalarExpr; values: unknown[] }
  | { kind: 'exists'; subquery: SqlExpr }
  | { kind: 'tautology' }
  | { kind: 'contradiction' };
```

**(B) Reuse an existing library**
Something like `@databases/sql` or `knex`'s query builder internally.

**Decision:** Standalone `@enspirit/predicate` package (mirrors the Ruby
`predicate` gem). This package owns the AST, builder helpers, evaluation
(running predicates against JS objects), and SQL compilation.

```typescript
import { Pred } from '@enspirit/predicate';

// These return predicate AST nodes, not functions:
Pred.eq('city', 'London')
Pred.and(Pred.gt('status', 10), Pred.neq('sname', 'Blake'))

// Can be evaluated against a JS object (used by MemoryRelation fallback):
const p = Pred.gt('status', 10);
evaluate(p, { status: 20 })  // → true

// Can be compiled to parameterized SQL (used by SqlRelation):
compile(p, dialect)  // → { sql: 't1.status > $1', params: [10] }
```

Both `MemoryRelation` and `SqlRelation` accept structured predicates in
`.restrict()`. Plain objects `{ city: 'London' }` are auto-converted to
`Pred.eq()`. JS functions still work but trigger fallback to in-memory
(they can't be compiled to SQL).

### 2.3 The Relation Class Hierarchy

**Decision: async only for SQL relations.**

**Current bmg.js:**
```
Relation<T> (interface)
  └── MemoryRelation<T> (class, wraps T[])

AsyncRelation<T> (interface)
  └── BaseAsyncRelation<T> (class, wraps AsyncIterable<T>)
```

**Proposed addition:**
```
Relation<T> (interface) — unchanged
  └── MemoryRelation<T>  — unchanged

AsyncRelation<T> (interface) — unchanged
  ├── BaseAsyncRelation<T>  — unchanged
  └── SqlRelation<T>        — new, holds SqlExpr AST + DatabaseAdapter
```

`SqlRelation<T>` implements `AsyncRelation<T>` and:
- Stores a `SqlExpr` AST + a `SqlBuilder` + a database adapter reference
- Implements every `AsyncRelation<T>` method by rewriting the AST (like Ruby's
  `_operation` methods)
- Falls back to `BaseAsyncRelation` (in-memory) when an operation can't be
  compiled to SQL
- Implements `toArray()` by compiling AST → SQL string → execute → rows
- Implements `[Symbol.asyncIterator]()` using cursor-based streaming for large
  result sets
- Implements `one()`, `toText()`, etc. on top of iteration

### 2.4 Database Adapter Layer

The Ruby version uses Sequel as its sole database driver. For JS, we need to
support multiple drivers.

**Option: abstract adapter interface**

```typescript
interface DatabaseAdapter {
  /** Execute a SQL query and return rows */
  query<T = Tuple>(sql: string, params?: unknown[]): Promise<T[]>;

  /** Execute a SQL query and return row count (for DML) */
  execute(sql: string, params?: unknown[]): Promise<number>;

  /** Get the SQL dialect for this connection */
  dialect: SqlDialect;
}
```

Concrete adapters (each in its own package):
- `@enspirit/bmg-pg` — `PostgresAdapter` (wrapping `pg` or `postgres`)
- `@enspirit/bmg-sqlite` — `SqliteAdapter` (wrapping `better-sqlite3`)
- `@enspirit/bmg-mysql` — `MysqlAdapter` (wrapping `mysql2`)

Each adapter must also support cursor-based streaming via `AsyncIterable` for
large result sets (e.g., Postgres cursors, SQLite step-by-step iteration).

```typescript
interface DatabaseAdapter {
  /** Execute a SQL query and return all rows */
  query<T = Tuple>(sql: string, params?: unknown[]): Promise<T[]>;

  /** Execute a SQL query and stream rows via cursor */
  stream<T = Tuple>(sql: string, params?: unknown[]): AsyncIterable<T>;

  /** Get the SQL dialect for this connection */
  dialect: SqlDialect;
}
```

### 2.5 SQL Dialect Handling

Different databases have different SQL syntax (quoting, LIMIT/OFFSET, type
casting, boolean handling, etc.).

```typescript
interface SqlDialect {
  quoteIdentifier(name: string): string;   // "name" vs `name` vs [name]
  quoteLiteral(value: unknown): string;
  supportsReturning: boolean;
  supportsCTE: boolean;
  limitOffsetSyntax: 'limit-offset' | 'top' | 'fetch-first';
  castSyntax(expr: string, type: string): string;
}
```

Pre-built dialects: `PostgresDialect`, `SqliteDialect`, `MysqlDialect`.

### 2.6 SQL Compilation (AST → SQL string)

A `compile` function that walks the typed AST and produces a SQL string:

```typescript
function compile(expr: SqlExpr, dialect: SqlDialect): { sql: string; params: unknown[] }
```

Using parameterized queries (not string interpolation) for safety. The compiler
is a recursive pattern-match on the discriminated union — straightforward in
TypeScript.

---

## 3. Processor Architecture (Operator → AST Rewrite)

In Ruby, each operator has a `Processor` class that rewrites the S-expression.
In JS, these become functions that transform `SqlExpr` nodes:

```typescript
// Each processor takes an AST and returns a modified AST
type SqlProcessor = (expr: SqlExpr, builder: SqlBuilder) => SqlExpr;

// Example: restrict processor
function processWhere(
  expr: SqlExpr,
  predicate: SqlPredicate,
  builder: SqlBuilder
): SqlExpr {
  if (expr.kind === 'select') {
    return {
      ...expr,
      where: expr.where
        ? { kind: 'and', operands: [expr.where, predicate] }
        : predicate,
    };
  }
  // For non-select (union, etc.), wrap in subquery first
  return processWhere(builder.fromSelf(expr), predicate, builder);
}
```

Processors needed (mapping from Ruby):
| Ruby Processor    | JS equivalent       | Notes                            |
|-------------------|---------------------|----------------------------------|
| Clip              | processProject      | project + allbut + DISTINCT      |
| Distinct          | processDistinct     | Add DISTINCT when key not preserved |
| Where             | processWhere        | Add/merge WHERE clause           |
| Join              | processJoin         | INNER JOIN / LEFT JOIN           |
| SemiJoin          | processSemiJoin     | EXISTS / NOT EXISTS subquery     |
| Merge             | processMerge        | UNION / EXCEPT / INTERSECT       |
| Rename            | processRename       | Column aliasing                  |
| Extend            | processExtend       | Computed columns (symbol-only)   |
| Constants         | processConstants    | Literal columns                  |
| Summarize         | processSummarize    | GROUP BY + aggregate functions   |
| OrderBy           | processOrderBy      | ORDER BY                         |
| LimitOffset       | processLimitOffset  | LIMIT / OFFSET                   |
| Transform         | processTransform    | CAST (scalar types only)         |
| Requalify         | processRequalify    | Re-alias tables for binary ops   |
| FromSelf          | processFromSelf     | Wrap in subquery (CTE)           |
| Flatten           | processFlatten      | Flatten CTEs when not supported  |

---

## 4. Fallback Strategy: SQL ↔ Memory Boundary

The most elegant aspect of Ruby bmg is transparent fallback. When an operator
can't compile to SQL, it materializes the SQL result and continues in-memory.

**Approach for bmg.js:**

```typescript
class SqlRelation<T> implements AsyncRelation<T> {

  restrict(p: TypedPredicate<T>): AsyncRelation<T> {
    // Case 1: structured predicate → push to SQL
    if (isStructuredPredicate(p)) {
      const newExpr = processWhere(this.expr, compilePredicate(p), this.builder);
      return new SqlRelation(this.adapter, newExpr, this.builder);
    }
    // Case 2: plain object → convert to eq predicates → push to SQL
    if (isPlainObject(p)) {
      const pred = objectToPredicate(p);
      const newExpr = processWhere(this.expr, pred, this.builder);
      return new SqlRelation(this.adapter, newExpr, this.builder);
    }
    // Case 3: JS function → can't compile, fall back to async in-memory
    return this.toAsyncMemoryRelation().restrict(p);
  }

  // Materialize SQL result into async in-memory relation
  private toAsyncMemoryRelation(): BaseAsyncRelation<T> {
    const self = this;
    async function* generate() {
      for await (const row of self) yield row;
    }
    return new BaseAsyncRelation(generate());
  }

  // Cursor-based streaming
  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    const { sql, params } = compile(this.expr, this.adapter.dialect);
    yield* this.adapter.stream<T>(sql, params);
  }
}
```

**Binary operators** (join, union, etc.) check compatibility:

```typescript
join<R>(right: AsyncRelationOperand<R>, keys?: ...): AsyncRelation<Joined<T, R>> {
  if (right instanceof SqlRelation && right.adapter === this.adapter) {
    // Both target same DB → merge ASTs
    const rightExpr = processRequalify(right.expr, this.builder);
    const newExpr = processJoin(this.expr, rightExpr, keys, this.builder);
    return new SqlRelation(this.adapter, newExpr, this.builder);
  }
  // Different sources → materialize both, join in memory
  return this.toAsyncMemoryRelation().join(right, keys);
}
```

**Decision: async only.** SQL relations implement `AsyncRelation<T>`. This is
honest about the I/O nature of databases and aligns with the existing async
infrastructure. No sync SQL variant.

---

## 5. Package Structure

**Decision: monorepo with separate packages.**

```
packages/
├── bmg/                 @enspirit/bmg          — current library (in-memory)
├── predicate/           @enspirit/predicate    — standalone predicate algebra
├── bmg-sql/             @enspirit/bmg-sql      — SQL AST, processors, compiler, SqlRelation
├── bmg-pg/              @enspirit/bmg-pg       — Postgres adapter
├── bmg-sqlite/          @enspirit/bmg-sqlite   — SQLite adapter
└── bmg-mysql/           @enspirit/bmg-mysql    — MySQL adapter
```

Dependency graph:
```
@enspirit/predicate          (standalone, no deps on bmg)
        ↑
@enspirit/bmg                (depends on predicate for structured predicates)
        ↑
@enspirit/bmg-sql            (depends on bmg + predicate; defines SqlRelation, AST, compiler)
        ↑
@enspirit/bmg-pg             (depends on bmg-sql + pg)
@enspirit/bmg-sqlite         (depends on bmg-sql + better-sqlite3)
@enspirit/bmg-mysql          (depends on bmg-sql + mysql2)
```

The monorepo can use pnpm workspaces (already the package manager in use).

---

## 6. Entry Point / User API

```typescript
import { Bmg } from '@enspirit/bmg';
import { Pred } from '@enspirit/predicate';
import { BmgSql } from '@enspirit/bmg-sql';
import { PostgresAdapter } from '@enspirit/bmg-pg';

// In-memory (existing, unchanged)
const mem = Bmg([{ id: 1, name: 'Alice' }]);

// SQL-backed (returns AsyncRelation<Supplier>)
const adapter = new PostgresAdapter({ connectionString: '...' });
const suppliers = BmgSql<Supplier>(adapter, 'suppliers');

// Same algebra API — all lazy, builds AST
const london = suppliers
  .restrict({ city: 'London' })        // plain object → compiled to SQL
  .project(['sid', 'sname']);

// Terminal — compiles and executes SQL against the database
const rows = await london.toArray();
// Generated: SELECT t1.sid, t1.sname FROM suppliers t1 WHERE t1.city = 'London'

// Structured predicates for richer queries
const active = suppliers.restrict(
  Pred.and(Pred.gt('status', 10), Pred.neq('city', 'Athens'))
);

// Cursor-based streaming for large results
for await (const row of suppliers) {
  console.log(row);
}

// Inspect the SQL without executing
console.log(london.toSql());

// Cross-source: SQL + in-memory → automatic materialization
const extra = Bmg([{ sid: 'S6', bonus: 500 }]);
const joined = await suppliers.join(extra, ['sid']).toArray();
// suppliers is materialized from DB, then joined in-memory with extra
```

---

## 7. Implementation Roadmap

### Phase 0: Monorepo Setup
1. Convert the repo to a pnpm workspace monorepo
2. Move existing code into `packages/bmg/`
3. Create `packages/predicate/`, `packages/bmg-sql/`, `packages/bmg-pg/`
4. Shared tooling: vitest, tsconfig, microbundle across packages

### Phase 1: Predicate Package (`@enspirit/predicate`)
5. Define predicate AST types (eq, neq, lt, gt, and, or, not, in, exists, etc.)
6. Implement `Pred` builder helpers
7. Implement predicate evaluation (run a predicate against a JS object)
8. Implement predicate-to-SQL compilation (parameterized)
9. Integrate with `@enspirit/bmg` — accept structured predicates in `restrict()`
   alongside existing plain objects and functions

### Phase 2: SQL AST & Compiler (`@enspirit/bmg-sql`)
10. Define SQL AST types (TypeScript discriminated unions)
11. Implement `SqlBuilder` for constructing AST nodes
12. Implement `SqlDialect` interface (start with Postgres dialect)
13. Implement `compile()` — AST → parameterized SQL string
14. Unit tests: build ASTs, compile to SQL, verify output

### Phase 3: Core Processors
15. `processFromSelf` — wrapping in subquery (needed by most others)
16. `processWhere` — restriction
17. `processProject` / `processAllbut` — projection + DISTINCT
18. `processRename` — column aliasing
19. `processJoin` — INNER/LEFT JOIN
20. `processMerge` — UNION/EXCEPT/INTERSECT

### Phase 4: SqlRelation + Postgres Adapter
21. Define `DatabaseAdapter` interface (with `query()` and `stream()`)
22. Implement `SqlRelation<T>` implementing `AsyncRelation<T>`
23. Wire up processors into SqlRelation methods
24. Implement fallback to `BaseAsyncRelation` for non-compilable ops
25. Implement `@enspirit/bmg-pg` — `PostgresAdapter` with cursor streaming
26. Docker-based Postgres for integration tests
27. `toSql()` method for debugging/inspection

### Phase 5: Extended Processors
28. `processExtend` / `processConstants` — computed columns
29. `processSummarize` — GROUP BY + aggregates
30. `processSemiJoin` — matching/not_matching via EXISTS
31. `processOrderBy` / `processLimitOffset` — page operator support
32. `processTransform` — CAST

### Phase 6: Runtime Type System
33. Define `RelationType` for runtime schema info (attribute names, types, keys)
34. Use key knowledge to skip DISTINCT when a projection preserves a key
35. Propagate type info through operator chains

### Phase 7: Additional Backends
36. `@enspirit/bmg-sqlite` — SQLite adapter (async via `better-sqlite3` + worker)
37. `@enspirit/bmg-mysql` — MySQL adapter
38. SQL dialect differences (quoting, LIMIT syntax, type casting, etc.)

---

## 8. Decisions Summary

| Question                       | Decision                                             |
|--------------------------------|------------------------------------------------------|
| Package structure              | Monorepo with separate packages (pnpm workspaces)    |
| Predicate library              | Standalone `@enspirit/predicate` package              |
| Runtime type/schema system     | Yes — needed for DISTINCT optimization (key tracking) |
| Sync vs async for SQL          | Async only — `SqlRelation` implements `AsyncRelation` |
| Write operations (insert/update/delete) | Deferred — read-only first                  |
| AST approach                   | Typed TypeScript AST (discriminated unions), not S-expressions |
| Query builder dependency       | No Knex — own SQL compiler                           |
| Cursor/streaming support       | Yes — `DatabaseAdapter.stream()` + `AsyncIterable`   |
| Testing strategy               | Unit tests (AST → SQL) + Docker-based integration tests |
| Lazy evaluation / push-down    | Yes — materialize to memory only as last resort       |

---

## 9. Risks and Mitigations

- **Scope:** The Ruby SQL layer is substantial (~3000+ lines across processors,
  nodes, translator, builder). Mitigation: phased approach, start with core
  operators (restrict, project, join, union) and add the rest incrementally.

- **Predicate compilation** is the hardest part. The Ruby version relies on a
  full-featured predicate library with its own AST. Mitigation: building
  `@enspirit/predicate` as a standalone package early (Phase 1) ensures it's
  solid before the SQL layer depends on it.

- **Async boundary:** SQL relations (`AsyncRelation`) and memory relations
  (`Relation`) live in different type worlds. Cross-source operations (e.g.,
  joining a SQL relation with an in-memory array) require materialization.
  Mitigation: clear fallback semantics — when sources are incompatible, the
  SQL side materializes and the operation continues in-memory via
  `BaseAsyncRelation`.

- **SQL dialect divergence:** Postgres, SQLite, and MySQL differ in quoting,
  LIMIT syntax, type casting, CTEs, etc. Mitigation: the `SqlDialect` interface
  isolates these differences. Start with Postgres only, add others later.

- **Cursor streaming complexity:** Postgres cursors require a transaction
  context. SQLite step iteration has different semantics. Mitigation: the
  `DatabaseAdapter.stream()` contract is simple (`AsyncIterable<T>`); each
  adapter handles the driver-specific complexity internally.
