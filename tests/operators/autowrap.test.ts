import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { autowrap } from 'src/operators';

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

  ///

  it('can be used standalone', () => {
    const input = [{ id: 1, addr_city: 'NYC' }];
    const res = autowrap(input);
    expect(Array.isArray(res)).to.toBeTruthy()
    const tuple = Bmg(res).restrict({ id: 1 }).one();
    expect(tuple).to.have.property('addr')
  })

});
