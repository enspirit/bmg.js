import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.toArray', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));
  const syncSuppliers = () => Bmg<Supplier>([...SUPPLIERS_DATA]);

  it('collects all tuples into a relation', async () => {
    const got = await suppliers().toRelation();
    const expected = syncSuppliers();
    expect(isEqual(got, expected)).to.be.true;
  });

  it('returns empty relation for empty result', async () => {
    const got = await suppliers().restrict({ sid: 'NONEXISTENT' }).toRelation();
    const expected = syncSuppliers().restrict({ sid: 'NONEXISTENT' });
    expect(isEqual(got, expected)).to.be.true;
  });

  it('works after chained operations', async () => {
    const got = await suppliers()
      .restrict({ city: 'London' })
      .project(['name'])
      .toRelation();
    const expected = syncSuppliers()
      .restrict({ city: 'London' })
      .project(['name']);
    expect(isEqual(got, expected)).to.be.true;
  });
});
