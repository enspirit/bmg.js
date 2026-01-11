import { describe, it, expect } from 'vitest';
import { Bmg, DEE, DUM } from 'src';
import { SUPPLIERS } from 'tests/fixtures';
import { exclude , isEqual } from 'src/operators';

describe('.exclude', () => {

  it('filters out tuples matching the predicate', () => {
    const nonParis = SUPPLIERS.exclude({city: 'Paris'});
    const expected = Bmg([
      {sid: 'S1', name: 'Smith', status: 20, city: 'London' },
      {sid: 'S4', name: 'Clark', status: 20, city: 'London' },
      {sid: 'S5', name: 'Adams', status: 30, city: 'Athens' },
    ]);
    expect(nonParis.isEqual(expected)).to.be.true;
  })

  it('works with a function predicate', () => {
    const lowStatus = SUPPLIERS.exclude((t) => (t.status as number) >= 20);
    const expected = Bmg([
      {sid: 'S2', name: 'Jones', status: 10, city: 'Paris' },
    ]);
    expect(lowStatus.isEqual(expected)).to.be.true;
  })

  it('is the inverse of restrict', () => {
    const restricted = SUPPLIERS.restrict({city: 'Paris'});
    const excluded = SUPPLIERS.exclude({city: 'Paris'});
    // Union of restrict and exclude should give the original relation
    const reunion = restricted.union(excluded);
    expect(reunion.isEqual(SUPPLIERS)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const res = exclude(input, { city: 'Paris' });
    const expected = SUPPLIERS.exclude({ city: 'Paris' });
    expect(isEqual(res, expected)).to.be.true;
  })

  describe('DEE and DUM', () => {
    it('DEE.exclude(true) = DUM', () => {
      const result = DEE.exclude(() => true);
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('DEE.exclude(false) = DEE', () => {
      const result = DEE.exclude(() => false);
      expect(result.isEqual(DEE)).to.be.true;
    })

    it('DUM.exclude(true) = DUM', () => {
      const result = DUM.exclude(() => true);
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('DUM.exclude(false) = DUM', () => {
      const result = DUM.exclude(() => false);
      expect(result.isEqual(DUM)).to.be.true;
    })
  })

});
