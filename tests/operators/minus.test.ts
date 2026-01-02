import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { minus } from 'src/operators';

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
    const result = left.minus(right).toArray();
    expect(result).to.have.length(2);
    expect(result[0]).to.eql({ id: 1, name: 'Alice' });
    expect(result[1]).to.eql({ id: 3, name: 'Charlie' });
  })

  it('returns empty when left is subset of right', () => {
    const small = Bmg([{ id: 2, name: 'Bob' }]);
    const result = small.minus(right).toArray();
    expect(result).to.have.length(0);
  })

  it('returns all when no overlap', () => {
    const other = Bmg([{ id: 99, name: 'Nobody' }]);
    const result = left.minus(other).toArray();
    expect(result).to.have.length(3);
  })

  ///

  it('can be used standalone', () => {
    const res = minus(left.toArray(), right.toArray());
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res).to.have.length(2);
  })

});
