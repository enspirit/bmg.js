import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { SUPPLIERS } from 'tests/fixtures';
import { suffix } from 'src/operators';

describe('.suffix', () => {

  it('suffixes all attribute names', () => {
    const suffixed = SUPPLIERS.suffix('_s');
    const expected = Bmg([
      {sid_s: 'S1', name_s: 'Smith', status_s: 20, city_s: 'London' },
      {sid_s: 'S2', name_s: 'Jones', status_s: 10, city_s: 'Paris' },
      {sid_s: 'S3', name_s: 'Blake', status_s: 30, city_s: 'Paris' },
      {sid_s: 'S4', name_s: 'Clark', status_s: 20, city_s: 'London' },
      {sid_s: 'S5', name_s: 'Adams', status_s: 30, city_s: 'Athens' },
    ]);
    expect(suffixed.isEqual(expected)).to.be.true;
  })

  it('can exclude specific attributes', () => {
    const suffixed = SUPPLIERS.suffix('_x', { except: ['sid'] });
    const smith = suffixed.restrict({sid: 'S1'}).one();
    expect(smith).to.have.property('sid', 'S1');
    expect(smith).to.have.property('name_x', 'Smith');
    expect(smith).to.have.property('city_x', 'London');
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const res = suffix(input, '_y');
    expect(Array.isArray(res)).to.toBeTruthy()
    expect(res[0]).to.have.property('sid_y')
  })

});
