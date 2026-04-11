/**
 * PostgresAdapter — DatabaseAdapter implementation for PostgreSQL.
 *
 * Uses the `pg` (node-postgres) library. Supports:
 * - query() for batch execution
 * - stream() for cursor-based streaming via portal queries
 */
import type { Pool, PoolClient, PoolConfig } from 'pg';
import type { DatabaseAdapter } from '@enspirit/bmg-sql';
import { PostgresDialect } from '@enspirit/bmg-sql';

export interface PostgresAdapterOptions {
  /** A pg Pool instance, or options to create one */
  pool: Pool | PoolConfig;
  /** Batch size for cursor streaming (default: 100) */
  cursorBatchSize?: number;
}

export class PostgresAdapter implements DatabaseAdapter {
  readonly dialect = PostgresDialect;
  private pool: Pool;
  private cursorBatchSize: number;

  constructor(options: PostgresAdapterOptions) {
    if ('query' in options.pool && typeof options.pool.query === 'function') {
      // Already a Pool instance
      this.pool = options.pool as Pool;
    } else {
      // Create a new Pool from config
      // Dynamic import to keep pg as a peer dependency
      const { Pool: PgPool } = require('pg');
      this.pool = new PgPool(options.pool as PoolConfig);
    }
    this.cursorBatchSize = options.cursorBatchSize ?? 100;
  }

  async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows as T[];
  }

  stream<T = Record<string, unknown>>(sql: string, params?: unknown[]): AsyncIterable<T> {
    const pool = this.pool;
    const batchSize = this.cursorBatchSize;

    return {
      [Symbol.asyncIterator](): AsyncIterator<T> {
        let client: PoolClient | null = null;
        let cursorName: string | null = null;
        let done = false;
        let buffer: T[] = [];
        let bufferIndex = 0;
        let initialized = false;

        async function init() {
          client = await pool.connect();
          cursorName = `bmg_cursor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          await client.query('BEGIN');
          const declareSQL = params && params.length > 0
            ? `DECLARE ${cursorName} CURSOR FOR ${sql}`
            : `DECLARE ${cursorName} CURSOR FOR ${sql}`;
          await client.query(declareSQL, params);
          initialized = true;
        }

        async function fetchBatch(): Promise<T[]> {
          if (!client || !cursorName) return [];
          const result = await client.query(`FETCH ${batchSize} FROM ${cursorName}`);
          return result.rows as T[];
        }

        async function cleanup() {
          if (client) {
            try {
              if (cursorName) await client.query(`CLOSE ${cursorName}`);
              await client.query('COMMIT');
            } finally {
              client.release();
              client = null;
            }
          }
        }

        return {
          async next(): Promise<IteratorResult<T>> {
            try {
              if (!initialized) await init();

              if (bufferIndex < buffer.length) {
                return { value: buffer[bufferIndex++], done: false };
              }

              if (done) {
                await cleanup();
                return { value: undefined, done: true };
              }

              buffer = await fetchBatch();
              bufferIndex = 0;

              if (buffer.length === 0) {
                done = true;
                await cleanup();
                return { value: undefined, done: true };
              }

              return { value: buffer[bufferIndex++], done: false };
            } catch (err) {
              await cleanup();
              throw err;
            }
          },

          async return(): Promise<IteratorResult<T>> {
            await cleanup();
            return { value: undefined, done: true };
          },

          async throw(err: any): Promise<IteratorResult<T>> {
            await cleanup();
            throw err;
          },
        };
      },
    };
  }

  /** Close the connection pool */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
