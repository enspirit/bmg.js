import { BmgSql } from '../../../src';
import { mockAdapter } from './mock-adapter';

/**
 * Base relations used across all bmg-rb black-box tests.
 * Matches the bmg-rb suppliers-and-parts schema.
 */
export interface Supplier { sid: string; name: string; city: string; status: number; }
export interface Supply { sid: string; pid: string; qty: number; }
export interface Part { pid: string; name: string; color: string; weight: number; city: string; }
export interface City { city: string; country: string; }

export function buildFixtures() {
  const adapter = mockAdapter();
  return {
    suppliers: BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name', 'city', 'status'], { keys: [['sid']] }),
    supplies: BmgSql<Supply>(adapter, 'supplies', ['sid', 'pid', 'qty'], { keys: [['sid', 'pid']] }),
    parts: BmgSql<Part>(adapter, 'parts', ['pid', 'name', 'color', 'weight', 'city'], { keys: [['pid']] }),
    cities: BmgSql<City>(adapter, 'cities', ['city', 'country'], { keys: [['city']] }),
  };
}
