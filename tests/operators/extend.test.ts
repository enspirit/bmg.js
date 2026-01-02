import { describe, it, expect } from 'vitest';
import { SUPPLIERS } from 'tests/fixtures';
import { extend } from 'src/operators';

describe('.extend', () => {

  it('adds computed attributes', () => {
    const result = SUPPLIERS.extend({
      statusLabel: (t) => `Status: ${t.status}`
    }).toArray();
    expect(result[0].statusLabel).to.eql('Status: 20');
    expect(result[0].name).to.eql('Smith');
  })

  it('copies attributes with string shortcut', () => {
    const result = SUPPLIERS.extend({
      location: 'city'
    }).toArray();
    expect(result[0].location).to.eql('London');
    expect(result[0].city).to.eql('London');
  })

  it('supports multiple extensions', () => {
    const result = SUPPLIERS.extend({
      location: 'city',
      doubled: (t) => (t.status as number) * 2
    }).toArray();
    expect(result[0].location).to.eql('London');
    expect(result[0].doubled).to.eql(40);
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const res = extend(input, { location: 'city' });
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res[0].location).to.eql('London');
  })

});
