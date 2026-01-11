import { describe, it, expect } from 'vitest';
import { Bmg, DEE, DUM } from 'src';
import { ungroup , isEqual } from 'src/operators';

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
    const result = grouped.ungroup('items');
    const expected = Bmg([
      { order_id: 1, customer: 'Alice', item: 'Apple', qty: 2 },
      { order_id: 1, customer: 'Alice', item: 'Banana', qty: 3 },
      { order_id: 2, customer: 'Bob', item: 'Cherry', qty: 1 },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('preserves parent attributes', () => {
    const result = grouped.ungroup('items') as any;
    const appleRow = result.restrict({ item: 'Apple' }).one();
    expect(appleRow.order_id).to.eql(1);
    expect(appleRow.customer).to.eql('Alice');
  })

  it('merges nested attributes', () => {
    const result = grouped.ungroup('items') as any;
    const appleRow = result.restrict({ item: 'Apple' }).one();
    expect(appleRow.item).to.eql('Apple');
    expect(appleRow.qty).to.eql(2);
  })

  it('is the inverse of group', () => {
    const orders = Bmg([
      { order_id: 1, customer: 'Alice', item: 'Apple', qty: 2 },
      { order_id: 1, customer: 'Alice', item: 'Banana', qty: 3 },
      { order_id: 2, customer: 'Bob', item: 'Cherry', qty: 1 },
    ]);
    const roundtrip = orders.group(['item', 'qty'], 'items').ungroup('items');
    expect(roundtrip.isEqual(orders)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const res = ungroup(grouped.toArray(), 'items');
    const expected = grouped.ungroup('items');
    expect(isEqual(res, expected)).to.be.true;
  })

  describe('DEE and DUM', () => {
    it('ungroup with nested DEE yields the parent tuple', () => {
      const withNested = Bmg([{ x: 1, nested: DEE }]);
      const result = withNested.ungroup('nested');
      const expected = Bmg([{ x: 1 }]);
      expect(result.isEqual(expected)).to.be.true;
    })

    it('ungroup with nested DUM removes the parent tuple', () => {
      const withNested = Bmg([{ x: 1, nested: DUM }]);
      const result = withNested.ungroup('nested');
      // ungrouping DUM produces no rows for that parent
      expect(result.isEqual(Bmg([]))).to.be.true;
    })

    it('DUM.ungroup = DUM (no tuples to ungroup)', () => {
      const result = DUM.ungroup('x');
      expect(result.isEqual(DUM)).to.be.true;
    })
  })

});
