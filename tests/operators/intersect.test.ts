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
    const result = left.intersect(right).toArray();
    expect(result).to.have.length(2);
    expect(result[0]).to.eql({ id: 2, name: 'Bob' });
    expect(result[1]).to.eql({ id: 3, name: 'Charlie' });
  })

  it('returns empty when no overlap', () => {
    const other = Bmg([{ id: 99, name: 'Nobody' }]);
    const result = left.intersect(other).toArray();
    expect(result).to.have.length(0);
  })

  it('returns all when identical', () => {
    const result = left.intersect(left).toArray();
    expect(result).to.have.length(3);
  })

  ///

  it('can be used standalone', () => {
    const res = intersect(left.toArray(), right.toArray());
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res).to.have.length(2);
  })

});
