import { describe, it, expect } from 'vitest';
import { Bmg, DEE, DUM } from 'src';
import { SUPPLIERS } from 'tests/fixtures';
import { rename , isEqual } from 'src/sync/operators';

describe('.rename', () => {

  const renaming = {sid: 'id', name: 'lastname'}

  it('allows renaming relation tuples', () => {
    const renamed = SUPPLIERS.rename(renaming);
    const expected = Bmg([
      {id: 'S1', lastname: 'Smith', status: 20, city: 'London' },
      {id: 'S2', lastname: 'Jones', status: 10, city: 'Paris' },
      {id: 'S3', lastname: 'Blake', status: 30, city: 'Paris' },
      {id: 'S4', lastname: 'Clark', status: 20, city: 'London' },
      {id: 'S5', lastname: 'Adams', status: 30, city: 'Athens' },
    ]);
    expect(renamed.isEqual(expected)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const res = rename(input, renaming);
    const expected = SUPPLIERS.rename(renaming);
    expect(isEqual(res, expected)).to.be.true;
  })

  it('supports a pure function', () => {
    const input = SUPPLIERS.toArray();
    const renamed = rename(input, (attr) => attr.toUpperCase()) as any[];
    const smith = Bmg(renamed).restrict({ SID: 'S1' }).one();
    const keys = Object.keys(smith).sort();
    expect(keys).to.eql(['CITY', 'NAME', 'SID', 'STATUS']);
  })

  describe('DEE and DUM', () => {
    it('DEE.rename({}) = DEE (no attributes to rename)', () => {
      const result = DEE.rename({});
      expect(result.isEqual(DEE)).to.be.true;
    })

    it('DUM.rename({}) = DUM (no attributes to rename)', () => {
      const result = DUM.rename({});
      expect(result.isEqual(DUM)).to.be.true;
    })
  })

});
