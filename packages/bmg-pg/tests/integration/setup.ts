/**
 * Integration test setup: creates tables, seeds data, provides adapter.
 */
import { Pool } from 'pg';
import { PostgresAdapter } from '../../src';

const POSTGRES_URL = process.env.POSTGRES_URL ?? 'postgresql://bmg:bmg@localhost:5432/bmg_test';

export function getPostgresUrl(): string | undefined {
  // In CI or local dev with docker-compose, POSTGRES_URL is set or we use the default
  // If we can't connect, tests will fail at setup — that's fine
  return POSTGRES_URL;
}

export function createAdapter(): PostgresAdapter {
  const pool = new Pool({ connectionString: getPostgresUrl() });
  return new PostgresAdapter({ pool });
}

export async function seedDatabase(adapter: PostgresAdapter): Promise<void> {
  const pool = (adapter as any).pool as Pool;

  await pool.query(`
    DROP TABLE IF EXISTS shipments;
    DROP TABLE IF EXISTS suppliers;
  `);

  await pool.query(`
    CREATE TABLE suppliers (
      sid    TEXT PRIMARY KEY,
      name   TEXT NOT NULL,
      status INTEGER NOT NULL,
      city   TEXT NOT NULL
    )
  `);

  await pool.query(`
    INSERT INTO suppliers (sid, name, status, city) VALUES
      ('S1', 'Smith', 20, 'London'),
      ('S2', 'Jones', 10, 'Paris'),
      ('S3', 'Blake', 30, 'Paris'),
      ('S4', 'Clark', 20, 'London'),
      ('S5', 'Adams', 30, 'Athens')
  `);

  await pool.query(`
    CREATE TABLE shipments (
      sid  TEXT NOT NULL,
      pid  TEXT NOT NULL,
      qty  INTEGER NOT NULL,
      PRIMARY KEY (sid, pid)
    )
  `);

  await pool.query(`
    INSERT INTO shipments (sid, pid, qty) VALUES
      ('S1', 'P1', 300),
      ('S1', 'P2', 200),
      ('S2', 'P1', 300),
      ('S3', 'P2', 200),
      ('S4', 'P4', 300)
  `);
}

export async function teardownDatabase(adapter: PostgresAdapter): Promise<void> {
  const pool = (adapter as any).pool as Pool;
  await pool.query('DROP TABLE IF EXISTS shipments');
  await pool.query('DROP TABLE IF EXISTS suppliers');
  await adapter.close();
}
