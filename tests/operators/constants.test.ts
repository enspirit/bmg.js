import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { SUPPLIERS } from 'tests/fixtures';
import { constants } from 'src/operators';

describe('.constants', () => {

  it('adds constant attributes to all tuples', () => {
    const withType = SUPPLIERS.constants({type: 'supplier'});
    const smith = withType.restrict({sid: 'S1'}).one();
    expect(smith.type).to.eql('supplier');
    expect(smith.name).to.eql('Smith');
  })

  it('can add multiple constants', () => {
    const result = SUPPLIERS.constants({type: 'supplier', active: true});
    const jones = result.restrict({sid: 'S2'}).one();
    expect(jones.type).to.eql('supplier');
    expect(jones.active).to.eql(true);
  })

  it('overwrites existing attributes', () => {
    const result = SUPPLIERS.constants({city: 'Unknown'});
    const smith = result.restrict({sid: 'S1'}).one();
    expect(smith.city).to.eql('Unknown');
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const res = constants(input, { type: 'supplier' });
    const expected = SUPPLIERS.constants({ type: 'supplier' });
    expect(Bmg(res).isEqual(expected)).to.be.true;
  })

});
