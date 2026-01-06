import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { union , isEqual } from 'src/operators';

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

});
