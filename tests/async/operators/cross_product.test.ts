import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/AsyncRelation';
import { createAsyncIterable } from '../fixtures';

describe('AsyncRelation.cross_product', () => {
  const colorsData = [
    { color: 'red' },
    { color: 'blue' },
  ];

  const sizesData = [
    { size: 'S' },
    { size: 'M' },
    { size: 'L' },
  ];

  const asyncColors = () => AsyncBmg(createAsyncIterable([...colorsData]));
  const asyncSizes = () => AsyncBmg(createAsyncIterable([...sizesData]));
  const syncColors = () => Bmg([...colorsData]);
  const syncSizes = () => Bmg([...sizesData]);

  it('computes cartesian product of two relations', async () => {
    const got = await asyncColors().cross_product(asyncSizes()).toRelation();
    const expected = syncColors().cross_product(syncSizes());
    expect(isEqual(got, expected)).to.be.true;
  });

  it('cross_join is an alias for cross_product', async () => {
    const withCrossProduct = await asyncColors().cross_product(asyncSizes()).toRelation();
    const withCrossJoin = await asyncColors().cross_join(asyncSizes()).toRelation();
    expect(isEqual(withCrossProduct, withCrossJoin)).to.be.true;
  });

  it('handles DUM (empty relation)', async () => {
    const empty = AsyncBmg(createAsyncIterable([]));
    const got = await asyncColors().cross_product(empty).toArray();
    expect(got).to.eql([]);
  });

  it('handles DEE (empty tuple)', async () => {
    const dee = AsyncBmg(createAsyncIterable([{}]));
    const got = await asyncColors().cross_product(dee).toRelation();
    const expected = syncColors();
    expect(isEqual(got, expected)).to.be.true;
  });

  it('clashing right attributes are ignored', async () => {
    const leftData = [{ x: 1, y: 2 }];
    const rightData = [{ y: 100, z: 3 }];

    const asyncLeft = AsyncBmg(createAsyncIterable([...leftData]));
    const asyncRight = AsyncBmg(createAsyncIterable([...rightData]));
    const syncLeft = Bmg([...leftData]);
    const syncRight = Bmg([...rightData]);

    const got = await asyncLeft.cross_product(asyncRight).toRelation();
    const expected = syncLeft.cross_product(syncRight);
    expect(isEqual(got, expected)).to.be.true;
  });
});
