import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.prefix', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));
  const syncSuppliers = () => Bmg<Supplier>([...SUPPLIERS_DATA]);

  it('prefixes all attribute names', async () => {
    const got = await suppliers().prefix('supplier_').toRelation();
    const expected = syncSuppliers().prefix('supplier_');
    expect(isEqual(got, expected)).to.be.true;
  });

  it('can exclude specific attributes', async () => {
    const got = await suppliers().prefix('s_', { except: ['sid'] }).toRelation();
    const expected = syncSuppliers().prefix('s_', { except: ['sid'] });
    expect(isEqual(got, expected)).to.be.true;
  });
});
