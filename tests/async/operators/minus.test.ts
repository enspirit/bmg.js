import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/AsyncRelation';
import { createAsyncIterable } from '../fixtures';

interface Person {
  id: number;
  name: string;
}

describe('AsyncRelation.minus', () => {
  const leftData: Person[] = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ];

  const rightData: Person[] = [
    { id: 2, name: 'Bob' },
    { id: 4, name: 'Diana' },
  ];

  const asyncLeft = () => AsyncBmg<Person>(createAsyncIterable([...leftData]));
  const asyncRight = () => AsyncBmg<Person>(createAsyncIterable([...rightData]));
  const syncLeft = () => Bmg<Person>([...leftData]);
  const syncRight = () => Bmg<Person>([...rightData]);

  it('returns tuples in left but not in right', async () => {
    const got = await asyncLeft().minus(asyncRight()).toRelation();
    const expected = syncLeft().minus(syncRight());
    expect(isEqual(got, expected)).to.be.true;
  });

  it('returns empty when left is subset of right', async () => {
    const small = AsyncBmg<Person>(createAsyncIterable([{ id: 2, name: 'Bob' }]));
    const got = await small.minus(asyncRight()).toRelation();
    const expected = Bmg<Person>([]);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('returns all when no overlap', async () => {
    const other = AsyncBmg<Person>(createAsyncIterable([{ id: 99, name: 'Nobody' }]));
    const got = await asyncLeft().minus(other).toRelation();
    const expected = syncLeft();
    expect(isEqual(got, expected)).to.be.true;
  });
});
