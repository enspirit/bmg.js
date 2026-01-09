import { describe, it, expect } from 'vitest';
import { AsyncBmg, Bmg, isEqual } from 'src';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.one', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));
  const syncSuppliers = () => Bmg<Supplier>([...SUPPLIERS_DATA]);

  it('returns the single tuple when filtered to one', async () => {
    const got = await suppliers().restrict({ sid: 'S1' }).toRelation();
    const expected = syncSuppliers().restrict({ sid: 'S1' });
    expect(isEqual(got, expected)).to.be.true;
    // Also verify one() works
    const smith = await suppliers().restrict({ sid: 'S1' }).one();
    expect(smith.name).to.eql('Smith');
  });

  it('throws when relation is empty', async () => {
    await expect(
      suppliers().restrict({ sid: 'NONEXISTENT' }).one()
    ).rejects.toThrow('Relation is empty');
  });

  it('throws when relation has more than one tuple', async () => {
    await expect(
      suppliers().restrict({ city: 'Paris' }).one()
    ).rejects.toThrow('More than one tuple found');
  });
});
