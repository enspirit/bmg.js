import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { matching } from 'src/operators';

describe('.matching', () => {

  const orders = Bmg([
    { oid: 1, customer_id: 'C1', amount: 100 },
    { oid: 2, customer_id: 'C2', amount: 200 },
    { oid: 3, customer_id: 'C3', amount: 150 },
  ]);

  const customers = Bmg([
    { customer_id: 'C1', name: 'Alice' },
    { customer_id: 'C2', name: 'Bob' },
  ]);

  it('returns tuples from left that match right on common attrs', () => {
    const result = orders.matching(customers);
    const expected = Bmg([
      { oid: 1, customer_id: 'C1', amount: 100 },
      { oid: 2, customer_id: 'C2', amount: 200 },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('preserves all left attributes', () => {
    const result = orders.matching(customers);
    const expected = Bmg([
      { oid: 1, customer_id: 'C1', amount: 100 },
      { oid: 2, customer_id: 'C2', amount: 200 },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('supports explicit keys', () => {
    const suppliers = Bmg([
      { sid: 'S1', city: 'London' },
      { sid: 'S2', city: 'Paris' },
    ]);
    const cities = Bmg([{ location: 'London' }]);
    const result = suppliers.matching(cities, { city: 'location' });
    const expected = Bmg([{ sid: 'S1', city: 'London' }]);
    expect(result.isEqual(expected)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const res = matching(orders.toArray(), customers.toArray());
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res).to.have.length(2);
  })

});
