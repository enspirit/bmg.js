import { describe, it, expect } from 'vitest';
import { Bmg, DEE, DUM } from 'src';
import { intersect , isEqual } from 'src/sync/operators';

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
    const expected = left.intersect(right);
    expect(isEqual(res, expected)).to.be.true;
  })

  describe('DEE and DUM', () => {
    it('R intersect DUM = DUM (nothing in common)', () => {
      const empty = Bmg<{ id: number; name: string }>([]);
      const result = left.intersect(empty);
      expect(result.isEqual(empty)).to.be.true;
    })

    it('DUM intersect R = DUM', () => {
      const empty = Bmg<{ id: number; name: string }>([]);
      const result = empty.intersect(left);
      expect(result.isEqual(empty)).to.be.true;
    })

    it('DEE intersect DEE = DEE', () => {
      const result = DEE.intersect(DEE);
      expect(result.isEqual(DEE)).to.be.true;
    })

    it('DEE intersect DUM = DUM', () => {
      const result = DEE.intersect(DUM);
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('DUM intersect DEE = DUM', () => {
      const result = DUM.intersect(DEE);
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('DUM intersect DUM = DUM', () => {
      const result = DUM.intersect(DUM);
      expect(result.isEqual(DUM)).to.be.true;
    })
  })

});
