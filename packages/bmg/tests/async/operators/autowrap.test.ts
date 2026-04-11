import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable } from '../fixtures';

describe('AsyncRelation.autowrap', () => {
  it('wraps attributes based on underscore separator by default', async () => {
    const flatData = [
      { id: 1, address_street: '123 Main', address_city: 'NYC' },
    ];
    const asyncFlat = AsyncBmg(createAsyncIterable([...flatData]));
    const syncFlat = Bmg([...flatData]);

    const got = await asyncFlat.autowrap().toRelation();
    const expected = syncFlat.autowrap();
    expect(isEqual(got, expected)).to.be.true;
  });

  it('allows custom separator', async () => {
    const flatData = [
      { id: 1, 'address.street': '123 Main', 'address.city': 'NYC' },
    ];
    const asyncFlat = AsyncBmg(createAsyncIterable([...flatData]));
    const syncFlat = Bmg([...flatData]);

    const got = await asyncFlat.autowrap({ separator: '.' }).toRelation();
    const expected = syncFlat.autowrap({ separator: '.' });
    expect(isEqual(got, expected)).to.be.true;
  });

  it('handles attributes without separator', async () => {
    const flatData = [
      { id: 1, name: 'John' },
    ];
    const asyncFlat = AsyncBmg(createAsyncIterable([...flatData]));
    const syncFlat = Bmg([...flatData]);

    const got = await asyncFlat.autowrap().toRelation();
    const expected = syncFlat.autowrap();
    expect(isEqual(got, expected)).to.be.true;
  });

  it('handles multiple prefixes', async () => {
    const flatData = [
      { id: 1, home_city: 'NYC', work_city: 'Boston' },
    ];
    const asyncFlat = AsyncBmg(createAsyncIterable([...flatData]));
    const syncFlat = Bmg([...flatData]);

    const got = await asyncFlat.autowrap().toRelation();
    const expected = syncFlat.autowrap();
    expect(isEqual(got, expected)).to.be.true;
  });
});
