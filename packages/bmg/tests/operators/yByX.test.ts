import { describe, it, expect } from 'vitest';
import { SUPPLIERS } from 'tests/fixtures';
import { yByX } from 'src/sync/operators';

describe('.yByX', () => {

  it('is available on relations', () => {
    expect(SUPPLIERS.yByX('name', 'sid')).to.eql({
      'S1': 'Smith',
      'S2': 'Jones',
      'S3': 'Blake',
      'S4': 'Clark',
      'S5': 'Adams',
    })
  })

  ///

  it('can be used standalone', () => {
    const tuples = [
      {sid: 'S1', name: 'Smith'},
      {sid: 'S2', name: 'Jones'},
    ]
    expect(yByX(tuples, 'name', 'sid')).to.eql(
      {
        'S1': 'Smith',
        'S2': 'Jones',
      }
    )
  })

});
