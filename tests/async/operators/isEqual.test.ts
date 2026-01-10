import { describe, it, expect } from 'vitest';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncBmg.isEqual', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));

  it('returns true for equal relations', async () => {
    const left = suppliers();
    const right = suppliers();
    const result = await AsyncBmg.isEqual(left, right);
    expect(result).toBe(true);
  });

  it('returns true regardless of tuple order', async () => {
    const left = suppliers();
    const reversed = AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA].reverse()));
    const result = await AsyncBmg.isEqual(left, reversed);
    expect(result).toBe(true);
  });

  it('returns false for relations with different tuples', async () => {
    const left = suppliers();
    const right = suppliers().restrict(s => s.city === 'London');
    const result = await AsyncBmg.isEqual(left, right);
    expect(result).toBe(false);
  });

  it('returns false for relations with different size', async () => {
    const left = suppliers();
    const smaller = AsyncBmg<Supplier>(createAsyncIterable([SUPPLIERS_DATA[0], SUPPLIERS_DATA[1]]));
    const result = await AsyncBmg.isEqual(left, smaller);
    expect(result).toBe(false);
  });

  it('returns true for empty relations', async () => {
    const left = AsyncBmg<Supplier>(createAsyncIterable([]));
    const right = AsyncBmg<Supplier>(createAsyncIterable([]));
    const result = await AsyncBmg.isEqual(left, right);
    expect(result).toBe(true);
  });

  it('works with projected relations', async () => {
    const left = suppliers().project(['sid', 'name']);
    const right = suppliers().project(['sid', 'name']);
    const result = await AsyncBmg.isEqual(left, right);
    expect(result).toBe(true);
  });

  it('returns false when projection differs', async () => {
    const left = suppliers().project(['sid', 'name']);
    const right = suppliers().project(['sid', 'city']);
    const result = await AsyncBmg.isEqual(left, right);
    expect(result).toBe(false);
  });
});
