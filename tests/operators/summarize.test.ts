import { describe, it, expect } from 'vitest';
import { SUPPLIERS } from 'tests/fixtures';
import { Bmg } from 'src';
import { summarize, isEqual } from 'src/operators';

describe('.summarize', () => {

  it('counts tuples per group', () => {
    const result = SUPPLIERS.summarize(['city'], { count: 'count' });
    const expected = Bmg([
      { city: 'London', count: 2 },
      { city: 'Paris', count: 2 },
      { city: 'Athens', count: 1 },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('sums values per group', () => {
    const result = SUPPLIERS.summarize(['city'], {
      totalStatus: { op: 'sum', attr: 'status' }
    });
    const expected = Bmg([
      { city: 'London', totalStatus: 40 },  // 20 + 20
      { city: 'Paris', totalStatus: 40 },   // 10 + 30
      { city: 'Athens', totalStatus: 30 },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('computes min/max per group', () => {
    const result = SUPPLIERS.summarize(['city'], {
      minStatus: { op: 'min', attr: 'status' },
      maxStatus: { op: 'max', attr: 'status' }
    });
    const expected = Bmg([
      { city: 'London', minStatus: 20, maxStatus: 20 },
      { city: 'Paris', minStatus: 10, maxStatus: 30 },
      { city: 'Athens', minStatus: 30, maxStatus: 30 },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('computes average per group', () => {
    const result = SUPPLIERS.summarize(['city'], {
      avgStatus: { op: 'avg', attr: 'status' }
    });
    const expected = Bmg([
      { city: 'London', avgStatus: 20 },   // (20 + 20) / 2
      { city: 'Paris', avgStatus: 20 },    // (10 + 30) / 2
      { city: 'Athens', avgStatus: 30 },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('collects values per group', () => {
    const result = SUPPLIERS.summarize(['city'], {
      names: { op: 'collect', attr: 'name' }
    });
    // collect returns arrays - check specific group
    const paris = result.restrict({ city: 'Paris' }).one();
    expect(paris.names).to.include('Jones');
    expect(paris.names).to.include('Blake');
  })

  it('supports custom aggregator functions', () => {
    const data = Bmg([
      { city: 'NYC', name: 'Alice' },
      { city: 'NYC', name: 'Bob' },
    ]);
    const result = data.summarize(['city'], {
      names: (tuples) => tuples.map(t => t.name).sort().join(', ')
    });
    const expected = Bmg([
      { city: 'NYC', names: 'Alice, Bob' }
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('supports multiple group-by attributes', () => {
    const data = Bmg([
      { a: 1, b: 'x', v: 10 },
      { a: 1, b: 'x', v: 20 },
      { a: 1, b: 'y', v: 30 },
      { a: 2, b: 'x', v: 40 },
    ]);
    const result = data.summarize(['a', 'b'], { sum: { op: 'sum', attr: 'v' } });
    const expected = Bmg([
      { a: 1, b: 'x', sum: 30 },
      { a: 1, b: 'y', sum: 30 },
      { a: 2, b: 'x', sum: 40 },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('handles empty by array (grand total)', () => {
    const result = SUPPLIERS.summarize([], { total: 'count' });
    const expected = Bmg([{ total: 5 }]);
    expect(result.isEqual(expected)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const standalone = summarize(SUPPLIERS.toArray(), ['city'], { count: 'count' });
    const expected = SUPPLIERS.summarize(['city'], { count: 'count' });
    expect(isEqual(standalone, expected)).to.be.true;
  })

});
