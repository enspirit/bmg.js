import { describe, it, expect } from 'vitest';
import { SUPPLIERS } from 'tests/fixtures';
import { wrap } from 'src/operators';

describe('.wrap', () => {

  it('wraps specified attributes into a tuple', () => {
    const result = SUPPLIERS.wrap(['status', 'city'], 'details').toArray();
    expect(result).to.have.length(5);
    expect(result[0].details).to.eql({ status: 20, city: 'London' });
  })

  it('preserves non-wrapped attributes', () => {
    const result = SUPPLIERS.wrap(['status', 'city'], 'details').toArray();
    expect(result[0].sid).to.eql('S1');
    expect(result[0].name).to.eql('Smith');
    expect(Object.keys(result[0]).sort()).to.eql(['details', 'name', 'sid']);
  })

  it('handles wrapping all attributes', () => {
    const result = SUPPLIERS.wrap(['sid', 'name', 'status', 'city'], 'all').toArray();
    expect(result[0]).to.eql({
      all: { sid: 'S1', name: 'Smith', status: 20, city: 'London' }
    });
  })

  it('handles wrapping single attribute', () => {
    const result = SUPPLIERS.wrap(['city'], 'location').toArray();
    expect(result[0].location).to.eql({ city: 'London' });
  })

  ///

  it('can be used standalone', () => {
    const res = wrap(SUPPLIERS.toArray(), ['status', 'city'], 'details');
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res[0].details).to.eql({ status: 20, city: 'London' });
  })

});
