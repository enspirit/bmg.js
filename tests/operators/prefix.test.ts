import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { SUPPLIERS } from 'tests/fixtures';
import { prefix , isEqual } from 'src/operators';

describe('.prefix', () => {

  it('prefixes all attribute names', () => {
    const prefixed = SUPPLIERS.prefix('supplier_');
    const expected = Bmg([
      {supplier_sid: 'S1', supplier_name: 'Smith', supplier_status: 20, supplier_city: 'London' },
      {supplier_sid: 'S2', supplier_name: 'Jones', supplier_status: 10, supplier_city: 'Paris' },
      {supplier_sid: 'S3', supplier_name: 'Blake', supplier_status: 30, supplier_city: 'Paris' },
      {supplier_sid: 'S4', supplier_name: 'Clark', supplier_status: 20, supplier_city: 'London' },
      {supplier_sid: 'S5', supplier_name: 'Adams', supplier_status: 30, supplier_city: 'Athens' },
    ]);
    expect(prefixed.isEqual(expected)).to.be.true;
  })

  it('can exclude specific attributes', () => {
    const prefixed = SUPPLIERS.prefix('s_', { except: ['sid'] });
    const smith = prefixed.restrict({sid: 'S1'}).one();
    expect(smith).to.have.property('sid', 'S1');
    expect(smith).to.have.property('s_name', 'Smith');
    expect(smith).to.have.property('s_city', 'London');
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const res = prefix(input, 'x_');
    const expected = SUPPLIERS.prefix('x_');
    expect(isEqual(res, expected)).to.be.true;
  })

});
