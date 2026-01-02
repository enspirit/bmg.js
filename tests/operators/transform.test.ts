import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { SUPPLIERS } from 'tests/fixtures';
import { transform } from 'src/operators';

describe('.transform', () => {

  it('applies a function to all attribute values', () => {
    const result = SUPPLIERS.transform(String);
    const smith = result.restrict({ sid: 'S1' }).one();
    expect(smith.status).to.eql('20');
    expect(smith.name).to.eql('Smith');
  })

  it('applies specific functions to named attributes', () => {
    const result = SUPPLIERS.transform({
      name: (v) => (v as string).toUpperCase(),
      status: (v) => (v as number) * 2
    });
    const smith = result.restrict({ sid: 'S1' }).one();
    expect(smith.name).to.eql('SMITH');
    expect(smith.status).to.eql(40);
    expect(smith.city).to.eql('London'); // unchanged
  })

  it('chains multiple transformations with array', () => {
    const result = SUPPLIERS.transform([
      String,
      (v) => `[${v}]`
    ]);
    const smith = result.restrict({ sid: '[S1]' }).one();
    expect(smith.status).to.eql('[20]');
    expect(smith.name).to.eql('[Smith]');
  })

  it('chains per-attribute transformations', () => {
    const result = SUPPLIERS.transform({
      name: [(v) => (v as string).toLowerCase(), (v) => (v as string).toUpperCase()]
    });
    const smith = result.restrict({ sid: 'S1' }).one();
    expect(smith.name).to.eql('SMITH');
  })

  it('leaves attributes without transformers unchanged', () => {
    const result = SUPPLIERS.transform({
      name: (v) => (v as string).toUpperCase()
    });
    const smith = result.restrict({ sid: 'S1' }).one();
    expect(smith.name).to.eql('SMITH');
    expect(smith.sid).to.eql('S1');
    expect(smith.status).to.eql(20);
    expect(smith.city).to.eql('London');
  })

  it('works with isEqual for relational comparison', () => {
    const result = SUPPLIERS.transform({
      status: (v) => (v as number) + 10
    });
    const expected = Bmg([
      { sid: 'S1', name: 'Smith', status: 30, city: 'London' },
      { sid: 'S2', name: 'Jones', status: 20, city: 'Paris' },
      { sid: 'S3', name: 'Blake', status: 40, city: 'Paris' },
      { sid: 'S4', name: 'Clark', status: 30, city: 'London' },
      { sid: 'S5', name: 'Adams', status: 40, city: 'Athens' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  ///

  it('can be used standalone', () => {
    const input = SUPPLIERS.toArray();
    const res = transform(input, { name: (v) => (v as string).toUpperCase() });
    expect(Array.isArray(res)).to.toBeTruthy();
    const smith = Bmg(res).restrict({ sid: 'S1' }).one();
    expect(smith.name).to.eql('SMITH');
  })

});
