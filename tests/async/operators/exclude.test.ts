import { describe, it, expect } from 'vitest';
import { AsyncBmg, Bmg, isEqual } from 'src';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.exclude', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));
  const syncSuppliers = () => Bmg<Supplier>([...SUPPLIERS_DATA]);

  it('excludes matching tuples', async () => {
    const got = await suppliers().exclude({ city: 'London' }).toRelation();
    const expected = syncSuppliers().exclude({ city: 'London' });
    expect(isEqual(got, expected)).to.be.true;
  });

  it('excludes with function predicate', async () => {
    const got = await suppliers().exclude((t) => t.status >= 20).toRelation();
    const expected = syncSuppliers().exclude((t) => t.status >= 20);
    expect(isEqual(got, expected)).to.be.true;
  });
});
