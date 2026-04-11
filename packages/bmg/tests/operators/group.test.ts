import { describe, it, expect } from 'vitest';
import { Bmg, DEE, DUM } from 'src';
import { group , isEqual } from 'src/sync/operators';

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

  describe('DEE and DUM', () => {
    it('DEE.group([], attr) creates relation with nested DEE', () => {
      const result = DEE.group([], 'grouped');
      const expected = Bmg([{ grouped: DEE }]);
      expect(result.isEqual(expected)).to.be.true;
    })

    it('DUM.group([], attr) = DUM (no tuples to group)', () => {
      const result = DUM.group([], 'grouped');
      expect(result.isEqual(DUM)).to.be.true;
    })
  })

  describe('allbut option', () => {
    it('groups all attributes EXCEPT the specified ones', () => {
      // With allbut: ['order_id', 'customer'] means KEEP order_id and customer at top,
      // group everything else (item, qty) into nested relation
      const result = orders.group(['order_id', 'customer'], 'items', { allbut: true });
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

    it('produces same result as regular group with inverted attrs', () => {
      // These should be equivalent:
      // group(['item', 'qty'], 'items') - group item and qty
      // group(['order_id', 'customer'], 'items', { allbut: true }) - keep order_id and customer
      const withoutAllbut = orders.group(['item', 'qty'], 'items');
      const withAllbut = orders.group(['order_id', 'customer'], 'items', { allbut: true });
      expect(withAllbut.isEqual(withoutAllbut)).to.be.true;
    })

    it('handles single attribute to keep', () => {
      const data = Bmg([
        { city: 'Paris', name: 'Alice', age: 30 },
        { city: 'Paris', name: 'Bob', age: 25 },
        { city: 'London', name: 'Charlie', age: 35 },
      ]);
      const result = data.group(['city'], 'people', { allbut: true });
      const expected = Bmg([
        {
          city: 'Paris',
          people: Bmg([
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 25 },
          ])
        },
        {
          city: 'London',
          people: Bmg([
            { name: 'Charlie', age: 35 },
          ])
        },
      ]);
      expect(result.isEqual(expected)).to.be.true;
    })

    it('handles empty relation with allbut', () => {
      const empty = Bmg([]);
      const result = empty.group(['x'], 'grouped', { allbut: true });
      expect(result.isEqual(Bmg([]))).to.be.true;
    })
  })

});
