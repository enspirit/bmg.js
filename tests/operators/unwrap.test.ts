import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { SUPPLIERS } from 'tests/fixtures';
import { unwrap } from 'src/operators';

describe('.unwrap', () => {

  const wrapped = Bmg([
    { sid: 'S1', name: 'Smith', details: { status: 20, city: 'London' } },
    { sid: 'S2', name: 'Jones', details: { status: 10, city: 'Paris' } },
  ]);

  it('flattens tuple-valued attribute', () => {
    const result = wrapped.unwrap('details').toArray();
    expect(result).to.have.length(2);
    expect(result[0]).to.eql({ sid: 'S1', name: 'Smith', status: 20, city: 'London' });
  })

  it('removes the wrapped attribute', () => {
    const result = wrapped.unwrap('details').toArray();
    expect(result[0]).to.not.have.property('details');
  })

  it('is the inverse of wrap', () => {
    const roundtrip = SUPPLIERS.wrap(['status', 'city'], 'details').unwrap('details').toArray();
    expect(roundtrip).to.have.length(5);
    expect(roundtrip[0]).to.eql({ sid: 'S1', name: 'Smith', status: 20, city: 'London' });
  })

  it('handles deeply nested unwrap', () => {
    const nested = Bmg([
      { id: 1, outer: { inner: { value: 42 } } }
    ]);
    const result = nested.unwrap('outer').toArray();
    expect(result[0]).to.eql({ id: 1, inner: { value: 42 } });
  })

  ///

  it('can be used standalone', () => {
    const res = unwrap(wrapped.toArray(), 'details');
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res[0]).to.eql({ sid: 'S1', name: 'Smith', status: 20, city: 'London' });
  })

});
