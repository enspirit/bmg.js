import { describe, it, expect } from 'vitest';
import { SUPPLIERS } from 'tests/fixtures';
import { one } from 'src/sync/operators';

describe('.one', () => {

  it('is available on relations', () => {
    expect(typeof SUPPLIERS.one).to.eql('function')
  })

  ///

  it('can be used standalone', () => {
    const tuple = { sid: 'S1' }
    const tuples = [tuple]
    expect(one(tuples)).to.eql(tuple)
  })

});
