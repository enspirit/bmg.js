import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.allbut', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));
  const syncSuppliers = () => Bmg<Supplier>([...SUPPLIERS_DATA]);

  it('projects out specified attributes', async () => {
    const got = await suppliers()
      .restrict({ sid: 'S1' })
      .allbut(['status', 'city'])
      .toRelation();
    const expected = syncSuppliers()
      .restrict({ sid: 'S1' })
      .allbut(['status', 'city']);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('deduplicates after projection', async () => {
    const got = await suppliers().allbut(['sid', 'name']).toRelation();
    const expected = syncSuppliers().allbut(['sid', 'name']);
    expect(isEqual(got, expected)).to.be.true;
  });
});
