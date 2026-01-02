import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { union } from 'src/operators';

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
    const result = left.union(right).toArray();
    expect(result).to.have.length(3);
  })

  it('removes duplicates', () => {
    const result = left.union(right).toArray();
    const names = result.map(t => t.name);
    expect(names).to.eql(['Alice', 'Bob', 'Charlie']);
  })

  it('preserves order (left first)', () => {
    const result = left.union(right).toArray();
    expect(result[0]).to.eql({ id: 1, name: 'Alice' });
    expect(result[1]).to.eql({ id: 2, name: 'Bob' });
    expect(result[2]).to.eql({ id: 3, name: 'Charlie' });
  })

  ///

  it('can be used standalone', () => {
    const res = union(left.toArray(), right.toArray());
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res).to.have.length(3);
  })

});
