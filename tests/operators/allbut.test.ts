import { describe, it, expect } from 'vitest';
import { SUPPLIERS } from 'tests/fixtures';
import { allbut } from 'src/operators';

describe('.allbut', () => {

  it('removes specified attributes', () => {
    const result = SUPPLIERS.allbut(['status', 'city']).toArray();
    expect(result).to.have.length(5);
    expect(result[0]).to.eql({ sid: 'S1', name: 'Smith' });
    expect(Object.keys(result[0])).to.eql(['sid', 'name']);
  })

  it('keeps all attributes when excluding none', () => {
    const result = SUPPLIERS.allbut([]).toArray();
    expect(Object.keys(result[0])).to.have.length(4);
  })

  it('ignores non-existent attributes', () => {
    const result = SUPPLIERS.allbut(['nonexistent']).toArray();
    expect(Object.keys(result[0])).to.have.length(4);
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const res = allbut(input, ['status', 'city']);
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res[0]).to.eql({ sid: 'S1', name: 'Smith' });
  })

});
