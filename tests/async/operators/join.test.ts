import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/AsyncRelation';
import { createAsyncIterable } from '../fixtures';

describe('AsyncRelation.join', () => {
  const suppliersData = [
    { sid: 'S1', name: 'Smith', city: 'London' },
    { sid: 'S2', name: 'Jones', city: 'Paris' },
    { sid: 'S3', name: 'Blake', city: 'Paris' },
  ];

  const partsData = [
    { pid: 'P1', pname: 'Nut', city: 'London' },
    { pid: 'P2', pname: 'Bolt', city: 'Paris' },
    { pid: 'P3', pname: 'Screw', city: 'Athens' },
  ];

  const asyncSuppliers = () => AsyncBmg(createAsyncIterable([...suppliersData]));
  const asyncParts = () => AsyncBmg(createAsyncIterable([...partsData]));
  const syncSuppliers = () => Bmg([...suppliersData]);
  const syncParts = () => Bmg([...partsData]);

  it('performs natural join on common attributes', async () => {
    const got = await asyncSuppliers().join(asyncParts()).toRelation();
    const expected = syncSuppliers().join(syncParts());
    expect(isEqual(got, expected)).to.be.true;
  });

  it('joins on specified attributes as [common_attr]', async () => {
    const got = await asyncSuppliers().join(asyncParts(), ['city']).toRelation();
    const expected = syncSuppliers().join(syncParts(), ['city']);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('joins on different attribute names as { left: right }', async () => {
    const locationsData = [
      { location: 'London', country: 'UK' },
      { location: 'Paris', country: 'France' },
    ];
    const asyncLocations = AsyncBmg(createAsyncIterable([...locationsData]));
    const syncLocations = Bmg([...locationsData]);

    const got = await asyncSuppliers().join(asyncLocations, { city: 'location' }).toRelation();
    const expected = syncSuppliers().join(syncLocations, { city: 'location' });
    expect(isEqual(got, expected)).to.be.true;
  });

  it('returns empty for no matches', async () => {
    const otherData = [{ city: 'Tokyo' }];
    const asyncOther = AsyncBmg(createAsyncIterable([...otherData]));

    const got = await asyncSuppliers().join(asyncOther).toRelation();
    const expected = Bmg([]);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('handles cartesian product when no common attrs', async () => {
    const colorsData = [{ color: 'red' }, { color: 'blue' }];
    const sizesData = [{ size: 'S' }, { size: 'M' }];

    const asyncColors = AsyncBmg(createAsyncIterable([...colorsData]));
    const asyncSizes = AsyncBmg(createAsyncIterable([...sizesData]));
    const syncColors = Bmg([...colorsData]);
    const syncSizes = Bmg([...sizesData]);

    const got = await asyncColors.join(asyncSizes).toRelation();
    const expected = syncColors.join(syncSizes);
    expect(isEqual(got, expected)).to.be.true;
  });
});
