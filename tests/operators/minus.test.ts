import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { minus , isEqual } from 'src/operators';

describe('.minus', () => {

  const left = Bmg([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ]);

  const right = Bmg([
    { id: 2, name: 'Bob' },
    { id: 4, name: 'Diana' },
  ]);

  it('returns tuples in left but not in right', () => {
    const result = left.minus(right);
    const expected = Bmg([
      { id: 1, name: 'Alice' },
      { id: 3, name: 'Charlie' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('returns empty when left is subset of right', () => {
    const small = Bmg([{ id: 2, name: 'Bob' }]);
    const result = small.minus(right);
    expect(result.isEqual(Bmg([]))).to.be.true;
  })

  it('returns all when no overlap', () => {
    const other = Bmg([{ id: 99, name: 'Nobody' }]);
    const result = left.minus(other);
    expect(result.isEqual(left)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const res = minus(left.toArray(), right.toArray());
    const expected = left.minus(right);
    expect(isEqual(res, expected)).to.be.true;
  })

});
