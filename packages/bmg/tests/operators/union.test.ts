import { describe, it, expect } from 'vitest';
import { Bmg, DEE, DUM } from 'src';
import { union , isEqual } from 'src/sync/operators';

describe('.union', () => {

  const left = Bmg([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]);

  const right = Bmg([
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ]);

  it('combines tuples from both relations', () => {
    const result = left.union(right);
    const expected = Bmg([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('removes duplicates', () => {
    const result = left.union(right);
    const expected = Bmg([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('is commutative (set semantics)', () => {
    const lr = left.union(right);
    const rl = right.union(left);
    expect(lr.isEqual(rl)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const res = union(left.toArray(), right.toArray());
    const expected = left.union(right);
    expect(isEqual(res, expected)).to.be.true;
  })

  describe('DEE and DUM', () => {
    it('DUM is identity: R union DUM = R', () => {
      const result = left.union(Bmg([]));
      expect(result.isEqual(left)).to.be.true;
    })

    it('DUM is identity (commutative): DUM union R = R', () => {
      const empty = Bmg<{ id: number; name: string }>([]);
      const result = empty.union(left);
      expect(result.isEqual(left)).to.be.true;
    })

    it('DEE union DEE = DEE', () => {
      const result = DEE.union(DEE);
      expect(result.isEqual(DEE)).to.be.true;
    })

    it('DEE union DUM = DEE', () => {
      const result = DEE.union(DUM);
      expect(result.isEqual(DEE)).to.be.true;
    })

    it('DUM union DEE = DEE', () => {
      const result = DUM.union(DEE);
      expect(result.isEqual(DEE)).to.be.true;
    })

    it('DUM union DUM = DUM', () => {
      const result = DUM.union(DUM);
      expect(result.isEqual(DUM)).to.be.true;
    })
  })

});
