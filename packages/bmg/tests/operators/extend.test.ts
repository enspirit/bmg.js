import { describe, it, expect } from 'vitest';

import { SUPPLIERS } from 'tests/fixtures';
import { extend , isEqual } from 'src/sync/operators';
import { Bmg, DEE, DUM } from 'src';

describe('.extend', () => {

  it('adds computed attributes', () => {
    const result = SUPPLIERS.extend({
      statusLabel: (t) => `Status: ${t.status}`
    });
    const smith = result.restrict({ sid: 'S1' }).one();
    expect(smith.statusLabel).to.eql('Status: 20');
    expect(smith.name).to.eql('Smith');
  })

  it('copies attributes with string shortcut', () => {
    const result = SUPPLIERS.extend({
      location: 'city'
    });
    const smith = result.restrict({ sid: 'S1' }).one();
    expect(smith.location).to.eql('London');
    expect(smith.city).to.eql('London');
  })

  it('supports multiple extensions', () => {
    const result = SUPPLIERS.extend({
      location: 'city',
      doubled: (t) => (t.status as number) * 2
    });
    const smith = result.restrict({ sid: 'S1' }).one();
    expect(smith.location).to.eql('London');
    expect(smith.doubled).to.eql(40);
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const res = extend(input, { location: 'city' });
    const expected = SUPPLIERS.extend({ location: 'city' });
    expect(isEqual(res, expected)).to.be.true;
  })

  describe('DEE and DUM', () => {
    it('DEE.extend adds attribute to the single empty tuple', () => {
      const result = DEE.extend({ x: () => 1 });
      const expected = Bmg([{ x: 1 }]);
      expect(result.isEqual(expected)).to.be.true;
    })

    it('DUM.extend = DUM (no tuples to extend)', () => {
      const result = DUM.extend({ x: () => 1 });
      expect(result.isEqual(DUM)).to.be.true;
    })
  })

});
