import { describe, it, expect } from 'vitest';
import { AsyncBmg, Bmg, isEqual } from 'src';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.where', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));
  const syncSuppliers = () => Bmg<Supplier>([...SUPPLIERS_DATA]);

  it('is an alias for restrict', async () => {
    const got = await suppliers().where({ sid: 'S1' }).toRelation();
    const expected = syncSuppliers().where({ sid: 'S1' });
    expect(isEqual(got, expected)).to.be.true;
  });
});
