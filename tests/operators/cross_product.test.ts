import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { cross_product, cross_join } from 'src/operators';

describe('.cross_product', () => {

  const colors = Bmg([
    { color: 'red' },
    { color: 'blue' },
  ]);

  const sizes = Bmg([
    { size: 'S' },
    { size: 'M' },
    { size: 'L' },
  ]);

  it('computes cartesian product of two relations', () => {
    const result = colors.cross_product(sizes);
    const expected = Bmg([
      { color: 'red', size: 'S' },
      { color: 'red', size: 'M' },
      { color: 'red', size: 'L' },
      { color: 'blue', size: 'S' },
      { color: 'blue', size: 'M' },
      { color: 'blue', size: 'L' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('cross_join is an alias for cross_product', () => {
    const withCrossProduct = colors.cross_product(sizes);
    const withCrossJoin = colors.cross_join(sizes);
    expect(withCrossProduct.isEqual(withCrossJoin)).to.be.true;
  })

  it('handles DUM', () => {
    const empty = Bmg([]);
    const result = colors.cross_product(empty);
    expect(result.toArray()).to.eql([]);
  })

  it('handles DEE', () => {
    const empty = Bmg([{}]);
    const result = colors.cross_product(empty);
    expect(result.isEqual(colors)).to.be.true;
  })

  it('clashing right attributes are ignored', () => {
    const left = Bmg([{ x: 1, y: 2 }]);
    const right = Bmg([{ y: 100, z: 3 }]);
    const result = left.cross_product(right);
    const expected = Bmg([{ x: 1, y: 2, z: 3 }]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('clashing right attributes are ignored with multiple tuples', () => {
    const left = Bmg([
      { x: 1, y: 'a' },
      { x: 2, y: 'b' },
    ]);
    const right = Bmg([
      { y: 'ignored', z: 10 },
      { y: 'also_ignored', z: 20 },
    ]);
    const result = left.cross_product(right);
    const expected = Bmg([
      { x: 1, y: 'a', z: 10 },
      { x: 1, y: 'a', z: 20 },
      { x: 2, y: 'b', z: 10 },
      { x: 2, y: 'b', z: 20 },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const res = cross_product(colors.toArray(), sizes.toArray());
    const expected = colors.cross_product(sizes);
    expect(Bmg(res).isEqual(expected)).to.be.true;
  })

  it('cross_join standalone is also available', () => {
    const res = cross_join(colors.toArray(), sizes.toArray());
    const expected = colors.cross_join(sizes);
    expect(Bmg(res).isEqual(expected)).to.be.true;
  })

});
