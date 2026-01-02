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
    const result = suppliers.image(shipments, 'shipments').toArray();
    expect(result).to.have.length(3);

    const smith = result.find(r => r.name === 'Smith');
    expect(smith?.shipments).to.have.length(2);
  })

  it('projects out join keys from nested tuples', () => {
    const result = suppliers.image(shipments, 'shipments').toArray();
    const smith = result.find(r => r.name === 'Smith');
    expect(smith?.shipments[0]).to.not.have.property('sid');
    expect(smith?.shipments[0]).to.have.property('pid');
    expect(smith?.shipments[0]).to.have.property('qty');
  })

  it('returns empty array for non-matching tuples', () => {
    const result = suppliers.image(shipments, 'shipments').toArray();
    const blake = result.find(r => r.name === 'Blake');
    expect(blake?.shipments).to.eql([]);
  })

  it('preserves all left attributes', () => {
    const result = suppliers.image(shipments, 'shipments').toArray();
    expect(result[0]).to.have.property('sid');
    expect(result[0]).to.have.property('name');
    expect(result[0]).to.have.property('city');
    expect(result[0]).to.have.property('shipments');
  })

  it('supports explicit keys', () => {
    const cities = Bmg([
      { location: 'London', country: 'UK' },
      { location: 'Paris', country: 'France' },
    ]);
    const result = suppliers.image(cities, 'city_info', { city: 'location' }).toArray();
    const smith = result.find(r => r.name === 'Smith');
    expect(smith?.city_info).to.have.length(1);
    expect(smith?.city_info[0]).to.eql({ country: 'UK' });
  })

  ///

  it('can be used standalone', () => {
    const res = image(suppliers.toArray(), shipments.toArray(), 'shipments');
    expect(Array.isArray(res)).to.toBeTruthy();
    expect(res).to.have.length(3);
  })

});
