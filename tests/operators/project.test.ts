import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { SUPPLIERS } from 'tests/fixtures';
import { project , isEqual } from 'src/operators';

describe('.project', () => {

  it('keeps only specified attributes', () => {
    const result = SUPPLIERS.project(['name', 'city']);
    const expected = Bmg([
      { name: 'Smith', city: 'London' },
      { name: 'Jones', city: 'Paris' },
      { name: 'Blake', city: 'Paris' },
      { name: 'Clark', city: 'London' },
      { name: 'Adams', city: 'Athens' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('removes duplicates (set semantics)', () => {
    // Projecting to 'city' only should yield 3 unique cities, not 5 tuples
    const result = SUPPLIERS.project(['city']);
    const expected = Bmg([
      { city: 'London' },
      { city: 'Paris' },
      { city: 'Athens' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('ignores missing attributes', () => {
    // @ts-expect-error - testing runtime behavior with invalid attribute
    const result = SUPPLIERS.project(['name', 'nonexistent']);
    const smith = result.restrict({ name: 'Smith' }).one();
    expect(smith).to.have.property('name');
    expect(smith).to.not.have.property('nonexistent');
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const res = project(input, ['name', 'city']);
    const expected = SUPPLIERS.project(['name', 'city']);
    expect(isEqual(res, expected)).to.be.true;
  })

});
