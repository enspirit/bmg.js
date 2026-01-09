import { describe, it, expect } from 'vitest';
import { AsyncBmg, Bmg, isEqual } from 'src';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.project', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));
  const syncSuppliers = () => Bmg<Supplier>([...SUPPLIERS_DATA]);

  it('projects to specified attributes', async () => {
    const got = await suppliers()
      .restrict({ sid: 'S1' })
      .project(['sid', 'name'])
      .toRelation();
    const expected = syncSuppliers()
      .restrict({ sid: 'S1' })
      .project(['sid', 'name']);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('deduplicates projected tuples', async () => {
    const got = await suppliers().project(['city']).toRelation();
    const expected = syncSuppliers().project(['city']);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('can chain with restrict', async () => {
    const got = await suppliers()
      .restrict({ city: 'Paris' })
      .project(['name'])
      .toRelation();
    const expected = syncSuppliers()
      .restrict({ city: 'Paris' })
      .project(['name']);
    expect(isEqual(got, expected)).to.be.true;
  });
});
