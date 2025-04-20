import { describe, it, expect } from 'vitest';
import { SUPPLIERS } from 'tests/fixtures';
import { restrict } from 'src/operators';

describe('Restrict', () => {

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
    expect(Array.isArray(res)).to.toBeTruthy()
  })

});
