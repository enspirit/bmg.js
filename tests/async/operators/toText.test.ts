import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.toText', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));
  const syncSuppliers = () => Bmg<Supplier>([...SUPPLIERS_DATA]);

  it('returns same text as sync relation', async () => {
    const asyncText = await suppliers().toText();
    const syncText = syncSuppliers().toText();
    expect(asyncText).to.eql(syncText);
  });

  it('works after filtering', async () => {
    const asyncText = await suppliers().restrict({ city: 'London' }).toText();
    const syncText = syncSuppliers().restrict({ city: 'London' }).toText();
    expect(asyncText).to.eql(syncText);
  });

  it('works after projection', async () => {
    const asyncText = await suppliers().project(['sid', 'name']).toText();
    const syncText = syncSuppliers().project(['sid', 'name']).toText();
    expect(asyncText).to.eql(syncText);
  });

  it('respects floatPrecision option', async () => {
    const data = [{ id: 1, value: 3.14159265 }];
    const asyncRel = AsyncBmg(createAsyncIterable(data));
    const text = await asyncRel.toText({ floatPrecision: 2 });
    expect(text).to.contain('3.14');
  });

  it('works with grouped relations', async () => {
    const asyncText = await suppliers().group(['sid', 'name', 'status'], 'suppliers').toText();
    const syncText = syncSuppliers().group(['sid', 'name', 'status'], 'suppliers').toText();
    expect(asyncText).to.eql(syncText);
  });

  it('works with DEE', async () => {
    const DEE = AsyncBmg(createAsyncIterable([{}]));
    const text = await DEE.toText();
    expect(text).to.contain('+--+');
  });

  it('works with DUM', async () => {
    const DUM = AsyncBmg(createAsyncIterable([]));
    const text = await DUM.toText();
    expect(text).to.contain('+--+');
  });
});
