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
    const result = suppliers.join(parts).toArray();
    expect(result).to.have.length(3);
    expect(result[0]).to.eql({ sid: 'S1', name: 'Smith', city: 'London', pid: 'P1', pname: 'Nut' });
  })

  it('joins on specified attributes (array)', () => {
    const result = suppliers.join(parts, ['city']).toArray();
    expect(result).to.have.length(3);
  })

  it('joins on different attribute names (object)', () => {
    const locations = Bmg([
      { location: 'London', country: 'UK' },
      { location: 'Paris', country: 'France' },
    ]);
    const result = suppliers.join(locations, { city: 'location' }).toArray();
    expect(result).to.have.length(3);
    expect(result[0].city).to.eql('London');
    expect(result[0].country).to.eql('UK');
  })

  it('returns empty for no matches', () => {
    const other = Bmg([{ city: 'Tokyo' }]);
    const result = suppliers.join(other).toArray();
    expect(result).to.have.length(0);
  })

  it('handles cartesian product when no common attrs', () => {
    const colors = Bmg([{ color: 'red' }, { color: 'blue' }]);
    const sizes = Bmg([{ size: 'S' }, { size: 'M' }]);
    const result = colors.join(sizes).toArray();
    expect(result).to.have.length(4);
  })

  ///

  it('can be used standalone', () => {
    const res = join(suppliers.toArray(), parts.toArray(), ['city']);
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res).to.have.length(3);
  })

});
