import { describe, it, expect } from 'vitest';
import { Bmg, DEE, DUM } from 'src';
import { matching , isEqual } from 'src/operators';

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

  it('supports explicit keys as [common_attr]', () => {
    const result = orders.matching(customers, ['customer_id']);
    const expected = Bmg([
      { oid: 1, customer_id: 'C1', amount: 100 },
      { oid: 2, customer_id: 'C2', amount: 200 },
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
      { warehouse: 'W1', city: 'Paris' },
    ]);
    const result = inventory.matching(shipments, ['warehouse', 'city']);
    const expected = Bmg([
      { warehouse: 'W1', city: 'London', stock: 100 },
      { warehouse: 'W1', city: 'Paris', stock: 150 },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('supports explicit keys as { left: right }', () => {
    const suppliers = Bmg([
      { sid: 'S1', city: 'London' },
      { sid: 'S2', city: 'Paris' },
    ]);
    const cities = Bmg([{ location: 'London' }]);
    const result = suppliers.matching(cities, { city: 'location' });
    const expected = Bmg([{ sid: 'S1', city: 'London' }]);
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
    const result = people.matching(records, { first: 'fname', last: 'lname' });
    const expected = Bmg([
      { id: 1, first: 'John', last: 'Doe' },
      { id: 2, first: 'Jane', last: 'Smith' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  describe('DEE and DUM', () => {
    it('R matching DEE = R (DEE matches everything)', () => {
      const result = orders.matching(DEE);
      expect(result.isEqual(orders)).to.be.true;
    })

    it('R matching DUM = DUM (nothing to match against)', () => {
      const result = orders.matching(DUM);
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('DEE matching R = DEE (DEE tuple matches any relation with tuples)', () => {
      const result = DEE.matching(customers);
      expect(result.isEqual(DEE)).to.be.true;
    })

    it('DEE matching DUM = DUM (no tuples to match)', () => {
      const result = DEE.matching(DUM);
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('DUM matching R = DUM (no tuples to keep)', () => {
      const result = DUM.matching(customers);
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('DUM matching DEE = DUM', () => {
      const result = DUM.matching(DEE);
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('DEE matching DEE = DEE', () => {
      const result = DEE.matching(DEE);
      expect(result.isEqual(DEE)).to.be.true;
    })

    it('DUM matching DUM = DUM', () => {
      const result = DUM.matching(DUM);
      expect(result.isEqual(DUM)).to.be.true;
    })
  })

  ///

  it('can be used standalone', () => {
    const res = matching(orders.toArray(), customers.toArray());
    const expected = orders.matching(customers);
    expect(isEqual(res, expected)).to.be.true;
  })

});
