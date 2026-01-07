# Bmg.js Example

Demonstrates relational algebra operations using the classic suppliers/parts/shipments dataset with full TypeScript type safety.

## Running the example

```bash
npm install
npm start
```

## What's covered

- Basic operations: `restrict`, `project`, `rename`
- Extending relations: `extend`, `constants`
- Set operations: `union`, `minus`, `intersect`
- Join operations: `join`, `left_join`, `matching`, `not_matching`
- Aggregation: `summarize` with `count`, `sum`, `avg`, `min`, `max`
- Grouping and nesting: `group`, `image`, `wrap`
- Data transformation: `transform`, `allbut`
- Extracting tuples: `one()`
- Relation properties: `isEqual`, `Bmg.isRelation`
