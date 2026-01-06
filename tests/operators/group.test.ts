import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { group , isEqual } from 'src/operators';

describe('.group', () => {

  const orders = Bmg([
    { order_id: 1, customer: 'Alice', item: 'Apple', qty: 2 },
    { order_id: 1, customer: 'Alice', item: 'Banana', qty: 3 },
    { order_id: 2, customer: 'Bob', item: 'Cherry', qty: 1 },
  ]);

  it('groups specified attributes into nested relation', () => {
    const result = orders.group(['item', 'qty'], 'items');
    const expected = Bmg([
      {
        order_id: 1,
        customer: 'Alice',
        items: Bmg([
          { item: 'Apple', qty: 2 },
          { item: 'Banana', qty: 3 },
        ])
      },
      {
        order_id: 2,
        customer: 'Bob',
        items: Bmg([
          { item: 'Cherry', qty: 1 },
        ])
      },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('preserves non-grouped attributes', () => {
    const result = orders.group(['item', 'qty'], 'items');
    const bob = result.restrict({ customer: 'Bob' }).one();
    expect(bob).to.have.property('order_id', 2);
    expect(bob).to.have.property('customer', 'Bob');
    expect(bob).to.have.property('items');
    expect(Object.keys(bob).sort()).to.eql(['customer', 'items', 'order_id']);
  })

  it('handles single-item groups', () => {
    const result = orders.group(['item', 'qty'], 'items');
    const bobOnly = result.restrict({ customer: 'Bob' });
    const expected = Bmg([{
      order_id: 2,
      customer: 'Bob',
      items: Bmg([{ item: 'Cherry', qty: 1 }])
    }]);
    expect(bobOnly.isEqual(expected)).to.be.true;
  })

  it('handles empty relation', () => {
    const empty = Bmg([]);
    const result = empty.group(['x'], 'grouped');
    expect(result.isEqual(Bmg([]))).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const res = group(orders.toArray(), ['item', 'qty'], 'items');
    const expected = orders.group(['item', 'qty'], 'items');
    expect(isEqual(res, expected)).to.be.true;
  })

});
