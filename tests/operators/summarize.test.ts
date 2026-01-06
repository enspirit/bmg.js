import { describe, it, expect } from 'vitest';
import { SUPPLIERS } from 'tests/fixtures';
import { Bmg } from 'src';
import { summarize } from 'src/operators';

describe('.summarize', () => {

  it('counts tuples per group', () => {
    const result = SUPPLIERS.summarize(['city'], { count: 'count' });
    const london = result.restrict({ city: 'London' }).one();
    expect(london.count).to.eql(2);
    const paris = result.restrict({ city: 'Paris' }).one();
    expect(paris.count).to.eql(2);
  })

  it('sums values per group', () => {
    const result = SUPPLIERS.summarize(['city'], {
      totalStatus: { op: 'sum', attr: 'status' }
    });
    const london = result.restrict({ city: 'London' }).one();
    expect(london.totalStatus).to.eql(40); // 20 + 20
    const paris = result.restrict({ city: 'Paris' }).one();
    expect(paris.totalStatus).to.eql(40); // 10 + 30
  })

  it('computes min/max per group', () => {
    const result = SUPPLIERS.summarize(['city'], {
      minStatus: { op: 'min', attr: 'status' },
      maxStatus: { op: 'max', attr: 'status' }
    });
    const paris = result.restrict({ city: 'Paris' }).one();
    expect(paris.minStatus).to.eql(10);
    expect(paris.maxStatus).to.eql(30);
  })

  it('computes average per group', () => {
    const result = SUPPLIERS.summarize(['city'], {
      avgStatus: { op: 'avg', attr: 'status' }
    });
    const london = result.restrict({ city: 'London' }).one();
    expect(london.avgStatus).to.eql(20); // (20 + 20) / 2
    const paris = result.restrict({ city: 'Paris' }).one();
    expect(paris.avgStatus).to.eql(20); // (10 + 30) / 2
  })

  it('collects values per group', () => {
    const result = SUPPLIERS.summarize(['city'], {
      names: { op: 'collect', attr: 'name' }
    });
    const paris = result.restrict({ city: 'Paris' }).one();
    expect(paris.names).to.include('Jones');
    expect(paris.names).to.include('Blake');
  })

  it('supports custom aggregator functions', () => {
    const result = SUPPLIERS.summarize(['city'], {
      names: (tuples) => tuples.map(t => t.name).join(', ')
    });
    const london = result.restrict({ city: 'London' }).one();
    expect(london.names).to.eql('Smith, Clark');
  })

  it('supports multiple group-by attributes', () => {
    const data = Bmg([
      { a: 1, b: 'x', v: 10 },
      { a: 1, b: 'x', v: 20 },
      { a: 1, b: 'y', v: 30 },
      { a: 2, b: 'x', v: 40 },
    ]);
    const result = data.summarize(['a', 'b'], { sum: { op: 'sum', attr: 'v' } });
    const ax = result.restrict({ a: 1, b: 'x' }).one();
    expect(ax.sum).to.eql(30);
  })

  it('handles empty by array (grand total)', () => {
    const result = SUPPLIERS.summarize([], { total: 'count' });
    const expected = Bmg([{ total: 5 }]);
    expect(result.isEqual(expected)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const res = summarize(input, ['city'], { count: 'count' });
    const expected = SUPPLIERS.summarize(['city'], { count: 'count' });
    expect(Bmg(res).isEqual(expected)).to.be.true;
  })

});
