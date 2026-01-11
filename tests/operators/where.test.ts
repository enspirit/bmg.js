import { describe, it, expect } from 'vitest';

import { SUPPLIERS } from 'tests/fixtures';
import { where , isEqual } from 'src/operators';
import { DEE, DUM } from 'src';

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
    const expected = SUPPLIERS.where({ sid: 'S1' });
    expect(isEqual(res, expected)).to.be.true;
  })

  describe('DEE and DUM', () => {
    it('DEE.where(true) = DEE', () => {
      const result = DEE.where(() => true);
      expect(result.isEqual(DEE)).to.be.true;
    })

    it('DEE.where(false) = DUM', () => {
      const result = DEE.where(() => false);
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('DUM.where(true) = DUM', () => {
      const result = DUM.where(() => true);
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('DUM.where(false) = DUM', () => {
      const result = DUM.where(() => false);
      expect(result.isEqual(DUM)).to.be.true;
    })
  })

});
