import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/AsyncRelation';
import { createAsyncIterable } from '../fixtures';

describe('AsyncRelation.group', () => {
  const ordersData = [
    { order_id: 1, customer: 'Alice', item: 'Apple', qty: 2 },
    { order_id: 1, customer: 'Alice', item: 'Banana', qty: 3 },
    { order_id: 2, customer: 'Bob', item: 'Cherry', qty: 1 },
  ];

  const asyncOrders = () => AsyncBmg(createAsyncIterable([...ordersData]));
  const syncOrders = () => Bmg([...ordersData]);

  it('groups specified attributes into nested relation', async () => {
    const got = await asyncOrders().group(['item', 'qty'], 'items').toRelation();
    const expected = syncOrders().group(['item', 'qty'], 'items');
    expect(isEqual(got, expected)).to.be.true;
  });

  it('preserves non-grouped attributes', async () => {
    const result = await asyncOrders().group(['item', 'qty'], 'items').toRelation();
    const bob = result.restrict((t: any) => t.customer === 'Bob').one() as any;
    expect(bob).to.have.property('order_id', 2);
    expect(bob).to.have.property('customer', 'Bob');
    expect(bob).to.have.property('items');
  });

  it('handles empty relation', async () => {
    const empty = AsyncBmg(createAsyncIterable([]));
    const got = await empty.group(['x'], 'grouped').toRelation();
    const expected = Bmg([]);
    expect(isEqual(got, expected)).to.be.true;
  });
});
