import { describe, it, expect } from 'vitest';
import { BaseAsyncRelation } from 'src/AsyncRelation';
import type { AsyncRelation } from 'src/async-types';
import type { TypedPredicate } from 'src/types';

/**
 * Example of a custom AsyncRelation that optimizes `restrict` calls
 * when the predicate is an object with only an `id` field.
 *
 * This simulates a data source (like a database or key-value store)
 * that can do efficient lookups by primary key.
 */
type Item = { id: string; name: string; value: number };

class FooAsyncRelation extends BaseAsyncRelation<Item> {
  private dataById: Map<string, Item>;
  public restrictByIdCalls = 0;
  public defaultRestrictCalls = 0;

  constructor(data: Item[]) {
    // Create an async iterable from the data for the base class
    super({
      async *[Symbol.asyncIterator]() {
        for (const item of data) {
          yield item;
        }
      }
    });

    // Build an index for efficient id lookups
    this.dataById = new Map(data.map(item => [item.id, item]));
  }

  /**
   * Override restrict to optimize for `{ id: value }` predicates.
   */
  restrict(p: TypedPredicate<Item>): AsyncRelation<Item> {
    // Check if predicate is an object with only `id` field
    if (this.isIdOnlyPredicate(p)) {
      this.restrictByIdCalls++;
      const id = (p as { id: string }).id;
      const item = this.dataById.get(id);

      // Return a new FooAsyncRelation with just the matched item (or empty)
      return new FooAsyncRelation(item ? [item] : []);
    }

    // Fall back to default implementation for other predicates
    this.defaultRestrictCalls++;
    return super.restrict(p);
  }

  private isIdOnlyPredicate(p: TypedPredicate<Item>): p is { id: string } {
    return (
      typeof p === 'object' &&
      p !== null &&
      'id' in p &&
      Object.keys(p).length === 1
    );
  }
}

describe('Custom AsyncRelation with optimized restrict', () => {
  const testData: Item[] = [
    { id: '1', name: 'Alice', value: 100 },
    { id: '2', name: 'Bob', value: 200 },
    { id: '3', name: 'Charlie', value: 300 },
  ];

  it('uses optimized path for restrict({ id: value })', async () => {
    const relation = new FooAsyncRelation(testData);

    const result = await relation.restrict({ id: '2' }).one();

    expect(result.name).to.eql('Bob');
    expect(relation.restrictByIdCalls).to.eql(1);
    expect(relation.defaultRestrictCalls).to.eql(0);
  });

  it('uses default path for restrict with multiple fields', async () => {
    const relation = new FooAsyncRelation(testData);

    const result = await relation.restrict({ id: '2', name: 'Bob' }).one();

    expect(result.value).to.eql(200);
    expect(relation.restrictByIdCalls).to.eql(0);
    expect(relation.defaultRestrictCalls).to.eql(1);
  });

  it('uses default path for restrict with non-id field', async () => {
    const relation = new FooAsyncRelation(testData);

    const result = await relation.restrict({ name: 'Charlie' }).one();

    expect(result.id).to.eql('3');
    expect(relation.restrictByIdCalls).to.eql(0);
    expect(relation.defaultRestrictCalls).to.eql(1);
  });

  it('uses default path for function predicates', async () => {
    const relation = new FooAsyncRelation(testData);

    const result = await relation.restrict(t => t.value > 150).toArray();

    expect(result.length).to.eql(2);
    expect(relation.restrictByIdCalls).to.eql(0);
    expect(relation.defaultRestrictCalls).to.eql(1);
  });

  it('returns empty for non-existent id', async () => {
    const relation = new FooAsyncRelation(testData);

    const result = await relation.restrict({ id: 'nonexistent' }).toArray();

    expect(result).to.eql([]);
    expect(relation.restrictByIdCalls).to.eql(1);
  });

  it('other operators use default implementation', async () => {
    const relation = new FooAsyncRelation(testData);

    const result = await relation
      .restrict({ id: '1' })
      .project(['id', 'name'])
      .toArray();

    expect(result).to.eql([{ id: '1', name: 'Alice' }]);
    expect(relation.restrictByIdCalls).to.eql(1);
  });
});
