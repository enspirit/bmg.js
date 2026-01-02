import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { SUPPLIERS } from 'tests/fixtures';
import { rename } from 'src/operators';

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
    const renamed = rename(input, renaming);
    expect(Array.isArray(renamed)).to.toBeTruthy();
  })

  it('supports a pure function', () => {
    const input = SUPPLIERS.toArray();
    const renamed = rename(input, (attr) => attr.toUpperCase());
    const smith = Bmg(renamed).restrict({ SID: 'S1' }).one();
    const keys = Object.keys(smith).sort();
    expect(keys).to.eql(['CITY', 'NAME', 'SID', 'STATUS']);
  })

});
