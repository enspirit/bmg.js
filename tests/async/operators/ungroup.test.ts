import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/AsyncRelation';
import { createAsyncIterable } from '../fixtures';

describe('AsyncRelation.ungroup', () => {
  const groupedData = [
    {
      order_id: 1,
      customer: 'Alice',
      items: [
        { item: 'Apple', qty: 2 },
        { item: 'Banana', qty: 3 },
      ]
    },
    {
      order_id: 2,
      customer: 'Bob',
      items: [
        { item: 'Cherry', qty: 1 },
      ]
    },
  ];

  const asyncGrouped = () => AsyncBmg(createAsyncIterable([...groupedData]));
  const syncGrouped = () => Bmg([...groupedData]);

  it('flattens nested relation into parent tuples', async () => {
    const got = await asyncGrouped().ungroup('items').toRelation();
    const expected = syncGrouped().ungroup('items');
    expect(isEqual(got, expected)).to.be.true;
  });

  it('is the inverse of group', async () => {
    const ordersData = [
      { order_id: 1, customer: 'Alice', item: 'Apple', qty: 2 },
      { order_id: 1, customer: 'Alice', item: 'Banana', qty: 3 },
      { order_id: 2, customer: 'Bob', item: 'Cherry', qty: 1 },
    ];
    const asyncOrders = AsyncBmg(createAsyncIterable([...ordersData]));
    const syncOrders = Bmg([...ordersData]);

    const roundtrip = await asyncOrders.group(['item', 'qty'], 'items').ungroup('items').toRelation();
    expect(isEqual(roundtrip, syncOrders)).to.be.true;
  });
});
