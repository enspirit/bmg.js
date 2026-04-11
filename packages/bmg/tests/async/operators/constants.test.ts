import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.constants', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));
  const syncSuppliers = () => Bmg<Supplier>([...SUPPLIERS_DATA]);

  it('adds constant attributes to each tuple', async () => {
    const got = await suppliers()
      .constants({ country: 'UK', year: 2024 })
      .toRelation();
    const expected = syncSuppliers()
      .constants({ country: 'UK', year: 2024 });
    expect(isEqual(got, expected)).to.be.true;
  });

  it('chains with other operators', async () => {
    const got = await suppliers()
      .restrict({ city: 'London' })
      .constants({ country: 'UK' })
      .project(['sid', 'name', 'country'])
      .toRelation();
    const expected = syncSuppliers()
      .restrict({ city: 'London' })
      .constants({ country: 'UK' })
      .project(['sid', 'name', 'country']);
    expect(isEqual(got, expected)).to.be.true;
  });
});
