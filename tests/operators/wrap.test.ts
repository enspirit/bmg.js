import { describe, it, expect } from 'vitest';
import { Bmg, DEE, DUM } from 'src';
import { SUPPLIERS } from 'tests/fixtures';
import { wrap , isEqual } from 'src/sync/operators';

describe('.wrap', () => {

  it('wraps specified attributes into a tuple', () => {
    const result = SUPPLIERS.wrap(['status', 'city'], 'details');
    const expected = Bmg([
      { sid: 'S1', name: 'Smith', details: { status: 20, city: 'London' } },
      { sid: 'S2', name: 'Jones', details: { status: 10, city: 'Paris' } },
      { sid: 'S3', name: 'Blake', details: { status: 30, city: 'Paris' } },
      { sid: 'S4', name: 'Clark', details: { status: 20, city: 'London' } },
      { sid: 'S5', name: 'Adams', details: { status: 30, city: 'Athens' } },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('preserves non-wrapped attributes', () => {
    const result = SUPPLIERS.wrap(['status', 'city'], 'details');
    const smith = result.restrict({ sid: 'S1' }).one();
    expect(smith.sid).to.eql('S1');
    expect(smith.name).to.eql('Smith');
    expect(Object.keys(smith).sort()).to.eql(['details', 'name', 'sid']);
  })

  it('handles wrapping all attributes', () => {
    const result = SUPPLIERS.wrap(['sid', 'name', 'status', 'city'], 'all');
    const expected = Bmg([
      { all: { sid: 'S1', name: 'Smith', status: 20, city: 'London' } },
      { all: { sid: 'S2', name: 'Jones', status: 10, city: 'Paris' } },
      { all: { sid: 'S3', name: 'Blake', status: 30, city: 'Paris' } },
      { all: { sid: 'S4', name: 'Clark', status: 20, city: 'London' } },
      { all: { sid: 'S5', name: 'Adams', status: 30, city: 'Athens' } },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('handles wrapping single attribute', () => {
    const result = SUPPLIERS.wrap(['city'], 'location');
    const smith = result.restrict({ sid: 'S1' }).one();
    expect(smith.location).to.eql({ city: 'London' });
  })

  ///

  it('can be used standalone', () => {
    const res = wrap(SUPPLIERS.toArray(), ['status', 'city'], 'details');
    const expected = SUPPLIERS.wrap(['status', 'city'], 'details');
    expect(isEqual(res, expected)).to.be.true;
  })

  describe('DEE and DUM', () => {
    it('DEE.wrap([], attr) creates tuple with empty nested object', () => {
      const result = DEE.wrap([], 'wrapped');
      const expected = Bmg([{ wrapped: {} }]);
      expect(result.isEqual(expected)).to.be.true;
    })

    it('DUM.wrap([], attr) = DUM (no tuples to wrap)', () => {
      const result = DUM.wrap([], 'wrapped');
      expect(result.isEqual(DUM)).to.be.true;
    })
  })

});
