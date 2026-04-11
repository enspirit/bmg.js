import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.suffix', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));
  const syncSuppliers = () => Bmg<Supplier>([...SUPPLIERS_DATA]);

  it('suffixes all attribute names', async () => {
    const got = await suppliers().suffix('_s').toRelation();
    const expected = syncSuppliers().suffix('_s');
    expect(isEqual(got, expected)).to.be.true;
  });

  it('can exclude specific attributes', async () => {
    const got = await suppliers().suffix('_x', { except: ['sid'] }).toRelation();
    const expected = syncSuppliers().suffix('_x', { except: ['sid'] });
    expect(isEqual(got, expected)).to.be.true;
  });
});
