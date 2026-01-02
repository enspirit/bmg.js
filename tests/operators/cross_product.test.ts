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

  it('handles empty relations', () => {
    const empty = Bmg([]);
    const result = colors.cross_product(empty);
    expect(result.toArray()).to.eql([]);
  })

  it('right attributes overwrite left if same name', () => {
    const left = Bmg([{ x: 1, y: 2 }]);
    const right = Bmg([{ y: 100, z: 3 }]);
    const result = left.cross_product(right);
    const tuple = result.one();
    expect(tuple).to.eql({ x: 1, y: 100, z: 3 });
  })

  ///

  it('can be used standalone', () => {
    const res = cross_product(colors.toArray(), sizes.toArray());
    expect(Array.isArray(res)).to.toBeTruthy()
    expect(res.length).to.eql(6)
  })

  it('cross_join standalone is also available', () => {
    const res = cross_join(colors.toArray(), sizes.toArray());
    expect(Array.isArray(res)).to.toBeTruthy()
    expect(res.length).to.eql(6)
  })

});
