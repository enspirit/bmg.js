import { describe, it, expect } from 'vitest';
import { Bmg, DEE, DUM } from 'src';
import { autowrap , isEqual } from 'src/sync/operators';

describe('.autowrap', () => {

  it('wraps attributes based on underscore separator by default', () => {
    const flat = Bmg([
      { id: 1, address_street: '123 Main', address_city: 'NYC' },
    ]);
    const result = flat.autowrap();
    const tuple = result.one();
    expect(tuple.id).to.eql(1);
    expect(tuple.address).to.eql({ street: '123 Main', city: 'NYC' });
  })

  it('allows custom separator', () => {
    const flat = Bmg([
      { id: 1, 'address.street': '123 Main', 'address.city': 'NYC' },
    ]);
    const result = flat.autowrap({ separator: '.' });
    const tuple = result.one();
    expect(tuple.id).to.eql(1);
    expect(tuple.address).to.eql({ street: '123 Main', city: 'NYC' });
  })

  it('handles attributes without separator', () => {
    const flat = Bmg([
      { id: 1, name: 'John' },
    ]);
    const result = flat.autowrap();
    const tuple = result.one();
    expect(tuple).to.eql({ id: 1, name: 'John' });
  })

  it('handles multiple prefixes', () => {
    const flat = Bmg([
      { id: 1, home_city: 'NYC', work_city: 'Boston' },
    ]);
    const result = flat.autowrap();
    const tuple = result.one();
    expect(tuple.id).to.eql(1);
    expect(tuple.home).to.eql({ city: 'NYC' });
    expect(tuple.work).to.eql({ city: 'Boston' });
  })

  it('handles nested separators (one level only)', () => {
    const flat = Bmg([
      { id: 1, address_home_city: 'NYC' },
    ]);
    const result = flat.autowrap();
    const tuple = result.one();
    expect(tuple.id).to.eql(1);
    // Only first level split: address -> { home_city: 'NYC' }
    expect(tuple.address).to.eql({ home_city: 'NYC' });
  })

  it('autowraps multiple tuples correctly', () => {
    const flat = Bmg([
      { id: 1, address_street: '123 Main', address_city: 'NYC' },
      { id: 2, address_street: '456 Oak', address_city: 'Boston' },
      { id: 3, address_street: '789 Pine', address_city: 'Chicago' },
    ]);
    const result = flat.autowrap();
    const expected = Bmg([
      { id: 1, address: { street: '123 Main', city: 'NYC' } },
      { id: 2, address: { street: '456 Oak', city: 'Boston' } },
      { id: 3, address: { street: '789 Pine', city: 'Chicago' } },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const input = Bmg([{ id: 1, addr_city: 'NYC' }]);
    const res = autowrap(input.toArray());
    const expected = input.autowrap();
    expect(isEqual(res, expected)).to.be.true;
  })

  describe('DEE and DUM', () => {
    it('DEE.autowrap = DEE (no attributes to wrap)', () => {
      const result = DEE.autowrap();
      expect(result.isEqual(DEE)).to.be.true;
    })

    it('DUM.autowrap = DUM (no tuples to wrap)', () => {
      const result = DUM.autowrap();
      expect(result.isEqual(DUM)).to.be.true;
    })
  })

});
