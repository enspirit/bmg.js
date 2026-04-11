import { describe, it, expect, vi } from 'vitest';
import { Pred } from '@enspirit/predicate';
import { BmgSql, SqlRelation, PostgresDialect } from '../src';
import type { DatabaseAdapter } from '../src';

interface Supplier {
  sid: string;
  name: string;
  status: number;
  city: string;
}

const SUPPLIERS_DATA: Supplier[] = [
  { sid: 'S1', name: 'Smith', status: 20, city: 'London' },
  { sid: 'S2', name: 'Jones', status: 10, city: 'Paris' },
  { sid: 'S3', name: 'Blake', status: 30, city: 'Paris' },
  { sid: 'S4', name: 'Clark', status: 20, city: 'London' },
  { sid: 'S5', name: 'Adams', status: 30, city: 'Athens' },
];

/** Create a mock adapter that returns predefined data */
function mockAdapter(data: Record<string, unknown>[] = SUPPLIERS_DATA): DatabaseAdapter {
  return {
    query: vi.fn().mockResolvedValue(data),
    stream: vi.fn().mockReturnValue((async function*() { yield* data; })()),
    dialect: PostgresDialect,
  };
}

describe('BmgSql', () => {
  it('creates a SqlRelation from table name', () => {
    const adapter = mockAdapter();
    const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name', 'status', 'city']);
    expect(rel).toBeInstanceOf(SqlRelation);
  });

  it('creates SELECT * when no attrs specified', () => {
    const adapter = mockAdapter();
    const rel = BmgSql(adapter, 'suppliers');
    const { sql } = rel.toSql();
    expect(sql).toContain('SELECT');
    expect(sql).toContain('"suppliers"');
  });
});

describe('SqlRelation', () => {

  describe('toSql()', () => {
    it('returns the compiled SQL', () => {
      const adapter = mockAdapter();
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name', 'status', 'city']);
      const { sql, params } = rel.toSql();
      expect(sql).toBe('SELECT "t1"."sid", "t1"."name", "t1"."status", "t1"."city" FROM "suppliers" "t1"');
      expect(params).toEqual([]);
    });
  });

  describe('toArray()', () => {
    it('executes the SQL and returns rows', async () => {
      const adapter = mockAdapter();
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name', 'status', 'city']);
      const rows = await rel.toArray();
      expect(rows).toEqual(SUPPLIERS_DATA);
      expect(adapter.query).toHaveBeenCalledWith(
        'SELECT "t1"."sid", "t1"."name", "t1"."status", "t1"."city" FROM "suppliers" "t1"',
        []
      );
    });
  });

  describe('one()', () => {
    it('returns a single row', async () => {
      const adapter = mockAdapter([SUPPLIERS_DATA[0]]);
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name']);
      const row = await rel.one();
      expect(row).toEqual(SUPPLIERS_DATA[0]);
    });

    it('throws on empty result', async () => {
      const adapter = mockAdapter([]);
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid']);
      await expect(rel.one()).rejects.toThrow('Expected one tuple, got none');
    });

    it('throws on multiple rows', async () => {
      const adapter = mockAdapter(SUPPLIERS_DATA);
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid']);
      await expect(rel.one()).rejects.toThrow('Expected one tuple, got 5');
    });
  });

  // =========================================================================
  // restrict / where
  // =========================================================================
  describe('restrict', () => {
    it('pushes plain object predicate to SQL', () => {
      const adapter = mockAdapter();
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name', 'status', 'city']);
      const restricted = rel.restrict({ city: 'London' } as any);
      expect(restricted).toBeInstanceOf(SqlRelation);
      const { sql, params } = (restricted as SqlRelation).toSql();
      expect(sql).toContain('WHERE');
      expect(sql).toContain('"city" = $1');
      expect(params).toEqual(['London']);
    });

    it('pushes structured predicate to SQL', () => {
      const adapter = mockAdapter();
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name', 'status', 'city']);
      const restricted = rel.restrict(Pred.gt('status', 20) as any);
      expect(restricted).toBeInstanceOf(SqlRelation);
      const { sql, params } = (restricted as SqlRelation).toSql();
      expect(sql).toContain('"status" > $1');
      expect(params).toEqual([20]);
    });

    it('chains multiple restricts with AND', () => {
      const adapter = mockAdapter();
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name', 'status', 'city']);
      const result = rel
        .restrict({ city: 'London' } as any)
        .restrict(Pred.gt('status', 10) as any);
      expect(result).toBeInstanceOf(SqlRelation);
      const { sql, params } = (result as SqlRelation).toSql();
      expect(sql).toContain('"city" = $1');
      expect(sql).toContain('"status" > $2');
      expect(sql).toContain('AND');
      expect(params).toEqual(['London', 10]);
    });

    it('falls back to in-memory for function predicates', () => {
      const adapter = mockAdapter();
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name', 'status', 'city']);
      const restricted = rel.restrict(((t: Supplier) => t.city === 'London') as any);
      // Should NOT be a SqlRelation (fell back)
      expect(restricted).not.toBeInstanceOf(SqlRelation);
    });
  });

  // =========================================================================
  // project / allbut
  // =========================================================================
  describe('project', () => {
    it('pushes projection to SQL with DISTINCT', () => {
      const adapter = mockAdapter();
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name', 'status', 'city']);
      const projected = rel.project(['sid', 'name'] as any);
      expect(projected).toBeInstanceOf(SqlRelation);
      const { sql } = (projected as SqlRelation).toSql();
      expect(sql).toContain('SELECT DISTINCT');
      expect(sql).toContain('"sid"');
      expect(sql).toContain('"name"');
      expect(sql).not.toContain('"status"');
      expect(sql).not.toContain('"city"');
    });
  });

  describe('allbut', () => {
    it('removes specified columns with DISTINCT', () => {
      const adapter = mockAdapter();
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name', 'status', 'city']);
      const result = rel.allbut(['status', 'city'] as any);
      expect(result).toBeInstanceOf(SqlRelation);
      const { sql } = (result as SqlRelation).toSql();
      expect(sql).toContain('SELECT DISTINCT');
      expect(sql).toContain('"sid"');
      expect(sql).toContain('"name"');
    });
  });

  // =========================================================================
  // rename
  // =========================================================================
  describe('rename', () => {
    it('renames columns in SQL', () => {
      const adapter = mockAdapter();
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name', 'city']);
      const renamed = rel.rename({ name: 'sname' } as any);
      expect(renamed).toBeInstanceOf(SqlRelation);
      const { sql } = (renamed as SqlRelation).toSql();
      expect(sql).toContain('"sname"');
    });
  });

  // =========================================================================
  // constants
  // =========================================================================
  describe('constants', () => {
    it('adds literal columns', () => {
      const adapter = mockAdapter();
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name']);
      const result = rel.constants({ source: 'db' } as any);
      expect(result).toBeInstanceOf(SqlRelation);
      const { sql, params } = (result as SqlRelation).toSql();
      expect(sql).toContain('"source"');
      expect(params).toContain('db');
    });
  });

  // =========================================================================
  // set operations
  // =========================================================================
  describe('union', () => {
    it('pushes UNION to SQL when both are SqlRelation on same adapter', () => {
      const adapter = mockAdapter();
      const left = BmgSql<Supplier>(adapter, 'suppliers', ['sid']);
      const right = BmgSql<Supplier>(adapter, 'parts', ['sid']);
      const result = left.union(right);
      expect(result).toBeInstanceOf(SqlRelation);
      const { sql } = (result as SqlRelation).toSql();
      expect(sql).toContain('UNION');
    });

    it('falls back when operands use different adapters', () => {
      const adapter1 = mockAdapter();
      const adapter2 = mockAdapter();
      const left = BmgSql<Supplier>(adapter1, 'suppliers', ['sid']);
      const right = BmgSql<Supplier>(adapter2, 'parts', ['sid']);
      const result = left.union(right);
      expect(result).not.toBeInstanceOf(SqlRelation);
    });
  });

  describe('minus', () => {
    it('pushes EXCEPT to SQL', () => {
      const adapter = mockAdapter();
      const left = BmgSql(adapter, 'suppliers', ['sid']);
      const right = BmgSql(adapter, 'excluded', ['sid']);
      const result = left.minus(right);
      expect(result).toBeInstanceOf(SqlRelation);
      const { sql } = (result as SqlRelation).toSql();
      expect(sql).toContain('EXCEPT');
    });
  });

  describe('intersect', () => {
    it('pushes INTERSECT to SQL', () => {
      const adapter = mockAdapter();
      const left = BmgSql(adapter, 'suppliers', ['sid']);
      const right = BmgSql(adapter, 'preferred', ['sid']);
      const result = left.intersect(right);
      expect(result).toBeInstanceOf(SqlRelation);
      const { sql } = (result as SqlRelation).toSql();
      expect(sql).toContain('INTERSECT');
    });
  });

  // =========================================================================
  // chained operations
  // =========================================================================
  describe('chained operations', () => {
    it('restrict → project → toSql', () => {
      const adapter = mockAdapter();
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name', 'status', 'city']);
      const result = rel
        .restrict(Pred.eq('city', 'London') as any)
        .project(['sid', 'name'] as any);
      expect(result).toBeInstanceOf(SqlRelation);
      const { sql, params } = (result as SqlRelation).toSql();
      expect(sql).toContain('SELECT DISTINCT');
      expect(sql).toContain('WHERE');
      expect(params).toEqual(['London']);
    });

    it('restrict → project → toArray executes SQL', async () => {
      const expected = [{ sid: 'S1', name: 'Smith' }, { sid: 'S4', name: 'Clark' }];
      const adapter = mockAdapter(expected);
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name', 'status', 'city']);
      const result = await rel
        .restrict(Pred.eq('city', 'London') as any)
        .project(['sid', 'name'] as any)
        .toArray();
      expect(result).toEqual(expected);
      expect(adapter.query).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // fallback operations
  // =========================================================================
  describe('fallback to in-memory', () => {
    it('group falls back', () => {
      const adapter = mockAdapter();
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name', 'status', 'city']);
      const result = rel.group(['sid', 'name'] as any, 'details');
      expect(result).not.toBeInstanceOf(SqlRelation);
    });

    it('transform falls back', () => {
      const adapter = mockAdapter();
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name']);
      const result = rel.transform((v: any) => String(v));
      expect(result).not.toBeInstanceOf(SqlRelation);
    });
  });

  // =========================================================================
  // async iteration
  // =========================================================================
  describe('async iteration', () => {
    it('streams via Symbol.asyncIterator', async () => {
      const adapter = mockAdapter();
      const rel = BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name', 'status', 'city']);
      const rows: Supplier[] = [];
      for await (const row of rel) {
        rows.push(row);
      }
      expect(rows).toEqual(SUPPLIERS_DATA);
    });
  });
});
