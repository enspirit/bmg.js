import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable } from '../fixtures';

describe('AsyncRelation.left_join', () => {
  const ordersData = [
    { oid: 1, customer_id: 'C1', amount: 100 },
    { oid: 2, customer_id: 'C2', amount: 200 },
    { oid: 3, customer_id: 'C3', amount: 150 },
  ];

  const customersData = [
    { customer_id: 'C1', name: 'Alice' },
    { customer_id: 'C2', name: 'Bob' },
  ];

  const asyncOrders = () => AsyncBmg(createAsyncIterable([...ordersData]));
  const asyncCustomers = () => AsyncBmg(createAsyncIterable([...customersData]));
  const syncOrders = () => Bmg([...ordersData]);
  const syncCustomers = () => Bmg([...customersData]);

  it('joins matching tuples and keeps non-matching with null', async () => {
    const got = await asyncOrders().left_join(asyncCustomers()).toRelation();
    const expected = syncOrders().left_join(syncCustomers());
    expect(isEqual(got, expected)).to.be.true;
  });

  it('supports explicit keys as [common_attr]', async () => {
    const got = await asyncOrders().left_join(asyncCustomers(), ['customer_id']).toRelation();
    const expected = syncOrders().left_join(syncCustomers(), ['customer_id']);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('supports explicit keys as { left: right }', async () => {
    const suppliersData = [
      { sid: 'S1', city: 'London' },
      { sid: 'S2', city: 'Paris' },
      { sid: 'S3', city: 'Athens' },
    ];
    const citiesData = [
      { location: 'London', country: 'UK' },
      { location: 'Paris', country: 'France' },
    ];

    const asyncSuppliers = AsyncBmg(createAsyncIterable([...suppliersData]));
    const asyncCities = AsyncBmg(createAsyncIterable([...citiesData]));
    const syncSuppliers = Bmg([...suppliersData]);
    const syncCities = Bmg([...citiesData]);

    const got = await asyncSuppliers.left_join(asyncCities, { city: 'location' }).toRelation();
    const expected = syncSuppliers.left_join(syncCities, { city: 'location' });
    expect(isEqual(got, expected)).to.be.true;
  });

  it('handles multiple matches', async () => {
    const leftData = [{ id: 1, city: 'Paris' }];
    const rightData = [
      { city: 'Paris', name: 'A' },
      { city: 'Paris', name: 'B' },
    ];

    const asyncLeft = AsyncBmg(createAsyncIterable([...leftData]));
    const asyncRight = AsyncBmg(createAsyncIterable([...rightData]));
    const syncLeft = Bmg([...leftData]);
    const syncRight = Bmg([...rightData]);

    const got = await asyncLeft.left_join(asyncRight).toRelation();
    const expected = syncLeft.left_join(syncRight);
    expect(isEqual(got, expected)).to.be.true;
  });
});
