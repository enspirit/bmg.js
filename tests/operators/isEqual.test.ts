import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { isEqual } from 'src/sync/operators';

describe('.isEqual', () => {

  it('returns true for identical relations', () => {
    const r = Bmg([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
    expect(r.isEqual(r)).to.be.true;
  })

  it('returns true for relations with same tuples', () => {
    const r1 = Bmg([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
    const r2 = Bmg([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
    expect(r1.isEqual(r2)).to.be.true;
  })

  it('returns true regardless of tuple order', () => {
    const r1 = Bmg([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
    const r2 = Bmg([
      { id: 2, name: 'Bob' },
      { id: 1, name: 'Alice' },
    ]);
    expect(r1.isEqual(r2)).to.be.true;
  })

  it('returns true regardless of attribute order', () => {
    const r1 = Bmg([
      { id: 1, name: 'Alice' },
    ]);
    const r2 = Bmg([
      { name: 'Alice', id: 1 },
    ]);
    expect(r1.isEqual(r2)).to.be.true;
  })

  it('ignores duplicates (set semantics)', () => {
    const r1 = Bmg([
      { id: 1, name: 'Alice' },
      { id: 1, name: 'Alice' },
    ]);
    const r2 = Bmg([
      { id: 1, name: 'Alice' },
    ]);
    expect(r1.isEqual(r2)).to.be.true;
  })

  it('returns false for different tuple count', () => {
    const r1 = Bmg([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
    const r2 = Bmg([
      { id: 1, name: 'Alice' },
    ]);
    expect(r1.isEqual(r2)).to.be.false;
  })

  it('returns false for different tuple values', () => {
    const r1 = Bmg([
      { id: 1, name: 'Alice' },
    ]);
    const r2 = Bmg([
      { id: 1, name: 'Bob' },
    ]);
    expect(r1.isEqual(r2)).to.be.false;
  })

  it('returns false for different attributes', () => {
    const r1 = Bmg([
      { id: 1, name: 'Alice' },
    ]);
    const r2 = Bmg([
      { id: 1, city: 'Paris' },
    ]);
    expect(r1.isEqual(r2)).to.be.false;
  })

  it('returns true for empty relations', () => {
    const r1 = Bmg([]);
    const r2 = Bmg([]);
    expect(r1.isEqual(r2)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const left = [{ id: 1, name: 'Alice' }];
    const right = [{ name: 'Alice', id: 1 }];
    expect(isEqual(left, right)).to.be.true;
  })

  it('works with array operand', () => {
    const r = Bmg([{ id: 1, name: 'Alice' }]);
    const arr = [{ id: 1, name: 'Alice' }];
    expect(r.isEqual(arr)).to.be.true;
  })

});
