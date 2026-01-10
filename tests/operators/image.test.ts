import { describe, it, expect } from 'vitest';
import { Bmg, DEE, DUM } from 'src';
import { image , isEqual } from 'src/operators';

describe('.image', () => {

  const suppliers = Bmg([
    { sid: 'S1', name: 'Smith', city: 'London' },
    { sid: 'S2', name: 'Jones', city: 'Paris' },
    { sid: 'S3', name: 'Blake', city: 'Paris' },
  ]);

  const shipments = Bmg([
    { sid: 'S1', pid: 'P1', qty: 100 },
    { sid: 'S1', pid: 'P2', qty: 200 },
    { sid: 'S2', pid: 'P1', qty: 300 },
  ]);

  it('adds relation-valued attribute with matching tuples', () => {
    const result = suppliers.image(shipments, 'shipments');
    const expected = Bmg([
      {
        sid: 'S1', name: 'Smith', city: 'London',
        shipments: Bmg([
          { pid: 'P1', qty: 100 },
          { pid: 'P2', qty: 200 },
        ])
      },
      {
        sid: 'S2', name: 'Jones', city: 'Paris',
        shipments: Bmg([
          { pid: 'P1', qty: 300 },
        ])
      },
      {
        sid: 'S3', name: 'Blake', city: 'Paris',
        shipments: Bmg([])
      },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('supports explicit keys as { left: right }', () => {
    const cities = Bmg([
      { location: 'London', country: 'UK' },
      { location: 'Paris', country: 'France' },
    ]);
    const result = suppliers.image(cities, 'city_info', { city: 'location' });
    const expected = Bmg([
      { sid: 'S1', name: 'Smith', city: 'London', city_info: Bmg([{ country: 'UK' }]) },
      { sid: 'S2', name: 'Jones', city: 'Paris', city_info: Bmg([{ country: 'France' }]) },
      { sid: 'S3', name: 'Blake', city: 'Paris', city_info: Bmg([{ country: 'France' }]) },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('supports explicit keys as [common_attr]', () => {
    const result = suppliers.image(shipments, 'shipments', ['sid']);
    const expected = Bmg([
      {
        sid: 'S1', name: 'Smith', city: 'London',
        shipments: Bmg([
          { pid: 'P1', qty: 100 },
          { pid: 'P2', qty: 200 },
        ])
      },
      {
        sid: 'S2', name: 'Jones', city: 'Paris',
        shipments: Bmg([
          { pid: 'P1', qty: 300 },
        ])
      },
      {
        sid: 'S3', name: 'Blake', city: 'Paris',
        shipments: Bmg([])
      },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('supports multiple attributes as join key', () => {
    const inventory = Bmg([
      { warehouse: 'W1', city: 'London', stock: 100 },
      { warehouse: 'W2', city: 'London', stock: 200 },
      { warehouse: 'W3', city: 'Paris', stock: 150 },
    ]);
    const orders = Bmg([
      { warehouse: 'W1', city: 'London', item: 'A', qty: 10 },
      { warehouse: 'W1', city: 'London', item: 'B', qty: 20 },
      { warehouse: 'W3', city: 'Paris', item: 'C', qty: 30 },
    ]);
    const result = inventory.image(orders, 'orders', ['warehouse', 'city']);
    const expected = Bmg([
      {
        warehouse: 'W1', city: 'London', stock: 100,
        orders: Bmg([
          { item: 'A', qty: 10 },
          { item: 'B', qty: 20 },
        ])
      },
      {
        warehouse: 'W2', city: 'London', stock: 200,
        orders: Bmg([])
      },
      {
        warehouse: 'W3', city: 'Paris', stock: 150,
        orders: Bmg([
          { item: 'C', qty: 30 },
        ])
      },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  it('supports multiple attributes as { left: right } object', () => {
    const people = Bmg([
      { id: 1, first: 'John', last: 'Doe' },
      { id: 2, first: 'Jane', last: 'Smith' },
    ]);
    const records = Bmg([
      { fname: 'John', lname: 'Doe', year: 2020, score: 85 },
      { fname: 'John', lname: 'Doe', year: 2021, score: 90 },
      { fname: 'Jane', lname: 'Smith', year: 2020, score: 95 },
    ]);
    const result = people.image(records, 'scores', { first: 'fname', last: 'lname' });
    const expected = Bmg([
      {
        id: 1, first: 'John', last: 'Doe',
        scores: Bmg([
          { year: 2020, score: 85 },
          { year: 2021, score: 90 },
        ])
      },
      {
        id: 2, first: 'Jane', last: 'Smith',
        scores: Bmg([
          { year: 2020, score: 95 },
        ])
      },
    ]);
    expect(result.isEqual(expected)).to.be.true;
  })

  describe('DEE and DUM', () => {
    it('R image DEE adds DEE as image (no common attrs, DEE matches all)', () => {
      const result = suppliers.image(DEE, 'img');
      const expected = Bmg([
        { sid: 'S1', name: 'Smith', city: 'London', img: DEE },
        { sid: 'S2', name: 'Jones', city: 'Paris', img: DEE },
        { sid: 'S3', name: 'Blake', city: 'Paris', img: DEE },
      ]);
      expect(result.isEqual(expected)).to.be.true;
    })

    it('R image DUM adds DUM as image (no tuples to match)', () => {
      const result = suppliers.image(DUM, 'img');
      const expected = Bmg([
        { sid: 'S1', name: 'Smith', city: 'London', img: DUM },
        { sid: 'S2', name: 'Jones', city: 'Paris', img: DUM },
        { sid: 'S3', name: 'Blake', city: 'Paris', img: DUM },
      ]);
      expect(result.isEqual(expected)).to.be.true;
    })

    it('DEE image R adds R as image (no common attrs)', () => {
      const colors = Bmg([{ color: 'red' }, { color: 'blue' }]);
      const result = DEE.image(colors, 'colors');
      const expected = Bmg([{ colors }]);
      expect(result.isEqual(expected)).to.be.true;
    })

    it('DEE image DUM adds DUM as image', () => {
      const result = DEE.image(DUM, 'img');
      const expected = Bmg([{ img: DUM }]);
      expect(result.isEqual(expected)).to.be.true;
    })

    it('DEE image DEE adds DEE as image', () => {
      const result = DEE.image(DEE, 'img');
      const expected = Bmg([{ img: DEE }]);
      expect(result.isEqual(expected)).to.be.true;
    })

    it('DUM image R = DUM (no tuples to add images to)', () => {
      const result = DUM.image(shipments, 'shipments');
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('DUM image DEE = DUM', () => {
      const result = DUM.image(DEE, 'img');
      expect(result.isEqual(DUM)).to.be.true;
    })

    it('DUM image DUM = DUM', () => {
      const result = DUM.image(DUM, 'img');
      expect(result.isEqual(DUM)).to.be.true;
    })
  })

  ///

  it('can be used standalone', () => {
    const res = image(suppliers.toArray(), shipments.toArray(), 'shipments');
    const expected = suppliers.image(shipments, 'shipments');
    expect(isEqual(res, expected)).to.be.true;
  })

});
