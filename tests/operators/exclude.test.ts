import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { SUPPLIERS } from 'tests/fixtures';
import { exclude } from 'src/operators';

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
    expect(Bmg(res).isEqual(expected)).to.be.true;
  })

});
