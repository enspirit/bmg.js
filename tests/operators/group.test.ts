import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { group } from 'src/operators';

describe('.group', () => {

  const orders = Bmg([
    { order_id: 1, customer: 'Alice', item: 'Apple', qty: 2 },
    { order_id: 1, customer: 'Alice', item: 'Banana', qty: 3 },
    { order_id: 2, customer: 'Bob', item: 'Cherry', qty: 1 },
  ]);

  it('groups specified attributes into nested relation', () => {
    const result = orders.group(['item', 'qty'], 'items');
    const alice = result.restrict({ customer: 'Alice' }).one();
    expect(alice.order_id).to.eql(1);
    expect(alice.items).to.have.length(2);
    expect(alice.items).to.deep.include({ item: 'Apple', qty: 2 });
    expect(alice.items).to.deep.include({ item: 'Banana', qty: 3 });
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
    const bob = result.restrict({ customer: 'Bob' }).one();
    expect(bob.items).to.have.length(1);
  })

  it('handles empty relation', () => {
    const empty = Bmg([]);
    const result = empty.group(['x'], 'grouped');
    expect(result.isEqual(Bmg([]))).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const res = group(orders.toArray(), ['item', 'qty'], 'items');
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res).to.have.length(2);
  })

});
