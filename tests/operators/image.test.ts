import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { image } from 'src/operators';

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
    const smith = result.restrict({ sid: 'S1' }).one();
    expect(smith.shipments).to.have.length(2);
  })

  it('projects out join keys from nested tuples', () => {
    const result = suppliers.image(shipments, 'shipments');
    const smith = result.restrict({ sid: 'S1' }).one();
    // Check that all nested tuples have correct structure
    smith.shipments.forEach(s => {
      expect(s).to.not.have.property('sid');
      expect(s).to.have.property('pid');
      expect(s).to.have.property('qty');
    });
  })

  it('returns empty array for non-matching tuples', () => {
    const result = suppliers.image(shipments, 'shipments');
    const blake = result.restrict({ sid: 'S3' }).one();
    expect(blake.shipments).to.eql([]);
  })

  it('preserves all left attributes', () => {
    const result = suppliers.image(shipments, 'shipments');
    const smith = result.restrict({ sid: 'S1' }).one();
    expect(smith).to.have.property('sid');
    expect(smith).to.have.property('name');
    expect(smith).to.have.property('city');
    expect(smith).to.have.property('shipments');
  })

  it('supports explicit keys', () => {
    const cities = Bmg([
      { location: 'London', country: 'UK' },
      { location: 'Paris', country: 'France' },
    ]);
    const result = suppliers.image(cities, 'city_info', { city: 'location' });
    const smith = result.restrict({ sid: 'S1' }).one();
    expect(smith.city_info).to.have.length(1);
    expect(smith.city_info).to.deep.include({ country: 'UK' });
  })

  ///

  it('can be used standalone', () => {
    const res = image(suppliers.toArray(), shipments.toArray(), 'shipments');
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res).to.have.length(3);
  })

});
