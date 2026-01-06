import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { join } from 'src/operators';

describe('.join', () => {

  const suppliers = Bmg([
    { sid: 'S1', name: 'Smith', city: 'London' },
    { sid: 'S2', name: 'Jones', city: 'Paris' },
    { sid: 'S3', name: 'Blake', city: 'Paris' },
  ]);

  const parts = Bmg([
    { pid: 'P1', pname: 'Nut', city: 'London' },
    { pid: 'P2', pname: 'Bolt', city: 'Paris' },
    { pid: 'P3', pname: 'Screw', city: 'Athens' },
  ]);

  it('performs natural join on common attributes', () => {
    const result = suppliers.join(parts);
    const expected = Bmg([
      { sid: 'S1', name: 'Smith', city: 'London', pid: 'P1', pname: 'Nut' },
      { sid: 'S2', name: 'Jones', city: 'Paris', pid: 'P2', pname: 'Bolt' },
      { sid: 'S3', name: 'Blake', city: 'Paris', pid: 'P2', pname: 'Bolt' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('joins on specified attributes (array)', () => {
    const result = suppliers.join(parts, ['city']);
    expect(result.toArray()).to.have.length(3);
  })

  it('joins on different attribute names (object)', () => {
    const locations = Bmg([
      { location: 'London', country: 'UK' },
      { location: 'Paris', country: 'France' },
    ]);
    const result = suppliers.join(locations, { city: 'location' });
    // Note: 'location' is excluded as it's the matching key on the right
    const expected = Bmg([
      { sid: 'S1', name: 'Smith', city: 'London', country: 'UK' },
      { sid: 'S2', name: 'Jones', city: 'Paris', country: 'France' },
      { sid: 'S3', name: 'Blake', city: 'Paris', country: 'France' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('returns empty for no matches', () => {
    const other = Bmg([{ city: 'Tokyo' }]);
    const result = suppliers.join(other);
    expect(result.isEqual(Bmg([]))).to.be.true;
  })

  it('handles cartesian product when no common attrs', () => {
    const colors = Bmg([{ color: 'red' }, { color: 'blue' }]);
    const sizes = Bmg([{ size: 'S' }, { size: 'M' }]);
    const result = colors.join(sizes);
    const expected = Bmg([
      { color: 'red', size: 'S' },
      { color: 'red', size: 'M' },
      { color: 'blue', size: 'S' },
      { color: 'blue', size: 'M' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const res = join(suppliers.toArray(), parts.toArray(), ['city']);
    const expected = suppliers.join(parts, ['city']);
    expect(Bmg(res).isEqual(expected)).to.be.true;
  })

});
