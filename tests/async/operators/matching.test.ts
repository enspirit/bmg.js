import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable } from '../fixtures';

interface Order {
  oid: number;
  customer_id: string;
  amount: number;
}

interface Customer {
  customer_id: string;
  name: string;
}

describe('AsyncRelation.matching', () => {
  const ordersData: Order[] = [
    { oid: 1, customer_id: 'C1', amount: 100 },
    { oid: 2, customer_id: 'C2', amount: 200 },
    { oid: 3, customer_id: 'C3', amount: 150 },
  ];

  const customersData: Customer[] = [
    { customer_id: 'C1', name: 'Alice' },
    { customer_id: 'C2', name: 'Bob' },
  ];

  const asyncOrders = () => AsyncBmg<Order>(createAsyncIterable([...ordersData]));
  const asyncCustomers = () => AsyncBmg<Customer>(createAsyncIterable([...customersData]));
  const syncOrders = () => Bmg<Order>([...ordersData]);
  const syncCustomers = () => Bmg<Customer>([...customersData]);

  it('returns tuples from left that match right on common attrs', async () => {
    const got = await asyncOrders().matching(asyncCustomers()).toRelation();
    const expected = syncOrders().matching(syncCustomers());
    expect(isEqual(got, expected)).to.be.true;
  });

  it('supports explicit keys as [common_attr]', async () => {
    const got = await asyncOrders().matching(asyncCustomers(), ['customer_id']).toRelation();
    const expected = syncOrders().matching(syncCustomers(), ['customer_id']);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('supports explicit keys as { left: right }', async () => {
    const suppliersData = [
      { sid: 'S1', city: 'London' },
      { sid: 'S2', city: 'Paris' },
    ];
    const citiesData = [{ location: 'London' }];

    const asyncSuppliers = AsyncBmg(createAsyncIterable([...suppliersData]));
    const asyncCities = AsyncBmg(createAsyncIterable([...citiesData]));
    const syncSuppliers = Bmg([...suppliersData]);
    const syncCities = Bmg([...citiesData]);

    const got = await asyncSuppliers.matching(asyncCities, { city: 'location' }).toRelation();
    const expected = syncSuppliers.matching(syncCities, { city: 'location' });
    expect(isEqual(got, expected)).to.be.true;
  });
});
