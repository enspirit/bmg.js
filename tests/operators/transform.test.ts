import { describe, it, expect } from 'vitest';
import { Bmg, DEE, DUM } from 'src';
import { transform, isEqual } from 'src/sync/operators';

describe('.transform', () => {

  it('applies a function to all attribute values', () => {
    const data = Bmg([
      { id: 1, value: 10 },
      { id: 2, value: 20 },
    ]);
    const result = data.transform(String);
    const expected = Bmg([
      { id: '1', value: '10' },
      { id: '2', value: '20' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('applies specific functions to named attributes', () => {
    const data = Bmg([
      { name: 'alice', status: 10, city: 'NYC' },
      { name: 'bob', status: 20, city: 'LA' },
    ]);
    const result = data.transform({
      name: (v) => (v as string).toUpperCase(),
      status: (v) => (v as number) * 2
    });
    const expected = Bmg([
      { name: 'ALICE', status: 20, city: 'NYC' },
      { name: 'BOB', status: 40, city: 'LA' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('chains multiple transformations with array', () => {
    const data = Bmg([
      { id: 1, value: 10 },
      { id: 2, value: 20 },
    ]);
    const result = data.transform([
      String,
      (v) => `[${v}]`
    ]);
    const expected = Bmg([
      { id: '[1]', value: '[10]' },
      { id: '[2]', value: '[20]' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('chains per-attribute transformations', () => {
    const data = Bmg([
      { name: 'Alice' },
      { name: 'Bob' },
    ]);
    const result = data.transform({
      name: [(v) => (v as string).toLowerCase(), (v) => (v as string).toUpperCase()]
    });
    const expected = Bmg([
      { name: 'ALICE' },
      { name: 'BOB' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('leaves attributes without transformers unchanged', () => {
    const data = Bmg([
      { id: 1, name: 'alice', status: 10 },
      { id: 2, name: 'bob', status: 20 },
    ]);
    const result = data.transform({
      name: (v) => (v as string).toUpperCase()
    });
    const expected = Bmg([
      { id: 1, name: 'ALICE', status: 10 },
      { id: 2, name: 'BOB', status: 20 },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const data = Bmg([
      { name: 'alice', value: 10 },
      { name: 'bob', value: 20 },
    ]);
    const standalone = transform(data.toArray(), { name: (v) => (v as string).toUpperCase() });
    const expected = data.transform({ name: (v) => (v as string).toUpperCase() });
    expect(isEqual(standalone, expected)).to.be.true;
  })

  describe('DEE and DUM', () => {
    it('DEE.transform = DEE (no attributes to transform)', () => {
      const result = DEE.transform(String);
      expect(result.isEqual(DEE)).to.be.true;
    })

    it('DUM.transform = DUM (no tuples to transform)', () => {
      const result = DUM.transform(String);
      expect(result.isEqual(DUM)).to.be.true;
    })
  })

});
