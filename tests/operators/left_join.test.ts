import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { left_join } from 'src/operators';

describe('.left_join', () => {

  const orders = Bmg([
    { oid: 1, customer_id: 'C1', amount: 100 },
    { oid: 2, customer_id: 'C2', amount: 200 },
    { oid: 3, customer_id: 'C3', amount: 150 },
  ]);

  const customers = Bmg([
    { customer_id: 'C1', name: 'Alice' },
    { customer_id: 'C2', name: 'Bob' },
  ]);

  it('joins matching tuples', () => {
    const result = orders.left_join(customers);
    const order1 = result.restrict({ oid: 1 }).one();
    expect(order1.name).to.eql('Alice');
  })

  it('keeps non-matching left tuples with null right attrs', () => {
    const result = orders.left_join(customers);
    const order3 = result.restrict({ oid: 3 }).one();
    expect(order3.name).to.eql(null);
  })

  it('preserves all left attributes', () => {
    const result = orders.left_join(customers);
    const order1 = result.restrict({ oid: 1 }).one();
    expect(order1).to.have.property('oid');
    expect(order1).to.have.property('customer_id');
    expect(order1).to.have.property('amount');
    expect(order1).to.have.property('name');
  })

  it('supports explicit keys', () => {
    const suppliers = Bmg([
      { sid: 'S1', city: 'London' },
      { sid: 'S2', city: 'Paris' },
      { sid: 'S3', city: 'Athens' },
    ]);
    const cities = Bmg([
      { location: 'London', country: 'UK' },
      { location: 'Paris', country: 'France' },
    ]);
    const result = suppliers.left_join(cities, { city: 'location' });
    expect(result.restrict({ sid: 'S1' }).one().country).to.eql('UK');
    expect(result.restrict({ sid: 'S3' }).one().country).to.eql(null);
  })

  it('handles multiple matches', () => {
    const left = Bmg([{ id: 1, city: 'Paris' }]);
    const right = Bmg([
      { city: 'Paris', name: 'A' },
      { city: 'Paris', name: 'B' },
    ]);
    const result = left.left_join(right);
    const expected = Bmg([
      { id: 1, city: 'Paris', name: 'A' },
      { id: 1, city: 'Paris', name: 'B' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const res = left_join(orders.toArray(), customers.toArray());
    const expected = orders.left_join(customers);
    expect(Bmg(res).isEqual(expected)).to.be.true;
  })

});
