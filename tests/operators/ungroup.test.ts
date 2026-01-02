import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { ungroup } from 'src/operators';

describe('.ungroup', () => {

  const grouped = Bmg([
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
  ]);

  it('flattens nested relation into parent tuples', () => {
    const result = grouped.ungroup('items').toArray();
    expect(result).to.have.length(3);
  })

  it('preserves parent attributes', () => {
    const result = grouped.ungroup('items').toArray();
    const appleRow = result.find(r => r.item === 'Apple');
    expect(appleRow?.order_id).to.eql(1);
    expect(appleRow?.customer).to.eql('Alice');
  })

  it('merges nested attributes', () => {
    const result = grouped.ungroup('items').toArray();
    const appleRow = result.find(r => r.item === 'Apple');
    expect(appleRow?.item).to.eql('Apple');
    expect(appleRow?.qty).to.eql(2);
  })

  it('is the inverse of group', () => {
    const orders = Bmg([
      { order_id: 1, customer: 'Alice', item: 'Apple', qty: 2 },
      { order_id: 1, customer: 'Alice', item: 'Banana', qty: 3 },
      { order_id: 2, customer: 'Bob', item: 'Cherry', qty: 1 },
    ]);
    const roundtrip = orders.group(['item', 'qty'], 'items').ungroup('items').toArray();
    expect(roundtrip).to.have.length(3);
    expect(roundtrip).to.deep.include({ order_id: 1, customer: 'Alice', item: 'Apple', qty: 2 });
  })

  ///

  it('can be used standalone', () => {
    const res = ungroup(grouped.toArray(), 'items');
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res).to.have.length(3);
  })

});
