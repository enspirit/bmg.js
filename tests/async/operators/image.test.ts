import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/AsyncRelation';
import { createAsyncIterable } from '../fixtures';

describe('AsyncRelation.image', () => {
  const suppliersData = [
    { sid: 'S1', name: 'Smith', city: 'London' },
    { sid: 'S2', name: 'Jones', city: 'Paris' },
    { sid: 'S3', name: 'Blake', city: 'Paris' },
  ];

  const shipmentsData = [
    { sid: 'S1', pid: 'P1', qty: 100 },
    { sid: 'S1', pid: 'P2', qty: 200 },
    { sid: 'S2', pid: 'P1', qty: 300 },
  ];

  const asyncSuppliers = () => AsyncBmg(createAsyncIterable([...suppliersData]));
  const asyncShipments = () => AsyncBmg(createAsyncIterable([...shipmentsData]));
  const syncSuppliers = () => Bmg([...suppliersData]);
  const syncShipments = () => Bmg([...shipmentsData]);

  it('adds relation-valued attribute with matching tuples', async () => {
    const got = await asyncSuppliers().image(asyncShipments(), 'shipments').toRelation();
    const expected = syncSuppliers().image(syncShipments(), 'shipments');
    expect(isEqual(got, expected)).to.be.true;
  });

  it('supports explicit keys as [common_attr]', async () => {
    const got = await asyncSuppliers().image(asyncShipments(), 'shipments', ['sid']).toRelation();
    const expected = syncSuppliers().image(syncShipments(), 'shipments', ['sid']);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('supports explicit keys as { left: right }', async () => {
    const citiesData = [
      { location: 'London', country: 'UK' },
      { location: 'Paris', country: 'France' },
    ];
    const asyncCities = AsyncBmg(createAsyncIterable([...citiesData]));
    const syncCities = Bmg([...citiesData]);

    const got = await asyncSuppliers().image(asyncCities, 'city_info', { city: 'location' }).toRelation();
    const expected = syncSuppliers().image(syncCities, 'city_info', { city: 'location' });
    expect(isEqual(got, expected)).to.be.true;
  });
});
