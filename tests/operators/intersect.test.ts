import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { intersect } from 'src/operators';

describe('.intersect', () => {

  const left = Bmg([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ]);

  const right = Bmg([
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
    { id: 4, name: 'Diana' },
  ]);

  it('returns tuples present in both relations', () => {
    const result = left.intersect(right);
    const expected = Bmg([
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('returns empty when no overlap', () => {
    const other = Bmg([{ id: 99, name: 'Nobody' }]);
    const result = left.intersect(other);
    expect(result.isEqual(Bmg([]))).to.be.true;
  })

  it('returns all when identical', () => {
    const result = left.intersect(left);
    expect(result.isEqual(left)).to.be.true;
  })

  it('is commutative (set semantics)', () => {
    const lr = left.intersect(right);
    const rl = right.intersect(left);
    expect(lr.isEqual(rl)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const res = intersect(left.toArray(), right.toArray());
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res).to.have.length(2);
  })

});
