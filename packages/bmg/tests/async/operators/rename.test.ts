import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.rename', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));
  const syncSuppliers = () => Bmg<Supplier>([...SUPPLIERS_DATA]);

  it('renames attributes using object mapping', async () => {
    const got = await suppliers()
      .rename({ name: 'supplierName', city: 'location' })
      .toRelation();
    const expected = syncSuppliers()
      .rename({ name: 'supplierName', city: 'location' });
    expect(isEqual(got, expected)).to.be.true;
  });

  it('chains with other operators', async () => {
    const got = await suppliers()
      .restrict({ city: 'London' })
      .rename({ name: 'supplierName' })
      .project(['sid', 'supplierName'])
      .toRelation();
    const expected = syncSuppliers()
      .restrict({ city: 'London' })
      .rename({ name: 'supplierName' })
      .project(['sid', 'supplierName']);
    expect(isEqual(got, expected)).to.be.true;
  });
});
