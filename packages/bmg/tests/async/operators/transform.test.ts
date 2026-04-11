import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/async';
import { createAsyncIterable } from '../fixtures';

interface TestData {
  id: number;
  name: string;
  value: number;
}

describe('AsyncRelation.transform', () => {
  const data: TestData[] = [
    { id: 1, name: 'alice', value: 10 },
    { id: 2, name: 'bob', value: 20 },
  ];

  const asyncData = () => AsyncBmg<TestData>(createAsyncIterable([...data]));
  const syncData = () => Bmg<TestData>([...data]);

  it('applies a function to all attribute values', async () => {
    const got = await asyncData().transform(String).toRelation();
    const expected = syncData().transform(String);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('applies specific functions to named attributes', async () => {
    const transformation = {
      name: (v: unknown) => (v as string).toUpperCase(),
      value: (v: unknown) => (v as number) * 2
    };
    const got = await asyncData().transform(transformation).toRelation();
    const expected = syncData().transform(transformation);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('chains multiple transformations with array', async () => {
    const transformation = [
      String,
      (v: unknown) => `[${v}]`
    ];
    const got = await asyncData().transform(transformation).toRelation();
    const expected = syncData().transform(transformation);
    expect(isEqual(got, expected)).to.be.true;
  });

  it('leaves attributes without transformers unchanged', async () => {
    const transformation = {
      name: (v: unknown) => (v as string).toUpperCase()
    };
    const got = await asyncData().transform(transformation).toRelation();
    const expected = syncData().transform(transformation);
    expect(isEqual(got, expected)).to.be.true;
  });
});
