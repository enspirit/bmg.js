import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/AsyncRelation';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.wrap', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));
  const syncSuppliers = () => Bmg<Supplier>([...SUPPLIERS_DATA]);

  it('wraps specified attributes into a tuple', async () => {
    const got = await suppliers().wrap(['status', 'city'], 'details').toRelation();
    const expected = syncSuppliers().wrap(['status', 'city'], 'details');
    expect(isEqual(got, expected)).to.be.true;
  });

  it('preserves non-wrapped attributes', async () => {
    const result = await suppliers().wrap(['status', 'city'], 'details').toRelation();
    const smith = result.restrict((t: any) => t.sid === 'S1').one() as any;
    expect(smith.sid).to.eql('S1');
    expect(smith.name).to.eql('Smith');
  });

  it('is the inverse of unwrap', async () => {
    const wrapped = await suppliers().wrap(['status', 'city'], 'details').toRelation();
    const unwrapped = wrapped.unwrap('details');
    expect(isEqual(unwrapped, syncSuppliers())).to.be.true;
  });
});
