import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.summarize', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));
  const syncSuppliers = () => Bmg<Supplier>([...SUPPLIERS_DATA]);

  it('counts tuples per group', async () => {
    const got = await suppliers().summarize(['city'], { count: 'count' }).toRelation();
    const expected = syncSuppliers().summarize(['city'], { count: 'count' });
    expect(isEqual(got, expected)).to.be.true;
  });

  it('sums values per group', async () => {
    const got = await suppliers().summarize(['city'], {
      totalStatus: { op: 'sum', attr: 'status' }
    }).toRelation();
    const expected = syncSuppliers().summarize(['city'], {
      totalStatus: { op: 'sum', attr: 'status' }
    });
    expect(isEqual(got, expected)).to.be.true;
  });

  it('computes min/max per group', async () => {
    const got = await suppliers().summarize(['city'], {
      minStatus: { op: 'min', attr: 'status' },
      maxStatus: { op: 'max', attr: 'status' }
    }).toRelation();
    const expected = syncSuppliers().summarize(['city'], {
      minStatus: { op: 'min', attr: 'status' },
      maxStatus: { op: 'max', attr: 'status' }
    });
    expect(isEqual(got, expected)).to.be.true;
  });

  it('computes average per group', async () => {
    const got = await suppliers().summarize(['city'], {
      avgStatus: { op: 'avg', attr: 'status' }
    }).toRelation();
    const expected = syncSuppliers().summarize(['city'], {
      avgStatus: { op: 'avg', attr: 'status' }
    });
    expect(isEqual(got, expected)).to.be.true;
  });

  it('handles empty by array (grand total)', async () => {
    const got = await suppliers().summarize([], { total: 'count' }).toRelation();
    const expected = syncSuppliers().summarize([], { total: 'count' });
    expect(isEqual(got, expected)).to.be.true;
  });

  it('supports custom aggregator functions', async () => {
    const data = [
      { city: 'NYC', name: 'Alice' },
      { city: 'NYC', name: 'Bob' },
    ];
    const asyncData = AsyncBmg(createAsyncIterable([...data]));
    const syncData = Bmg([...data]);

    const got = await asyncData.summarize(['city'], {
      names: (tuples) => tuples.map(t => t.name).sort().join(', ')
    }).toRelation();
    const expected = syncData.summarize(['city'], {
      names: (tuples) => tuples.map(t => t.name).sort().join(', ')
    });
    expect(isEqual(got, expected)).to.be.true;
  });
});
