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
    const result = orders.matching(customers).toArray();
    expect(result).to.have.length(2);
    expect(result[0].oid).to.eql(1);
    expect(result[1].oid).to.eql(2);
  })

  it('preserves all left attributes', () => {
    const result = orders.matching(customers).toArray();
    expect(result[0]).to.eql({ oid: 1, customer_id: 'C1', amount: 100 });
  })

  it('supports explicit keys', () => {
    const suppliers = Bmg([
      { sid: 'S1', city: 'London' },
      { sid: 'S2', city: 'Paris' },
    ]);
    const cities = Bmg([{ location: 'London' }]);
    const result = suppliers.matching(cities, { city: 'location' }).toArray();
    expect(result).to.have.length(1);
    expect(result[0].sid).to.eql('S1');
  })

  ///

  it('can be used standalone', () => {
    const res = matching(orders.toArray(), customers.toArray());
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res).to.have.length(2);
  })

});
