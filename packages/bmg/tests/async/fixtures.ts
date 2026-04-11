/**
 * Creates an AsyncIterable from an array of data.
 * Simulates an async data source like a database.
 */
export function createAsyncIterable<T>(data: T[]): AsyncIterable<T> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const item of data) {
        yield item;
      }
    }
  };
}

/**
 * Test data matching the sync SUPPLIERS fixture.
 */
export const SUPPLIERS_DATA: Supplier[] = [
  { sid: 'S1', name: 'Smith', status: 20, city: 'London' },
  { sid: 'S2', name: 'Jones', status: 10, city: 'Paris' },
  { sid: 'S3', name: 'Blake', status: 30, city: 'Paris' },
  { sid: 'S4', name: 'Clark', status: 20, city: 'London' },
  { sid: 'S5', name: 'Adams', status: 30, city: 'Athens' },
];

export type Supplier = {
  sid: string;
  name: string;
  status: number;
  city: string;
}
