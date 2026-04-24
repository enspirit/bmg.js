import { describe, it, expect } from 'vitest';
import { SqlBuilder } from '../src';

describe('SqlBuilder', () => {

  describe('qualify', () => {
    it('generates sequential qualifiers', () => {
      const b = new SqlBuilder();
      expect(b.qualify()).toBe('t1');
      expect(b.qualify()).toBe('t2');
      expect(b.qualify()).toBe('t3');
    });

    it('starts from custom offset', () => {
      const b = new SqlBuilder(5);
      expect(b.qualify()).toBe('t6');
    });

    it('lastQualifier returns the most recently generated', () => {
      const b = new SqlBuilder();
      b.qualify();
      b.qualify();
      expect(b.lastQualifier()).toBe('t2');
    });
  });

  describe('selectStarFrom', () => {
    it('creates SELECT * from table', () => {
      const b = new SqlBuilder();
      const expr = b.selectStarFrom('suppliers');
      expect(expr.kind).toBe('select');
      expect(expr.quantifier).toBe('all');
      expect(expr.selectList).toHaveLength(1);
      expect(expr.selectList[0].expr.kind).toBe('star');
      expect(expr.from?.tableSpec.kind).toBe('table_ref');
      if (expr.from?.tableSpec.kind === 'table_ref') {
        expect(expr.from.tableSpec.table).toBe('suppliers');
        expect(expr.from.tableSpec.alias).toBe('t1');
      }
    });
  });

  describe('selectFrom', () => {
    it('creates SELECT with named columns', () => {
      const b = new SqlBuilder();
      const expr = b.selectFrom(['sid', 'name'], 'suppliers');
      expect(expr.selectList).toHaveLength(2);
      expect(expr.selectList[0].alias).toBe('sid');
      expect(expr.selectList[1].alias).toBe('name');
      expect(expr.selectList[0].expr.kind).toBe('column_ref');
    });
  });

  describe('fromSelf', () => {
    it('wraps a select in a subquery', () => {
      const b = new SqlBuilder();
      const inner = b.selectFrom(['sid', 'city'], 'suppliers');
      const outer = b.fromSelf(inner);
      expect(outer.kind).toBe('select');
      expect(outer.from?.tableSpec.kind).toBe('subquery_ref');
      if (outer.from?.tableSpec.kind === 'subquery_ref') {
        expect(outer.from.tableSpec.alias).toBe('t2');
        expect(outer.from.tableSpec.subquery).toBe(inner);
      }
      // Outer select list references t2
      expect(outer.selectList[0].expr).toEqual({
        kind: 'column_ref',
        qualifier: 't2',
        column: 'sid',
      });
    });
  });

  describe('set operations', () => {
    it('union', () => {
      const b = new SqlBuilder();
      const left = b.selectFrom(['sid'], 'suppliers');
      const right = b.selectFrom(['sid'], 'parts');
      const expr = b.union(left, right);
      expect(expr.kind).toBe('union');
      expect(expr.all).toBe(false);
    });

    it('union all', () => {
      const b = new SqlBuilder();
      const left = b.selectFrom(['sid'], 'suppliers');
      const right = b.selectFrom(['sid'], 'parts');
      const expr = b.union(left, right, true);
      expect(expr.all).toBe(true);
    });

    it('except', () => {
      const b = new SqlBuilder();
      const expr = b.except(
        b.selectFrom(['sid'], 'suppliers'),
        b.selectFrom(['sid'], 'parts'),
      );
      expect(expr.kind).toBe('except');
    });

    it('intersect', () => {
      const b = new SqlBuilder();
      const expr = b.intersect(
        b.selectFrom(['sid'], 'suppliers'),
        b.selectFrom(['sid'], 'parts'),
      );
      expect(expr.kind).toBe('intersect');
    });
  });
});
