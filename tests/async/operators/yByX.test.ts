import { describe, it, expect } from 'vitest';
import { AsyncBmg } from 'src/AsyncRelation';
import { createAsyncIterable, SUPPLIERS_DATA, Supplier } from '../fixtures';

describe('AsyncRelation.yByX', () => {
  const suppliers = () => AsyncBmg<Supplier>(createAsyncIterable([...SUPPLIERS_DATA]));

  it('builds a key-value map from two attributes', async () => {
    const got = await suppliers().yByX('name', 'sid');
    expect(got).to.eql({
      'S1': 'Smith',
      'S2': 'Jones',
      'S3': 'Blake',
      'S4': 'Clark',
      'S5': 'Adams',
    });
  });

  it('works with different attributes', async () => {
    const got = await suppliers().yByX('city', 'sid');
    expect(got).to.eql({
      'S1': 'London',
      'S2': 'Paris',
      'S3': 'Paris',
      'S4': 'London',
      'S5': 'Athens',
    });
  });
});
