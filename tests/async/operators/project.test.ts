import { describe, it, expect } from 'vitest';
import { Bmg, DEE, DUM, isEqual } from 'src';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.project', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));
  const syncSuppliers = () => Bmg<Supplier>([...SUPPLIERS_DATA]);

  it('projects to specified attributes', async () => {
    const got = await suppliers()
      .restrict({ sid: 'S1' })
      .project(['sid', 'name'])
      .toRelation();
    const expected = syncSuppliers()
      .restrict({ sid: 'S1' })
      .project(['sid', 'name']);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('deduplicates projected tuples', async () => {
    const got = await suppliers().project(['city']).toRelation();
    const expected = syncSuppliers().project(['city']);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('can chain with restrict', async () => {
    const got = await suppliers()
      .restrict({ city: 'Paris' })
      .project(['name'])
      .toRelation();
    const expected = syncSuppliers()
      .restrict({ city: 'Paris' })
      .project(['name']);
    expect(isEqual(got, expected)).to.be.true;
  });

  describe('DEE and DUM', () => {
    it('projecting on nothing yields DEE', async () => {
      // Projecting away all attributes from a non-empty relation yields DEE
      const got = await suppliers().project([]).toRelation();
      expect(isEqual(got, DEE)).to.be.true;
    });

    it('projecting DEE yields DEE', async () => {
      const asyncDee = AsyncBmg(createAsyncIterable([{}]));
      const got = await asyncDee.project([]).toRelation();
      expect(isEqual(got, DEE)).to.be.true;
    });

    it('projecting DUM yields DUM', async () => {
      const asyncDum = AsyncBmg(createAsyncIterable([]));
      const got = await asyncDum.project([]).toRelation();
      expect(isEqual(got, DUM)).to.be.true;
    });
  });
});
