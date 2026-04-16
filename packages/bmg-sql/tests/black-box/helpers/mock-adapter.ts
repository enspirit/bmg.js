import { SqliteDialect } from '../../../src';
import type { DatabaseAdapter } from '../../../src';

/**
 * Mock adapter for black-box tests. We only call `.toSql()`, never execute,
 * so query/stream throw if hit — guarantees tests are purely about SQL shape.
 * Uses SqliteDialect to stay aligned with bmg-rb's target dialect.
 */
export function mockAdapter(): DatabaseAdapter {
  return {
    query: () => { throw new Error('mockAdapter: query() not expected in black-box tests'); },
    stream: () => { throw new Error('mockAdapter: stream() not expected in black-box tests'); },
    dialect: SqliteDialect,
  };
}
