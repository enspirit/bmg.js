import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pred } from '@enspirit/predicate';
import { BmgSql } from '@enspirit/bmg-sql';
import type { SqlRelation } from '@enspirit/bmg-sql';
import type { PostgresAdapter } from '../../src';
import { createAdapter, seedDatabase, teardownDatabase } from './setup';

interface Supplier {
  sid: string;
  name: string;
  status: number;
  city: string;
}

interface Shipment {
  sid: string;
  pid: string;
  qty: number;
}

let adapter: PostgresAdapter;

beforeAll(async () => {
  adapter = createAdapter();
  await seedDatabase(adapter);
});

afterAll(async () => {
  await teardownDatabase(adapter);
});

function suppliers() {
  return BmgSql<Supplier>(adapter, 'suppliers', ['sid', 'name', 'status', 'city']);
}

function shipments() {
  return BmgSql<Shipment>(adapter, 'shipments', ['sid', 'pid', 'qty']);
}

describe('Postgres integration', () => {

  // =========================================================================
  // Basic read
  // =========================================================================
  describe('basic read', () => {
    it('toArray returns all rows', async () => {
      const rows = await suppliers().toArray();
      expect(rows).toHaveLength(5);
      expect(rows.map(r => r.sid).sort()).toEqual(['S1', 'S2', 'S3', 'S4', 'S5']);
    });

    it('one returns a single row when restricted', async () => {
      const smith = await suppliers().restrict({ sid: 'S1' } as any).one();
      expect(smith.name).toBe('Smith');
      expect(smith.city).toBe('London');
    });
  });

  // =========================================================================
  // restrict
  // =========================================================================
  describe('restrict', () => {
    it('plain object predicate', async () => {
      const rows = await suppliers().restrict({ city: 'London' } as any).toArray();
      expect(rows).toHaveLength(2);
      expect(rows.every(r => r.city === 'London')).toBe(true);
    });

    it('Pred.eq', async () => {
      const rows = await suppliers().restrict(Pred.eq('city', 'Paris') as any).toArray();
      expect(rows).toHaveLength(2);
    });

    it('Pred.gt', async () => {
      const rows = await suppliers().restrict(Pred.gt('status', 20) as any).toArray();
      expect(rows).toHaveLength(2);
      expect(rows.every(r => r.status > 20)).toBe(true);
    });

    it('Pred.and compound', async () => {
      const rows = await suppliers()
        .restrict(Pred.and(Pred.eq('city', 'London'), Pred.gte('status', 20)) as any)
        .toArray();
      expect(rows).toHaveLength(2);
    });

    it('Pred.in', async () => {
      const rows = await suppliers()
        .restrict(Pred.in('city', ['London', 'Athens']) as any)
        .toArray();
      expect(rows).toHaveLength(3);
    });

    it('chained restricts', async () => {
      const rows = await suppliers()
        .restrict({ city: 'Paris' } as any)
        .restrict(Pred.gt('status', 10) as any)
        .toArray();
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('Blake');
    });
  });

  // =========================================================================
  // project / allbut
  // =========================================================================
  describe('project', () => {
    it('keeps only specified columns', async () => {
      const rows = await suppliers().project(['sid', 'city'] as any).toArray();
      expect(rows).toHaveLength(5);
      const keys = Object.keys(rows[0]);
      expect(keys.sort()).toEqual(['city', 'sid']);
    });
  });

  describe('allbut', () => {
    it('removes specified columns', async () => {
      const rows = await suppliers().allbut(['status', 'city'] as any).toArray();
      expect(rows.length).toBeGreaterThan(0);
      const keys = Object.keys(rows[0]);
      expect(keys.sort()).toEqual(['name', 'sid']);
    });
  });

  // =========================================================================
  // rename
  // =========================================================================
  describe('rename', () => {
    it('renames columns', async () => {
      const rows = await suppliers().rename({ name: 'sname' } as any).toArray();
      expect(rows).toHaveLength(5);
      expect(rows[0]).toHaveProperty('sname');
      expect(rows[0]).not.toHaveProperty('name');
    });
  });

  // =========================================================================
  // constants
  // =========================================================================
  describe('constants', () => {
    it('adds literal columns', async () => {
      const rows = await suppliers()
        .project(['sid'] as any)
        .constants({ source: 'db' } as any)
        .toArray();
      expect(rows).toHaveLength(5);
      expect(rows.every(r => (r as any).source === 'db')).toBe(true);
    });
  });

  // =========================================================================
  // set operations
  // =========================================================================
  describe('union', () => {
    it('unions two queries from same adapter', async () => {
      const london = suppliers().restrict({ city: 'London' } as any);
      const paris = suppliers().restrict({ city: 'Paris' } as any);
      const rows = await london.union(paris).toArray();
      expect(rows).toHaveLength(4);
    });
  });

  describe('minus', () => {
    it('subtracts rows', async () => {
      const all = suppliers().project(['sid', 'name', 'status', 'city'] as any);
      const london = suppliers()
        .restrict({ city: 'London' } as any)
        .project(['sid', 'name', 'status', 'city'] as any);
      const rows = await all.minus(london).toArray();
      expect(rows).toHaveLength(3);
      expect(rows.every(r => r.city !== 'London')).toBe(true);
    });
  });

  describe('intersect', () => {
    it('intersects two queries', async () => {
      const highStatus = suppliers()
        .restrict(Pred.gte('status', 20) as any)
        .project(['sid', 'name', 'status', 'city'] as any);
      const london = suppliers()
        .restrict({ city: 'London' } as any)
        .project(['sid', 'name', 'status', 'city'] as any);
      const rows = await highStatus.intersect(london).toArray();
      expect(rows).toHaveLength(2);
    });
  });

  // =========================================================================
  // join
  // =========================================================================
  describe('join', () => {
    it('inner join on common key', async () => {
      const rows = await suppliers().join(shipments(), ['sid']).toArray();
      expect(rows.length).toBeGreaterThan(0);
      // Each row should have supplier and shipment columns
      expect(rows[0]).toHaveProperty('name');
      expect(rows[0]).toHaveProperty('qty');
    });
  });

  describe('left_join', () => {
    it('left join preserves all left rows', async () => {
      const rows = await suppliers().left_join(shipments(), ['sid']).toArray();
      // S5 (Adams) has no shipments, should still appear
      expect(rows.length).toBeGreaterThanOrEqual(5);
      const sids = [...new Set(rows.map(r => (r as any).sid))];
      expect(sids.sort()).toEqual(['S1', 'S2', 'S3', 'S4', 'S5']);
    });
  });

  // =========================================================================
  // fallback to in-memory
  // =========================================================================
  describe('fallback', () => {
    it('function predicate falls back to in-memory', async () => {
      const rows = await suppliers()
        .restrict(((t: Supplier) => t.city === 'London') as any)
        .toArray();
      expect(rows).toHaveLength(2);
      expect(rows.every(r => r.city === 'London')).toBe(true);
    });
  });

  // =========================================================================
  // toSql inspection
  // =========================================================================
  describe('toSql', () => {
    it('returns the generated SQL', () => {
      const rel = suppliers().restrict(Pred.eq('city', 'London') as any);
      const { sql, params } = (rel as SqlRelation).toSql();
      expect(sql).toContain('WHERE');
      expect(sql).toContain('"city"');
      expect(params).toEqual(['London']);
    });
  });

  // =========================================================================
  // streaming
  // =========================================================================
  describe('streaming', () => {
    it('iterates rows via async iterator', async () => {
      const rows: Supplier[] = [];
      for await (const row of suppliers()) {
        rows.push(row);
      }
      expect(rows).toHaveLength(5);
    });
  });

  // =========================================================================
  // summarize
  // =========================================================================
  describe('summarize', () => {
    it('GROUP BY with count', async () => {
      const rows = await suppliers()
        .summarize(['city'] as any, { cnt: { op: 'count', attr: 'sid' } })
        .toArray();
      expect(rows.length).toBeGreaterThan(0);
      const london = rows.find((r: any) => r.city === 'London') as any;
      expect(london).toBeDefined();
      expect(Number(london.cnt)).toBe(2);
    });

    it('GROUP BY with sum', async () => {
      const rows = await suppliers()
        .summarize(['city'] as any, { total: { op: 'sum', attr: 'status' } })
        .toArray();
      const paris = rows.find((r: any) => r.city === 'Paris') as any;
      expect(paris).toBeDefined();
      expect(Number(paris.total)).toBe(40); // Jones(10) + Blake(30)
    });
  });

  // =========================================================================
  // matching / not_matching
  // =========================================================================
  describe('matching', () => {
    it('keeps only suppliers with shipments', async () => {
      const rows = await suppliers().matching(shipments(), ['sid']).toArray();
      // S5 (Adams) has no shipments
      const sids = rows.map(r => r.sid).sort();
      expect(sids).toEqual(['S1', 'S2', 'S3', 'S4']);
    });
  });

  describe('not_matching', () => {
    it('keeps only suppliers without shipments', async () => {
      const rows = await suppliers().not_matching(shipments(), ['sid']).toArray();
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('Adams');
    });
  });

  // =========================================================================
  // chained operations
  // =========================================================================
  describe('chained', () => {
    it('restrict → project → rename → toArray', async () => {
      const rows = await suppliers()
        .restrict(Pred.eq('city', 'London') as any)
        .project(['sid', 'name'] as any)
        .rename({ name: 'sname' } as any)
        .toArray();
      expect(rows).toHaveLength(2);
      expect(rows[0]).toHaveProperty('sid');
      expect(rows[0]).toHaveProperty('sname');
      expect(rows[0]).not.toHaveProperty('name');
    });
  });
});
