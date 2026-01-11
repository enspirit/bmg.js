import { describe, it, expect } from 'vitest';

import { SUPPLIERS } from 'tests/fixtures';
import { restrict , isEqual } from 'src/sync/operators';
import { DEE, DUM } from 'src';

describe('.restrict', () => {

  it('allows filtering relations', () => {
    const smith = SUPPLIERS.restrict((t) => t.sid === 'S1').one()
    expect(smith.name).to.eql('Smith')
  })

  it('has a tuple shortcut', () => {
    const smith = SUPPLIERS.restrict({sid: 'S1'}).one()
    expect(smith.name).to.eql('Smith')
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const res = restrict(input, { sid: 'S1' });
    const expected = SUPPLIERS.restrict({ sid: 'S1' });
    expect(isEqual(res, expected)).to.be.true;
  })

  describe('DEE and DUM', () => {
    it('DEE.restrict(true) = DEE', () => {
      const result = DEE.restrict(() => true);
      expect(result.isEqual(DEE)).to.be.true;
    })

    it('DEE.restrict(false) = DUM', () => {
      const result = DEE.restrict(() => false);
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('DUM.restrict(true) = DUM', () => {
      const result = DUM.restrict(() => true);
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('DUM.restrict(false) = DUM', () => {
      const result = DUM.restrict(() => false);
      expect(result.isEqual(DUM)).to.be.true;
    })
  })

});
