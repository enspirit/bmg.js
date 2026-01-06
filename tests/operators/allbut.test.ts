import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { SUPPLIERS } from 'tests/fixtures';
import { allbut, isEqual } from 'src/operators';

describe('.allbut', () => {

  it('removes specified attributes', () => {
    const result = SUPPLIERS.allbut(['status', 'city']);
    const expected = Bmg([
      { sid: 'S1', name: 'Smith' },
      { sid: 'S2', name: 'Jones' },
      { sid: 'S3', name: 'Blake' },
      { sid: 'S4', name: 'Clark' },
      { sid: 'S5', name: 'Adams' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('removes duplicates (set semantics)', () => {
    // Keeping only status should yield 3 unique values, not 5 tuples
    const result = SUPPLIERS.allbut(['sid', 'name', 'city']);
    const expected = Bmg([
      { status: 20 },
      { status: 10 },
      { status: 30 },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('keeps all attributes when excluding none', () => {
    const result = SUPPLIERS.allbut([]);
    expect(result.isEqual(SUPPLIERS)).to.be.true;
  })

  it('ignores non-existent attributes', () => {
    // @ts-expect-error - testing runtime behavior with invalid attribute
    const result = SUPPLIERS.allbut(['nonexistent']);
    expect(result.isEqual(SUPPLIERS)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const res = allbut(input, ['status', 'city']);
    const expected = SUPPLIERS.allbut(['status', 'city']);
    expect(isEqual(res, expected)).to.be.true;
  })

});
