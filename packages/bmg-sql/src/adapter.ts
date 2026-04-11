/**
 * Database adapter interface.
 *
 * Abstracts the database driver so bmg-sql can work with any SQL database.
 * Concrete adapters live in separate packages (e.g., @enspirit/bmg-pg).
 */
import type { SqlDialect } from './dialect';

export interface DatabaseAdapter {
  /** Execute a SQL query and return all rows */
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;

  /** Execute a SQL query and stream rows via cursor (for large result sets) */
  stream<T = Record<string, unknown>>(sql: string, params?: unknown[]): AsyncIterable<T>;

  /** The SQL dialect for this database */
  dialect: SqlDialect;
}
