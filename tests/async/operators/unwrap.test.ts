import { describe, it, expect } from 'vitest';
import { Bmg, isEqual } from 'src';
import { AsyncBmg } from 'src/AsyncRelation';
import { createAsyncIterable } from '../fixtures';

describe('AsyncRelation.unwrap', () => {
  const wrappedData = [
    { sid: 'S1', name: 'Smith', details: { status: 20, city: 'London' } },
    { sid: 'S2', name: 'Jones', details: { status: 10, city: 'Paris' } },
  ];

  const asyncWrapped = () => AsyncBmg(createAsyncIterable([...wrappedData]));
  const syncWrapped = () => Bmg([...wrappedData]);

  it('unwraps nested tuple into parent', async () => {
    const got = await asyncWrapped().unwrap('details').toRelation();
    const expected = syncWrapped().unwrap('details');
    expect(isEqual(got, expected)).to.be.true;
  });

  it('merges nested attributes into parent', async () => {
    const result = await asyncWrapped().unwrap('details').toRelation();
    const smith = result.restrict({ sid: 'S1' }).one() as any;
    expect(smith.status).to.eql(20);
    expect(smith.city).to.eql('London');
  });

  it('is the inverse of wrap', async () => {
    const flatData = [
      { sid: 'S1', name: 'Smith', status: 20, city: 'London' },
      { sid: 'S2', name: 'Jones', status: 10, city: 'Paris' },
    ];
    const asyncFlat = AsyncBmg(createAsyncIterable([...flatData]));
    const syncFlat = Bmg([...flatData]);

    const roundtrip = await asyncFlat.wrap(['status', 'city'], 'details').unwrap('details').toRelation();
    expect(isEqual(roundtrip, syncFlat)).to.be.true;
  });
});
