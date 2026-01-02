import { describe, it, expect } from 'vitest';
import { SUPPLIERS } from 'tests/fixtures';
import { Bmg } from 'src';
import { summarize } from 'src/operators';

describe('.summarize', () => {

  it('counts tuples per group', () => {
    const result = SUPPLIERS.summarize(['city'], { count: 'count' }).toArray();
    expect(result).to.have.length(3);
    const london = result.find(r => r.city === 'London');
    expect(london?.count).to.eql(2);
    const paris = result.find(r => r.city === 'Paris');
    expect(paris?.count).to.eql(2);
  })

  it('sums values per group', () => {
    const result = SUPPLIERS.summarize(['city'], {
      totalStatus: { op: 'sum', attr: 'status' }
    }).toArray();
    const london = result.find(r => r.city === 'London');
    expect(london?.totalStatus).to.eql(40); // 20 + 20
    const paris = result.find(r => r.city === 'Paris');
    expect(paris?.totalStatus).to.eql(40); // 10 + 30
  })

  it('computes min/max per group', () => {
    const result = SUPPLIERS.summarize(['city'], {
      minStatus: { op: 'min', attr: 'status' },
      maxStatus: { op: 'max', attr: 'status' }
    }).toArray();
    const paris = result.find(r => r.city === 'Paris');
    expect(paris?.minStatus).to.eql(10);
    expect(paris?.maxStatus).to.eql(30);
  })

  it('computes average per group', () => {
    const result = SUPPLIERS.summarize(['city'], {
      avgStatus: { op: 'avg', attr: 'status' }
    }).toArray();
    const london = result.find(r => r.city === 'London');
    expect(london?.avgStatus).to.eql(20); // (20 + 20) / 2
    const paris = result.find(r => r.city === 'Paris');
    expect(paris?.avgStatus).to.eql(20); // (10 + 30) / 2
  })

  it('collects values per group', () => {
    const result = SUPPLIERS.summarize(['city'], {
      names: { op: 'collect', attr: 'name' }
    }).toArray();
    const paris = result.find(r => r.city === 'Paris');
    expect(paris?.names).to.include('Jones');
    expect(paris?.names).to.include('Blake');
  })

  it('supports custom aggregator functions', () => {
    const result = SUPPLIERS.summarize(['city'], {
      names: (tuples) => tuples.map(t => t.name).join(', ')
    }).toArray();
    const london = result.find(r => r.city === 'London');
    expect(london?.names).to.eql('Smith, Clark');
  })

  it('supports multiple group-by attributes', () => {
    const data = Bmg([
      { a: 1, b: 'x', v: 10 },
      { a: 1, b: 'x', v: 20 },
      { a: 1, b: 'y', v: 30 },
      { a: 2, b: 'x', v: 40 },
    ]);
    const result = data.summarize(['a', 'b'], { sum: { op: 'sum', attr: 'v' } }).toArray();
    expect(result).to.have.length(3);
    const ax = result.find(r => r.a === 1 && r.b === 'x');
    expect(ax?.sum).to.eql(30);
  })

  it('handles empty by array (grand total)', () => {
    const result = SUPPLIERS.summarize([], { total: 'count' }).toArray();
    expect(result).to.have.length(1);
    expect(result[0].total).to.eql(5);
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const res = summarize(input, ['city'], { count: 'count' });
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res).to.have.length(3);
  })

});
