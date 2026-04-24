import { describe, it, expect } from 'vitest';
import { Bmg, DUM } from 'src';
import { rxmatch } from 'src/sync/operators';

describe('.rxmatch', () => {
  const suppliers = Bmg([
    { sid: 'S1', name: 'Smith', city: 'London' },
    { sid: 'S2', name: 'Jones', city: 'Paris' },
    { sid: 'S3', name: 'Blake', city: 'Paris' },
    { sid: 'S4', name: 'Clark', city: 'London' },
    { sid: 'S5', name: 'Adams', city: 'Athens' },
  ]);

  it('matches a substring in any of the listed attributes (case-sensitive)', () => {
    // Only 'Smith' has a capital 'S' in either city or name.
    const result = suppliers.rxmatch(['city', 'name'], 'S');
    const expected = Bmg([
      { sid: 'S1', name: 'Smith', city: 'London' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  });

  it('is case-insensitive with caseSensitive: false', () => {
    const result = suppliers.rxmatch(['city', 'name'], 's', { caseSensitive: false });
    // Matches any row where 'city' or 'name' contains 's' regardless of case.
    // Smith (name), Jones (name), Paris (city), Athens (city), Adams (name).
    // Blake (name: Blake, city: Paris) — Paris matches.
    const expected = Bmg([
      { sid: 'S1', name: 'Smith', city: 'London' },
      { sid: 'S2', name: 'Jones', city: 'Paris' },
      { sid: 'S3', name: 'Blake', city: 'Paris' },
      { sid: 'S5', name: 'Adams', city: 'Athens' },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  });

  it('empty attrs list returns the operand unchanged', () => {
    const result = suppliers.rxmatch([], 'whatever');
    expect(result.isEqual(suppliers)).to.be.true;
  });

  it('works on DUM', () => {
    const result = DUM.rxmatch([], 'x');
    expect(result.isEqual(DUM)).to.be.true;
  });

  it('can be used standalone', () => {
    const res = rxmatch(suppliers.toArray(), ['city'], 'London');
    const expected = suppliers.rxmatch(['city'], 'London');
    expect(expected.isEqual(res as any)).to.be.true;
  });
});
