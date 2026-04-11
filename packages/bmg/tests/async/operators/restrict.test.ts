import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.restrict', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));
  const syncSuppliers = () => Bmg<Supplier>([...SUPPLIERS_DATA]);

  it('allows filtering async relations with function predicate', async () => {
    const got = await suppliers().restrict((t) => t.sid === 'S1').toRelation();
    const expected = syncSuppliers().restrict((t) => t.sid === 'S1');
    expect(isEqual(got, expected)).to.be.true;
  });

  it('has a tuple shortcut', async () => {
    const got = await suppliers().restrict({ sid: 'S1' }).toRelation();
    const expected = syncSuppliers().restrict({ sid: 'S1' });
    expect(isEqual(got, expected)).to.be.true;
  });

  it('can chain multiple restricts', async () => {
    const got = await suppliers()
      .restrict({ city: 'Paris' })
      .restrict((t) => t.status === 30)
      .toRelation();
    const expected = syncSuppliers()
      .restrict({ city: 'Paris' })
      .restrict((t) => t.status === 30);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('is lazy - does not execute until terminal operation', async () => {
    let iterationCount = 0;
    const tracked = AsyncBmg({
      async *[Symbol.asyncIterator]() {
        iterationCount++;
        yield { id: 1 };
      }
    });

    // No iteration yet - just building the pipeline
    const filtered = tracked.restrict({ id: 1 });
    expect(iterationCount).to.eql(0);

    // Now iteration happens
    await filtered.one();
    expect(iterationCount).to.eql(1);
  });
});
