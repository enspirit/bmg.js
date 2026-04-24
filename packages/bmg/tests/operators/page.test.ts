import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';

describe('.page', () => {
  const data = Bmg([
    { sid: 'S1', name: 'Smith', city: 'London', status: 20 },
    { sid: 'S2', name: 'Jones', city: 'Paris',  status: 10 },
    { sid: 'S3', name: 'Blake', city: 'Paris',  status: 30 },
    { sid: 'S4', name: 'Clark', city: 'London', status: 20 },
    { sid: 'S5', name: 'Adams', city: 'Athens', status: 30 },
  ]);

  it('returns the first page sorted ASC by a single attr', () => {
    const page1 = data.page(['name'], 1, { pageSize: 2 });
    expect(page1.toArray()).toEqual([
      { sid: 'S5', name: 'Adams', city: 'Athens', status: 30 },
      { sid: 'S3', name: 'Blake', city: 'Paris',  status: 30 },
    ]);
  });

  it('returns a later page (offset = (page-1) * pageSize)', () => {
    const page2 = data.page(['name'], 2, { pageSize: 2 });
    expect(page2.toArray()).toEqual([
      { sid: 'S4', name: 'Clark', city: 'London', status: 20 },
      { sid: 'S2', name: 'Jones', city: 'Paris',  status: 10 },
    ]);
  });

  it('accepts [attr, "desc"] tuples', () => {
    const page1 = data.page([['status', 'desc'], 'name'], 1, { pageSize: 3 });
    expect(page1.toArray()).toEqual([
      { sid: 'S5', name: 'Adams', city: 'Athens', status: 30 },
      { sid: 'S3', name: 'Blake', city: 'Paris',  status: 30 },
      { sid: 'S4', name: 'Clark', city: 'London', status: 20 },
    ]);
  });

  it('default pageSize is 20 (returns everything when there are fewer)', () => {
    const full = data.page(['sid'], 1);
    expect(full.toArray().length).toBe(5);
  });

  it('returns an empty relation when the page is past the end', () => {
    const page99 = data.page(['sid'], 99, { pageSize: 2 });
    expect(page99.toArray()).toEqual([]);
  });
});
