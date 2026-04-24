import { describe, it, expect, vi } from 'vitest';
import { PostgresAdapter } from '../src';
import { PostgresDialect } from '@enspirit/bmg-sql';

describe('PostgresAdapter', () => {
  it('uses PostgresDialect', () => {
    // Create adapter with a mock pool
    const mockPool = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      connect: vi.fn(),
      end: vi.fn(),
    };
    const adapter = new PostgresAdapter({ pool: mockPool as any });
    expect(adapter.dialect).toBe(PostgresDialect);
  });

  it('query delegates to pool.query', async () => {
    const mockPool = {
      query: vi.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
      connect: vi.fn(),
      end: vi.fn(),
    };
    const adapter = new PostgresAdapter({ pool: mockPool as any });
    const rows = await adapter.query('SELECT 1 as id');
    expect(rows).toEqual([{ id: 1 }]);
    expect(mockPool.query).toHaveBeenCalledWith('SELECT 1 as id', undefined);
  });

  it('query passes params', async () => {
    const mockPool = {
      query: vi.fn().mockResolvedValue({ rows: [{ city: 'London' }] }),
      connect: vi.fn(),
      end: vi.fn(),
    };
    const adapter = new PostgresAdapter({ pool: mockPool as any });
    await adapter.query('SELECT * FROM t WHERE city = $1', ['London']);
    expect(mockPool.query).toHaveBeenCalledWith(
      'SELECT * FROM t WHERE city = $1',
      ['London']
    );
  });

  it('close ends the pool', async () => {
    const mockPool = {
      query: vi.fn(),
      connect: vi.fn(),
      end: vi.fn().mockResolvedValue(undefined),
    };
    const adapter = new PostgresAdapter({ pool: mockPool as any });
    await adapter.close();
    expect(mockPool.end).toHaveBeenCalled();
  });
});
