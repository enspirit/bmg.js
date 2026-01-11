import { describe, it, expect } from 'vitest';
import { Bmg, DEE, DUM } from 'src';
import { left_join , isEqual } from 'src/sync/operators';

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

  it('joins matching tuples and keeps non-matching with null', () => {
    const result = orders.left_join(customers);
    const expected = Bmg([
      { oid: 1, customer_id: 'C1', amount: 100, name: 'Alice' },
      { oid: 2, customer_id: 'C2', amount: 200, name: 'Bob' },
      { oid: 3, customer_id: 'C3', amount: 150, name: null },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('supports explicit keys as { left: right }', () => {
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
    const expected = Bmg([
      { sid: 'S1', city: 'London', country: 'UK' },
      { sid: 'S2', city: 'Paris', country: 'France' },
      { sid: 'S3', city: 'Athens', country: null },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('supports explicit keys as [common_attr]', () => {
    const result = orders.left_join(customers, ['customer_id']);
    const expected = Bmg([
      { oid: 1, customer_id: 'C1', amount: 100, name: 'Alice' },
      { oid: 2, customer_id: 'C2', amount: 200, name: 'Bob' },
      { oid: 3, customer_id: 'C3', amount: 150, name: null },
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
      { warehouse: 'W1', city: 'London', shipped: 50 },
    ]);
    const result = inventory.left_join(shipments, ['warehouse', 'city']);
    const expected = Bmg([
      { warehouse: 'W1', city: 'London', stock: 100, shipped: 50 },
      { warehouse: 'W2', city: 'London', stock: 200, shipped: null },
      { warehouse: 'W1', city: 'Paris', stock: 150, shipped: null },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('supports multiple keys as { left1: right1, left2: right2 }', () => {
    const people = Bmg([
      { id: 1, first: 'John', last: 'Doe' },
      { id: 2, first: 'Jane', last: 'Smith' },
      { id: 3, first: 'John', last: 'Smith' },
    ]);
    const records = Bmg([
      { fname: 'John', lname: 'Doe', score: 85 },
      { fname: 'Jane', lname: 'Smith', score: 90 },
    ]);
    const result = people.left_join(records, { first: 'fname', last: 'lname' });
    const expected = Bmg([
      { id: 1, first: 'John', last: 'Doe', score: 85 },
      { id: 2, first: 'Jane', last: 'Smith', score: 90 },
      { id: 3, first: 'John', last: 'Smith', score: null },
    ]);
    expect(result.isEqual(expected)).to.be.true;
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

  describe('DEE and DUM', () => {
    it('R left_join DEE = R (DEE is identity)', () => {
      const result = orders.left_join(DEE);
      expect(result.isEqual(orders)).to.be.true;
    })

    it('R left_join DUM = R (DUM has no attributes to add)', () => {
      const result = orders.left_join(DUM);
      expect(result.isEqual(orders)).to.be.true;
    })

    it('DEE left_join R = R (cross product with single empty tuple)', () => {
      const result = DEE.left_join(customers);
      expect(result.isEqual(customers)).to.be.true;
    })

    it('DUM left_join R = DUM (no left tuples to preserve)', () => {
      const result = DUM.left_join(customers);
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('DEE left_join DEE = DEE', () => {
      const result = DEE.left_join(DEE);
      expect(result.isEqual(DEE)).to.be.true;
    })

    it('DEE left_join DUM = DEE', () => {
      const result = DEE.left_join(DUM);
      expect(result.isEqual(DEE)).to.be.true;
    })

    it('DUM left_join DEE = DUM', () => {
      const result = DUM.left_join(DEE);
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('DUM left_join DUM = DUM', () => {
      const result = DUM.left_join(DUM);
      expect(result.isEqual(DUM)).to.be.true;
    })
  })

  ///

  it('can be used standalone', () => {
    const res = left_join(orders.toArray(), customers.toArray());
    const expected = orders.left_join(customers);
    expect(isEqual(res, expected)).to.be.true;
  })

});
