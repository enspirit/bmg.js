import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/AsyncRelation';
import { createAsyncIterable } from '../fixtures';

interface Person {
  id: number;
  name: string;
}

describe('AsyncRelation.union', () => {
  const leftData: Person[] = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];

  const rightData: Person[] = [
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ];

  const asyncLeft = () => AsyncBmg<Person>(createAsyncIterable([...leftData]));
  const asyncRight = () => AsyncBmg<Person>(createAsyncIterable([...rightData]));
  const syncLeft = () => Bmg<Person>([...leftData]);
  const syncRight = () => Bmg<Person>([...rightData]);

  it('combines tuples from both relations', async () => {
    const got = await asyncLeft().union(asyncRight()).toRelation();
    const expected = syncLeft().union(syncRight());
    expect(isEqual(got, expected)).to.be.true;
  });

  it('removes duplicates', async () => {
    const got = await asyncLeft().union(asyncRight()).toRelation();
    const expected = Bmg([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ]);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('is commutative (set semantics)', async () => {
    const lr = await asyncLeft().union(asyncRight()).toRelation();
    const rl = await asyncRight().union(asyncLeft()).toRelation();
    expect(isEqual(lr, rl)).to.be.true;
  });
});
