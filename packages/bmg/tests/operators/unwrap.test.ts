import { describe, it, expect } from 'vitest';
import { Bmg, DEE, DUM } from 'src';
import { SUPPLIERS } from 'tests/fixtures';
import { unwrap , isEqual } from 'src/sync/operators';

describe('.unwrap', () => {

  const wrapped = Bmg([
    { sid: 'S1', name: 'Smith', details: { status: 20, city: 'London' } },
    { sid: 'S2', name: 'Jones', details: { status: 10, city: 'Paris' } },
  ]);

  it('flattens tuple-valued attribute', () => {
    const result = wrapped.unwrap('details');
    const expected = Bmg([
      { sid: 'S1', name: 'Smith', status: 20, city: 'London' },
      { sid: 'S2', name: 'Jones', status: 10, city: 'Paris' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('removes the wrapped attribute', () => {
    const result = wrapped.unwrap('details');
    const smith = result.restrict({ sid: 'S1' }).one();
    expect(smith).to.not.have.property('details');
  })

  it('is the inverse of wrap', () => {
    const roundtrip = SUPPLIERS.wrap(['status', 'city'], 'details').unwrap('details');
    expect(roundtrip.isEqual(SUPPLIERS)).to.be.true;
  })

  it('handles deeply nested unwrap', () => {
    const nested = Bmg([
      { id: 1, outer: { inner: { value: 42 } } }
    ]);
    const result = nested.unwrap('outer');
    const expected = Bmg([{ id: 1, inner: { value: 42 } }]);
    expect(result.isEqual(expected)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const res = unwrap(wrapped.toArray(), 'details');
    const expected = wrapped.unwrap('details');
    expect(isEqual(res, expected)).to.be.true;
  })

  describe('DEE and DUM', () => {
    it('unwrap with empty nested object yields parent attributes only', () => {
      const withEmpty = Bmg([{ x: 1, nested: {} }]);
      const result = withEmpty.unwrap('nested');
      const expected = Bmg([{ x: 1 }]);
      expect(result.isEqual(expected)).to.be.true;
    })

    it('DUM.unwrap = DUM (no tuples to unwrap)', () => {
      const result = DUM.unwrap('x');
      expect(result.isEqual(DUM)).to.be.true;
    })
  })

});
