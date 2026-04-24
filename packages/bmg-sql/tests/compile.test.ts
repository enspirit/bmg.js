import { describe, it, expect } from 'vitest';
import { Pred } from '@enspirit/predicate';
import { SqlBuilder, compile, PostgresDialect, SqliteDialect } from '../src';
import type { SelectExpr, SqlExpr } from '../src';

describe('compile', () => {
  const b = new SqlBuilder();

  describe('simple SELECT', () => {
    it('SELECT * FROM table', () => {
      const expr = new SqlBuilder().selectStarFrom('suppliers');
      const { sql, params } = compile(expr);
      expect(sql).toBe('SELECT "t1".* FROM "suppliers" "t1"');
      expect(params).toEqual([]);
    });

    it('SELECT columns FROM table', () => {
      const expr = new SqlBuilder().selectFrom(['sid', 'name', 'city'], 'suppliers');
      const { sql, params } = compile(expr);
      expect(sql).toBe(
        'SELECT "t1"."sid", "t1"."name", "t1"."city" FROM "suppliers" "t1"'
      );
      expect(params).toEqual([]);
    });
  });

  describe('SELECT with WHERE', () => {
    it('simple equality', () => {
      const b = new SqlBuilder();
      const expr: SelectExpr = {
        ...b.selectFrom(['sid', 'name'], 'suppliers'),
        where: Pred.eq('city', 'London'),
      };
      const { sql, params } = compile(expr);
      expect(sql).toBe(
        'SELECT "t1"."sid", "t1"."name" FROM "suppliers" "t1" WHERE "t1"."city" = $1'
      );
      expect(params).toEqual(['London']);
    });

    it('compound predicate', () => {
      const b = new SqlBuilder();
      const expr: SelectExpr = {
        ...b.selectFrom(['sid', 'name'], 'suppliers'),
        where: Pred.and(Pred.eq('city', 'London'), Pred.gt('status', 10)),
      };
      const { sql, params } = compile(expr);
      expect(sql).toBe(
        'SELECT "t1"."sid", "t1"."name" FROM "suppliers" "t1" WHERE "t1"."city" = $1 AND "t1"."status" > $2'
      );
      expect(params).toEqual(['London', 10]);
    });

    it('NULL handling', () => {
      const b = new SqlBuilder();
      const expr: SelectExpr = {
        ...b.selectFrom(['sid'], 'suppliers'),
        where: Pred.eq('city', null),
      };
      const { sql } = compile(expr);
      expect(sql).toBe(
        'SELECT "t1"."sid" FROM "suppliers" "t1" WHERE "t1"."city" IS NULL'
      );
    });

    it('IN predicate', () => {
      const b = new SqlBuilder();
      const expr: SelectExpr = {
        ...b.selectFrom(['sid'], 'suppliers'),
        where: Pred.in('city', ['London', 'Paris']),
      };
      const { sql, params } = compile(expr);
      expect(sql).toBe(
        'SELECT "t1"."sid" FROM "suppliers" "t1" WHERE "t1"."city" IN ($1, $2)'
      );
      expect(params).toEqual(['London', 'Paris']);
    });
  });

  describe('SELECT DISTINCT', () => {
    it('adds DISTINCT keyword', () => {
      const b = new SqlBuilder();
      const expr: SelectExpr = {
        ...b.selectFrom(['city'], 'suppliers'),
        quantifier: 'distinct',
      };
      const { sql } = compile(expr);
      expect(sql).toBe('SELECT DISTINCT "t1"."city" FROM "suppliers" "t1"');
    });
  });

  describe('GROUP BY', () => {
    it('groups by columns with aggregate', () => {
      const b = new SqlBuilder();
      const alias = 't1';
      const expr: SelectExpr = {
        kind: 'select',
        quantifier: 'all',
        selectList: [
          b.selectItem(alias, 'city'),
          { expr: b.aggregate('count'), alias: 'cnt' },
        ],
        from: { tableSpec: b.tableRef('suppliers', alias) },
        groupBy: [b.columnRef(alias, 'city')],
      };
      const { sql } = compile(expr);
      expect(sql).toBe(
        'SELECT "t1"."city", COUNT(*) AS "cnt" FROM "suppliers" "t1" GROUP BY "t1"."city"'
      );
    });

    it('SUM aggregate', () => {
      const b = new SqlBuilder();
      const alias = 't1';
      const expr: SelectExpr = {
        kind: 'select',
        quantifier: 'all',
        selectList: [
          b.selectItem(alias, 'city'),
          { expr: b.aggregate('sum', b.columnRef(alias, 'status')), alias: 'total' },
        ],
        from: { tableSpec: b.tableRef('suppliers', alias) },
        groupBy: [b.columnRef(alias, 'city')],
      };
      const { sql } = compile(expr);
      expect(sql).toBe(
        'SELECT "t1"."city", SUM("t1"."status") AS "total" FROM "suppliers" "t1" GROUP BY "t1"."city"'
      );
    });

    it('COUNT DISTINCT', () => {
      const b = new SqlBuilder();
      const alias = 't1';
      const expr: SelectExpr = {
        kind: 'select',
        quantifier: 'all',
        selectList: [
          { expr: b.aggregate('distinct_count', b.columnRef(alias, 'city')), alias: 'n' },
        ],
        from: { tableSpec: b.tableRef('suppliers', alias) },
      };
      const { sql } = compile(expr);
      expect(sql).toBe(
        'SELECT COUNT(DISTINCT "t1"."city") AS "n" FROM "suppliers" "t1"'
      );
    });
  });

  describe('ORDER BY', () => {
    it('orders by column', () => {
      const b = new SqlBuilder();
      const alias = 't1';
      const expr: SelectExpr = {
        ...b.selectFrom(['sid', 'name'], 'suppliers'),
      };
      // Override with known alias
      const withOrder: SelectExpr = {
        ...expr,
        orderBy: [
          { expr: b.columnRef('t1', 'name'), direction: 'asc' },
        ],
      };
      const { sql } = compile(withOrder);
      expect(sql).toBe(
        'SELECT "t1"."sid", "t1"."name" FROM "suppliers" "t1" ORDER BY "t1"."name" ASC'
      );
    });

    it('multiple columns with directions', () => {
      const b = new SqlBuilder();
      const expr: SelectExpr = {
        ...b.selectFrom(['sid', 'name'], 'suppliers'),
        orderBy: [
          { expr: b.columnRef('t1', 'city'), direction: 'asc' },
          { expr: b.columnRef('t1', 'name'), direction: 'desc' },
        ],
      };
      const { sql } = compile(expr);
      expect(sql).toBe(
        'SELECT "t1"."sid", "t1"."name" FROM "suppliers" "t1" ORDER BY "t1"."city" ASC, "t1"."name" DESC'
      );
    });
  });

  describe('LIMIT and OFFSET', () => {
    it('LIMIT only', () => {
      const b = new SqlBuilder();
      const expr: SelectExpr = {
        ...b.selectFrom(['sid'], 'suppliers'),
        limit: 10,
      };
      const { sql } = compile(expr);
      expect(sql).toBe('SELECT "t1"."sid" FROM "suppliers" "t1" LIMIT 10');
    });

    it('LIMIT and OFFSET', () => {
      const b = new SqlBuilder();
      const expr: SelectExpr = {
        ...b.selectFrom(['sid'], 'suppliers'),
        limit: 10,
        offset: 20,
      };
      const { sql } = compile(expr);
      expect(sql).toBe('SELECT "t1"."sid" FROM "suppliers" "t1" LIMIT 10 OFFSET 20');
    });

    it('OFFSET 0 is omitted', () => {
      const b = new SqlBuilder();
      const expr: SelectExpr = {
        ...b.selectFrom(['sid'], 'suppliers'),
        limit: 10,
        offset: 0,
      };
      const { sql } = compile(expr);
      expect(sql).toBe('SELECT "t1"."sid" FROM "suppliers" "t1" LIMIT 10');
    });
  });

  describe('subquery (FROM SELF)', () => {
    it('wraps a query in a subquery', () => {
      const b = new SqlBuilder();
      const inner = b.selectFrom(['sid', 'city'], 'suppliers');
      const outer = b.fromSelf(inner);
      const { sql } = compile(outer);
      expect(sql).toBe(
        'SELECT "t2"."sid", "t2"."city" FROM (SELECT "t1"."sid", "t1"."city" FROM "suppliers" "t1") "t2"'
      );
    });
  });

  describe('set operations', () => {
    it('UNION', () => {
      const b1 = new SqlBuilder();
      const left = b1.selectFrom(['sid'], 'suppliers');
      const b2 = new SqlBuilder(1);
      const right = b2.selectFrom(['sid'], 'parts');
      const expr = b1.union(left, right);
      const { sql } = compile(expr);
      expect(sql).toBe(
        '(SELECT "t1"."sid" FROM "suppliers" "t1") UNION (SELECT "t2"."sid" FROM "parts" "t2")'
      );
    });

    it('UNION ALL', () => {
      const b1 = new SqlBuilder();
      const left = b1.selectFrom(['sid'], 'suppliers');
      const b2 = new SqlBuilder(1);
      const right = b2.selectFrom(['sid'], 'parts');
      const expr = b1.union(left, right, true);
      const { sql } = compile(expr);
      expect(sql).toBe(
        '(SELECT "t1"."sid" FROM "suppliers" "t1") UNION ALL (SELECT "t2"."sid" FROM "parts" "t2")'
      );
    });

    it('EXCEPT', () => {
      const b1 = new SqlBuilder();
      const left = b1.selectFrom(['sid'], 'suppliers');
      const b2 = new SqlBuilder(1);
      const right = b2.selectFrom(['sid'], 'excluded');
      const expr = b1.except(left, right);
      const { sql } = compile(expr);
      expect(sql).toBe(
        '(SELECT "t1"."sid" FROM "suppliers" "t1") EXCEPT (SELECT "t2"."sid" FROM "excluded" "t2")'
      );
    });

    it('INTERSECT', () => {
      const b1 = new SqlBuilder();
      const left = b1.selectFrom(['sid'], 'suppliers');
      const b2 = new SqlBuilder(1);
      const right = b2.selectFrom(['sid'], 'preferred');
      const expr = b1.intersect(left, right);
      const { sql } = compile(expr);
      expect(sql).toBe(
        '(SELECT "t1"."sid" FROM "suppliers" "t1") INTERSECT (SELECT "t2"."sid" FROM "preferred" "t2")'
      );
    });
  });

  describe('JOIN', () => {
    it('INNER JOIN', () => {
      const b = new SqlBuilder();
      const leftTable = b.tableRef('suppliers', 't1');
      const rightTable = b.tableRef('shipments', 't2');
      const expr: SelectExpr = {
        kind: 'select',
        quantifier: 'all',
        selectList: [
          b.selectItem('t1', 'name'),
          b.selectItem('t2', 'qty'),
        ],
        from: {
          tableSpec: {
            kind: 'inner_join',
            left: leftTable,
            right: rightTable,
            on: Pred.eq(Pred.attr('t1.sid'), Pred.attr('t2.sid')),
          },
        },
      };
      const { sql } = compile(expr);
      expect(sql).toBe(
        'SELECT "t1"."name", "t2"."qty" FROM "suppliers" "t1" JOIN "shipments" "t2" ON "t1"."sid" = "t2"."sid"'
      );
    });

    it('LEFT JOIN', () => {
      const b = new SqlBuilder();
      const expr: SelectExpr = {
        kind: 'select',
        quantifier: 'all',
        selectList: [
          b.selectItem('t1', 'name'),
          b.selectItem('t2', 'qty'),
        ],
        from: {
          tableSpec: {
            kind: 'left_join',
            left: b.tableRef('suppliers', 't1'),
            right: b.tableRef('shipments', 't2'),
            on: Pred.eq(Pred.attr('t1.sid'), Pred.attr('t2.sid')),
          },
        },
      };
      const { sql } = compile(expr);
      expect(sql).toBe(
        'SELECT "t1"."name", "t2"."qty" FROM "suppliers" "t1" LEFT JOIN "shipments" "t2" ON "t1"."sid" = "t2"."sid"'
      );
    });

    it('CROSS JOIN', () => {
      const b = new SqlBuilder();
      const expr: SelectExpr = {
        kind: 'select',
        quantifier: 'all',
        selectList: [
          b.selectItem('t1', 'name'),
          b.selectItem('t2', 'pname'),
        ],
        from: {
          tableSpec: {
            kind: 'cross_join',
            left: b.tableRef('suppliers', 't1'),
            right: b.tableRef('parts', 't2'),
          },
        },
      };
      const { sql } = compile(expr);
      expect(sql).toBe(
        'SELECT "t1"."name", "t2"."pname" FROM "suppliers" "t1" CROSS JOIN "parts" "t2"'
      );
    });
  });

  describe('aliased expressions', () => {
    it('adds AS when alias differs from column name', () => {
      const b = new SqlBuilder();
      const expr: SelectExpr = {
        kind: 'select',
        quantifier: 'all',
        selectList: [
          b.selectItem('t1', 'sid', 'supplier_id'),
        ],
        from: { tableSpec: b.tableRef('suppliers', 't1') },
      };
      const { sql } = compile(expr);
      expect(sql).toBe(
        'SELECT "t1"."sid" AS "supplier_id" FROM "suppliers" "t1"'
      );
    });

    it('skips AS when alias matches column name', () => {
      const b = new SqlBuilder();
      const expr: SelectExpr = {
        kind: 'select',
        quantifier: 'all',
        selectList: [
          b.selectItem('t1', 'sid'),
        ],
        from: { tableSpec: b.tableRef('suppliers', 't1') },
      };
      const { sql } = compile(expr);
      expect(sql).toBe('SELECT "t1"."sid" FROM "suppliers" "t1"');
    });

    it('literal value with alias', () => {
      const b = new SqlBuilder();
      const expr: SelectExpr = {
        kind: 'select',
        quantifier: 'all',
        selectList: [
          b.selectItem('t1', 'sid'),
          { expr: b.literal(42), alias: 'answer' },
        ],
        from: { tableSpec: b.tableRef('suppliers', 't1') },
      };
      const { sql, params } = compile(expr);
      expect(sql).toBe('SELECT "t1"."sid", $1 AS "answer" FROM "suppliers" "t1"');
      expect(params).toEqual([42]);
    });
  });

  describe('complex query', () => {
    it('SELECT with WHERE, ORDER BY, LIMIT', () => {
      const b = new SqlBuilder();
      const expr: SelectExpr = {
        ...b.selectFrom(['sid', 'name', 'city'], 'suppliers'),
        where: Pred.and(
          Pred.neq('city', 'Athens'),
          Pred.gte('status', 20)
        ),
        orderBy: [
          { expr: b.columnRef('t1', 'city'), direction: 'asc' },
          { expr: b.columnRef('t1', 'name'), direction: 'desc' },
        ],
        limit: 10,
        offset: 5,
      };
      const { sql, params } = compile(expr);
      expect(sql).toBe(
        'SELECT "t1"."sid", "t1"."name", "t1"."city" FROM "suppliers" "t1" ' +
        'WHERE "t1"."city" <> $1 AND "t1"."status" >= $2 ' +
        'ORDER BY "t1"."city" ASC, "t1"."name" DESC ' +
        'LIMIT 10 OFFSET 5'
      );
      expect(params).toEqual(['Athens', 20]);
    });
  });

  describe('SQLite dialect', () => {
    it('uses ? placeholders', () => {
      const b = new SqlBuilder();
      const expr: SelectExpr = {
        ...b.selectFrom(['sid'], 'suppliers'),
        where: Pred.eq('city', 'London'),
      };
      const { sql, params } = compile(expr, SqliteDialect);
      expect(sql).toBe('SELECT "t1"."sid" FROM "suppliers" "t1" WHERE "t1"."city" = ?');
      expect(params).toEqual(['London']);
    });
  });
});
