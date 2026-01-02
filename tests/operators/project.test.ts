import { describe, it, expect } from 'vitest';
import { SUPPLIERS } from 'tests/fixtures';
import { project } from 'src/operators';

describe('.project', () => {

  it('keeps only specified attributes', () => {
    const result = SUPPLIERS.project(['name', 'city']).toArray();
    expect(result).to.have.length(5);
    expect(result[0]).to.eql({ name: 'Smith', city: 'London' });
    expect(Object.keys(result[0])).to.eql(['name', 'city']);
  })

  it('works with a single attribute', () => {
    const result = SUPPLIERS.project(['city']).toArray();
    expect(result).to.have.length(5);
    expect(result[0]).to.eql({ city: 'London' });
  })

  it('ignores missing attributes', () => {
    const result = SUPPLIERS.project(['name', 'nonexistent']).toArray();
    expect(result[0]).to.eql({ name: 'Smith' });
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const res = project(input, ['name', 'city']);
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res[0]).to.eql({ name: 'Smith', city: 'London' });
  })

});
