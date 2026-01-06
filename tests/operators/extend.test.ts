import { describe, it, expect } from 'vitest';

import { SUPPLIERS } from 'tests/fixtures';
import { extend , isEqual } from 'src/operators';

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

});
