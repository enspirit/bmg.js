import { describe, it, expect } from 'vitest';
import { Pred } from '@enspirit/predicate';

import { SUPPLIERS } from 'tests/fixtures';
import { restrict , isEqual } from 'src/sync/operators';
import { Bmg, DEE, DUM } from 'src';

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

  describe('structured predicates', () => {
    it('accepts a Pred.eq predicate', () => {
      const smith = SUPPLIERS.restrict(Pred.eq('sid', 'S1')).one();
      expect(smith.name).to.eql('Smith');
    })

    it('accepts Pred.and with multiple conditions', () => {
      const result = SUPPLIERS.restrict(
        Pred.and(Pred.eq('city', 'London'), Pred.gte('status', 20))
      );
      const expected = Bmg([
        { sid: 'S1', name: 'Smith', status: 20, city: 'London' },
        { sid: 'S4', name: 'Clark', status: 20, city: 'London' },
      ]);
      expect(result.isEqual(expected)).to.be.true;
    })

    it('accepts Pred.or', () => {
      const result = SUPPLIERS.restrict(
        Pred.or(Pred.eq('city', 'Athens'), Pred.eq('city', 'London'))
      );
      expect(result.restrict({ city: 'Athens' }).one().name).to.eql('Adams');
    })

    it('accepts Pred.not', () => {
      const result = SUPPLIERS.restrict(
        Pred.not(Pred.eq('city', 'London'))
      );
      // Should exclude Smith (London) and Clark (London)
      expect(result.toArray().length).to.eql(3);
    })

    it('accepts Pred.in', () => {
      const result = SUPPLIERS.restrict(
        Pred.in('city', ['London', 'Paris'])
      );
      expect(result.toArray().length).to.eql(4);
    })

    it('accepts Pred.gt', () => {
      const result = SUPPLIERS.restrict(Pred.gt('status', 20));
      const expected = Bmg([
        { sid: 'S3', name: 'Blake', status: 30, city: 'Paris' },
        { sid: 'S5', name: 'Adams', status: 30, city: 'Athens' },
      ]);
      expect(result.isEqual(expected)).to.be.true;
    })

    it('tautology keeps all tuples', () => {
      const result = SUPPLIERS.restrict(Pred.tautology());
      expect(result.isEqual(SUPPLIERS)).to.be.true;
    })

    it('contradiction removes all tuples', () => {
      const result = SUPPLIERS.restrict(Pred.contradiction());
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('works with standalone restrict', () => {
      const input = SUPPLIERS.toArray();
      const res = restrict(input, Pred.eq('sid', 'S1'));
      const expected = SUPPLIERS.restrict({ sid: 'S1' });
      expect(isEqual(res, expected)).to.be.true;
    })
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
