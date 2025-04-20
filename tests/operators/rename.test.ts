import { describe, it, expect } from 'vitest';
import { SUPPLIERS } from 'tests/fixtures';
import { rename } from 'src/operators';

describe('.rename', () => {

  const expected = [
    {id: 'S1', lastname: 'Smith', status: 20, city: 'London' },
    {id: 'S2', lastname: 'Jones', status: 10, city: 'Paris' },
    {id: 'S3', lastname: 'Blake', status: 30, city: 'Paris' },
    {id: 'S4', lastname: 'Clark', status: 20, city: 'London' },
    {id: 'S5', lastname: 'Adams', status: 30, city: 'Athens' },
  ]

  const renaming = {sid: 'id', name: 'lastname'}

  it('allows renaming relation tuples', () => {
    const renamed = SUPPLIERS.rename(renaming)
    expect(renamed.toArray()).to.eql(expected)
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const renamed = rename(input, renaming);
    expect(renamed).to.eql(expected)
  })

  it('supports a pure function', () => {
    const input = SUPPLIERS.toArray();
    const renamed = rename(input, (attr) => attr.toUpperCase());
    expect(Object.keys(renamed[0])).to.eql(['SID', 'NAME', 'STATUS', 'CITY'])
  })

});
