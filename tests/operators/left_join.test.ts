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
    const result = orders.left_join(customers).toArray();
    const order1 = result.find(r => r.oid === 1);
    expect(order1?.name).to.eql('Alice');
  })

  it('keeps non-matching left tuples with null right attrs', () => {
    const result = orders.left_join(customers).toArray();
    expect(result).to.have.length(3);
    const order3 = result.find(r => r.oid === 3);
    expect(order3?.name).to.eql(null);
  })

  it('preserves all left attributes', () => {
    const result = orders.left_join(customers).toArray();
    expect(result[0]).to.have.property('oid');
    expect(result[0]).to.have.property('customer_id');
    expect(result[0]).to.have.property('amount');
    expect(result[0]).to.have.property('name');
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
    const result = suppliers.left_join(cities, { city: 'location' }).toArray();
    expect(result).to.have.length(3);
    expect(result.find(r => r.sid === 'S1')?.country).to.eql('UK');
    expect(result.find(r => r.sid === 'S3')?.country).to.eql(null);
  })

  it('handles multiple matches', () => {
    const left = Bmg([{ id: 1, city: 'Paris' }]);
    const right = Bmg([
      { city: 'Paris', name: 'A' },
      { city: 'Paris', name: 'B' },
    ]);
    const result = left.left_join(right).toArray();
    expect(result).to.have.length(2);
  })

  ///

  it('can be used standalone', () => {
    const res = left_join(orders.toArray(), customers.toArray());
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res).to.have.length(3);
  })

});
