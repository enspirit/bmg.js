import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable } from '../fixtures';

interface Person {
  id: number;
  name: string;
}

describe('AsyncRelation.intersect', () => {
  const leftData: Person[] = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ];

  const rightData: Person[] = [
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
    { id: 4, name: 'Diana' },
  ];

  const asyncLeft = () => AsyncBmg<Person>(createAsyncIterable([...leftData]));
  const asyncRight = () => AsyncBmg<Person>(createAsyncIterable([...rightData]));
  const syncLeft = () => Bmg<Person>([...leftData]);
  const syncRight = () => Bmg<Person>([...rightData]);

  it('returns tuples present in both relations', async () => {
    const got = await asyncLeft().intersect(asyncRight()).toRelation();
    const expected = syncLeft().intersect(syncRight());
    expect(isEqual(got, expected)).to.be.true;
  });

  it('returns empty when no overlap', async () => {
    const other = AsyncBmg<Person>(createAsyncIterable([{ id: 99, name: 'Nobody' }]));
    const got = await asyncLeft().intersect(other).toRelation();
    const expected = Bmg<Person>([]);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('is commutative (set semantics)', async () => {
    const lr = await asyncLeft().intersect(asyncRight()).toRelation();
    const rl = await asyncRight().intersect(asyncLeft()).toRelation();
    expect(isEqual(lr, rl)).to.be.true;
  });
});
