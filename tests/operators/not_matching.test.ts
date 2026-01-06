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
    const result = orders.not_matching(customers);
    const expected = Bmg([
      { oid: 3, customer_id: 'C3', amount: 150 },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('returns all when no matches', () => {
    const empty = Bmg([{ customer_id: 'C99' }]);
    const result = orders.not_matching(empty);
    expect(result.isEqual(orders)).to.be.true;
  })

  it('returns empty when all match', () => {
    const all = Bmg([
      { customer_id: 'C1' },
      { customer_id: 'C2' },
      { customer_id: 'C3' },
    ]);
    const result = orders.not_matching(all);
    expect(result.isEqual(Bmg([]))).to.be.true;
  })

  it('supports explicit keys as [common_attr]', () => {
    const result = orders.not_matching(customers, ['customer_id']);
    const expected = Bmg([
      { oid: 3, customer_id: 'C3', amount: 150 },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('supports multiple keys as [attr1, attr2]', () => {
    const inventory = Bmg([
      { warehouse: 'W1', city: 'London', stock: 100 },
      { warehouse: 'W2', city: 'London', stock: 200 },
      { warehouse: 'W1', city: 'Paris', stock: 150 },
    ]);
    const shipments = Bmg([
      { warehouse: 'W1', city: 'London' },
    ]);
    const result = inventory.not_matching(shipments, ['warehouse', 'city']);
    const expected = Bmg([
      { warehouse: 'W2', city: 'London', stock: 200 },
      { warehouse: 'W1', city: 'Paris', stock: 150 },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('supports explicit keys as { left: right }', () => {
    const suppliers = Bmg([
      { sid: 'S1', city: 'London' },
      { sid: 'S2', city: 'Paris' },
      { sid: 'S3', city: 'Athens' },
    ]);
    const cities = Bmg([{ location: 'London' }, { location: 'Paris' }]);
    const result = suppliers.not_matching(cities, { city: 'location' });
    const expected = Bmg([{ sid: 'S3', city: 'Athens' }]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('supports multiple keys as { left1: right1, left2: right2 }', () => {
    const people = Bmg([
      { id: 1, first: 'John', last: 'Doe' },
      { id: 2, first: 'Jane', last: 'Smith' },
      { id: 3, first: 'John', last: 'Smith' },
    ]);
    const records = Bmg([
      { fname: 'John', lname: 'Doe' },
      { fname: 'Jane', lname: 'Smith' },
    ]);
    const result = people.not_matching(records, { first: 'fname', last: 'lname' });
    const expected = Bmg([
      { id: 3, first: 'John', last: 'Smith' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const res = not_matching(orders.toArray(), customers.toArray());
    const expected = orders.not_matching(customers);
    expect(Bmg(res).isEqual(expected)).to.be.true;
  })

});
