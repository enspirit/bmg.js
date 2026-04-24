import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.extend', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));
  const syncSuppliers = () => Bmg<Supplier>([...SUPPLIERS_DATA]);

  it('extends with computed function', async () => {
    const got = await suppliers()
      .extend({ upper_name: (t) => t.name.toUpperCase() })
      .toRelation();
    const expected = syncSuppliers()
      .extend({ upper_name: (t) => t.name.toUpperCase() });
    expect(isEqual(got, expected)).to.be.true;
  });

  it('extends with attribute copy', async () => {
    const got = await suppliers()
      .extend({ name_copy: 'name' })
      .toRelation();
    const expected = syncSuppliers()
      .extend({ name_copy: 'name' });
    expect(isEqual(got, expected)).to.be.true;
  });

  it('extends with multiple attributes', async () => {
    const got = await suppliers()
      .extend({
        upper_name: (t) => t.name.toUpperCase(),
        double_status: (t) => t.status * 2,
        city_copy: 'city',
      })
      .toRelation();
    const expected = syncSuppliers()
      .extend({
        upper_name: (t) => t.name.toUpperCase(),
        double_status: (t) => t.status * 2,
        city_copy: 'city',
      });
    expect(isEqual(got, expected)).to.be.true;
  });

  it('chains with other operators', async () => {
    const got = await suppliers()
      .restrict({ city: 'London' })
      .extend({ upper_name: (t) => t.name.toUpperCase() })
      .project(['sid', 'upper_name'])
      .toRelation();
    const expected = syncSuppliers()
      .restrict({ city: 'London' })
      .extend({ upper_name: (t) => t.name.toUpperCase() })
      .project(['sid', 'upper_name']);
    expect(isEqual(got, expected)).to.be.true;
  });
});
