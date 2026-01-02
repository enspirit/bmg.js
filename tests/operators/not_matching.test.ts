import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { not_matching } from 'src/operators';

describe('.not_matching', () => {

  const orders = Bmg([
    { oid: 1, customer_id: 'C1', amount: 100 },
    { oid: 2, customer_id: 'C2', amount: 200 },
    { oid: 3, customer_id: 'C3', amount: 150 },
  ]);

  const customers = Bmg([
    { customer_id: 'C1', name: 'Alice' },
    { customer_id: 'C2', name: 'Bob' },
  ]);

  it('returns tuples from left that do NOT match right', () => {
    const result = orders.not_matching(customers).toArray();
    expect(result).to.have.length(1);
    expect(result[0].oid).to.eql(3);
    expect(result[0].customer_id).to.eql('C3');
  })

  it('returns all when no matches', () => {
    const empty = Bmg([{ customer_id: 'C99' }]);
    const result = orders.not_matching(empty).toArray();
    expect(result).to.have.length(3);
  })

  it('returns empty when all match', () => {
    const all = Bmg([
      { customer_id: 'C1' },
      { customer_id: 'C2' },
      { customer_id: 'C3' },
    ]);
    const result = orders.not_matching(all).toArray();
    expect(result).to.have.length(0);
  })

  it('supports explicit keys', () => {
    const suppliers = Bmg([
      { sid: 'S1', city: 'London' },
      { sid: 'S2', city: 'Paris' },
      { sid: 'S3', city: 'Athens' },
    ]);
    const cities = Bmg([{ location: 'London' }, { location: 'Paris' }]);
    const result = suppliers.not_matching(cities, { city: 'location' }).toArray();
    expect(result).to.have.length(1);
    expect(result[0].sid).to.eql('S3');
  })

  ///

  it('can be used standalone', () => {
    const res = not_matching(orders.toArray(), customers.toArray());
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res).to.have.length(1);
  })

});
