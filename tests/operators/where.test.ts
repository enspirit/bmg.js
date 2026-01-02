import { describe, it, expect } from 'vitest';
import { SUPPLIERS } from 'tests/fixtures';
import { where } from 'src/operators';

describe('.where', () => {

  it('allows filtering relations (alias for restrict)', () => {
    const smith = SUPPLIERS.where((t) => t.sid === 'S1').one()
    expect(smith.name).to.eql('Smith')
  })

  it('has a tuple shortcut', () => {
    const smith = SUPPLIERS.where({sid: 'S1'}).one()
    expect(smith.name).to.eql('Smith')
  })

  it('returns same result as restrict', () => {
    const withWhere = SUPPLIERS.where({city: 'Paris'});
    const withRestrict = SUPPLIERS.restrict({city: 'Paris'});
    expect(withWhere.isEqual(withRestrict)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const res = where(input, { sid: 'S1' });
    expect(Array.isArray(res)).to.toBeTruthy()
  })

});
