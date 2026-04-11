import { describe, it, expect } from 'vitest';
import { Pred } from '@enspirit/predicate';
import {
  SqlBuilder, compile,
  processWhere, processProject, processAllbut, processRename,
  processExtend, processConstants, processRequalify,
  processJoin, processMerge,
  processSummarize, processSemiJoin, processOrderBy, processLimitOffset,
} from '../src';
import type { SelectExpr } from '../src';

/** Helper: build a base suppliers query */
function suppliersExpr() {
  const b = new SqlBuilder();
  return { expr: b.selectFrom(['sid', 'name', 'status', 'city'], 'suppliers'), builder: b };
}

/** Compile and return just the SQL string */
function sql(expr: any) {
  return compile(expr).sql;
}

describe('processors', () => {

  // ========================================================================
  // processWhere
  // ========================================================================
  describe('processWhere', () => {
    it('adds a WHERE clause', () => {
      const { expr, builder } = suppliersExpr();
      const result = processWhere(expr, Pred.eq('city', 'London'), builder);
      expect(sql(result)).toBe(
        'SELECT "t1"."sid", "t1"."name", "t1"."status", "t1"."city" ' +
        'FROM "suppliers" "t1" ' +
        'WHERE "t1"."city" = $1'
      );
      expect(compile(result).params).toEqual(['London']);
    });

    it('merges with existing WHERE using AND', () => {
      const { expr, builder } = suppliersExpr();
      const step1 = processWhere(expr, Pred.eq('city', 'London'), builder);
      const step2 = processWhere(step1, Pred.gt('status', 10), builder);
      expect(sql(step2)).toBe(
        'SELECT "t1"."sid", "t1"."name", "t1"."status", "t1"."city" ' +
        'FROM "suppliers" "t1" ' +
        'WHERE "t1"."city" = $1 AND "t1"."status" > $2'
      );
    });

    it('wraps in subquery when GROUP BY exists', () => {
      const b = new SqlBuilder();
      const grouped: SelectExpr = {
        kind: 'select',
        quantifier: 'all',
        selectList: [
          b.selectItem('t1', 'city'),
          { expr: b.aggregate('count'), alias: 'cnt' },
        ],
        from: { tableSpec: b.tableRef('suppliers', 't1') },
        groupBy: [b.columnRef('t1', 'city')],
      };
      const result = processWhere(grouped, Pred.gt('cnt', 5), b);
      // Should wrap the grouped query in a subquery, then apply WHERE
      const compiled = compile(result);
      expect(compiled.sql).toContain('FROM (SELECT');
      expect(compiled.sql).toContain('WHERE');
      expect(compiled.sql).toContain('> $1');
      expect(compiled.params).toEqual([5]);
    });

    it('handles set operations by wrapping in subquery', () => {
      const b1 = new SqlBuilder();
      const left = b1.selectFrom(['sid'], 'suppliers');
      const b2 = new SqlBuilder(1);
      const right = b2.selectFrom(['sid'], 'parts');
      const union = b1.union(left, right);

      const b3 = new SqlBuilder(2);
      const result = processWhere(union, Pred.eq('sid', 'S1'), b3);
      const compiled = compile(result);
      expect(compiled.sql).toContain('WHERE');
      expect(compiled.sql).toContain('UNION');
    });
  });

  // ========================================================================
  // processProject
  // ========================================================================
  describe('processProject', () => {
    it('keeps only specified columns', () => {
      const { expr, builder } = suppliersExpr();
      const result = processProject(expr, ['sid', 'name'], builder);
      expect(sql(result)).toBe(
        'SELECT DISTINCT "t1"."sid", "t1"."name" FROM "suppliers" "t1"'
      );
    });

    it('adds DISTINCT', () => {
      const { expr, builder } = suppliersExpr();
      const result = processProject(expr, ['city'], builder);
      const compiled = compile(result);
      expect(compiled.sql).toContain('SELECT DISTINCT');
    });

    it('handles set operations by wrapping first', () => {
      const b1 = new SqlBuilder();
      const left = b1.selectFrom(['sid', 'name'], 'suppliers');
      const b2 = new SqlBuilder(1);
      const right = b2.selectFrom(['sid', 'name'], 'parts');
      const union = b1.union(left, right);

      const b3 = new SqlBuilder(2);
      const result = processProject(union, ['sid'], b3);
      expect(sql(result)).toContain('SELECT DISTINCT');
      expect(sql(result)).toContain('UNION');
    });
  });

  // ========================================================================
  // processAllbut
  // ========================================================================
  describe('processAllbut', () => {
    it('removes specified columns', () => {
      const { expr, builder } = suppliersExpr();
      const result = processAllbut(expr, ['status', 'city'], builder);
      expect(sql(result)).toBe(
        'SELECT DISTINCT "t1"."sid", "t1"."name" FROM "suppliers" "t1"'
      );
    });
  });

  // ========================================================================
  // processRename
  // ========================================================================
  describe('processRename', () => {
    it('renames columns', () => {
      const { expr, builder } = suppliersExpr();
      const result = processRename(expr, { name: 'sname', city: 'location' }, builder);
      expect(sql(result)).toBe(
        'SELECT "t1"."sid", "t1"."name" AS "sname", "t1"."status", "t1"."city" AS "location" ' +
        'FROM "suppliers" "t1"'
      );
    });

    it('leaves non-renamed columns unchanged', () => {
      const { expr, builder } = suppliersExpr();
      const result = processRename(expr, { name: 'sname' }, builder);
      const compiled = compile(result);
      expect(compiled.sql).toContain('"t1"."sid"');  // unchanged
      expect(compiled.sql).toContain('"sname"');       // renamed
      expect(compiled.sql).toContain('"t1"."status"'); // unchanged
    });
  });

  // ========================================================================
  // processExtend
  // ========================================================================
  describe('processExtend', () => {
    it('adds columns that reference existing columns', () => {
      const { expr, builder } = suppliersExpr();
      const result = processExtend(expr, { location: 'city' }, builder);
      expect(sql(result)).toBe(
        'SELECT "t1"."sid", "t1"."name", "t1"."status", "t1"."city", ' +
        '"t1"."city" AS "location" FROM "suppliers" "t1"'
      );
    });
  });

  // ========================================================================
  // processConstants
  // ========================================================================
  describe('processConstants', () => {
    it('adds literal constant columns', () => {
      const { expr, builder } = suppliersExpr();
      const result = processConstants(expr, { source: 'manual' }, builder);
      const compiled = compile(result);
      expect(compiled.sql).toBe(
        'SELECT "t1"."sid", "t1"."name", "t1"."status", "t1"."city", ' +
        '$1 AS "source" FROM "suppliers" "t1"'
      );
      expect(compiled.params).toEqual(['manual']);
    });
  });

  // ========================================================================
  // processRequalify
  // ========================================================================
  describe('processRequalify', () => {
    it('assigns new table qualifiers', () => {
      const b = new SqlBuilder();
      const expr = b.selectFrom(['sid', 'name'], 'suppliers');
      // t1 is used by the original query
      // Requalify should assign t2 (next available)
      const b2 = new SqlBuilder(1);
      const result = processRequalify(expr, b2);
      const compiled = compile(result);
      expect(compiled.sql).toBe(
        'SELECT "t2"."sid", "t2"."name" FROM "suppliers" "t2"'
      );
    });
  });

  // ========================================================================
  // processJoin
  // ========================================================================
  describe('processJoin', () => {
    it('INNER JOIN two tables', () => {
      const b = new SqlBuilder();
      const left = b.selectFrom(['sid', 'name', 'city'], 'suppliers');
      const b2 = new SqlBuilder();
      const right = b2.selectFrom(['sid', 'qty'], 'shipments');

      const result = processJoin(
        left, right,
        Pred.eq(Pred.attr('t1.sid'), Pred.attr('t2.sid')),
        'inner_join',
        b
      );
      const compiled = compile(result);
      // left keeps sid, name, city; right adds qty (sid already in left)
      expect(compiled.sql).toContain('JOIN');
      expect(compiled.sql).toContain('"suppliers"');
      expect(compiled.sql).toContain('"shipments"');
      expect(compiled.sql).toContain('ON');
    });

    it('LEFT JOIN two tables', () => {
      const b = new SqlBuilder();
      const left = b.selectFrom(['sid', 'name'], 'suppliers');
      const b2 = new SqlBuilder();
      const right = b2.selectFrom(['sid', 'qty'], 'shipments');

      const result = processJoin(
        left, right,
        Pred.eq(Pred.attr('t1.sid'), Pred.attr('t3.sid')),
        'left_join',
        b
      );
      const compiled = compile(result);
      expect(compiled.sql).toContain('LEFT JOIN');
    });

    it('merges WHERE clauses from both sides', () => {
      const b1 = new SqlBuilder();
      const left: SelectExpr = {
        ...b1.selectFrom(['sid', 'name'], 'suppliers'),
        where: Pred.eq('city', 'London'),
      };
      const b2 = new SqlBuilder();
      const right: SelectExpr = {
        ...b2.selectFrom(['sid', 'qty'], 'shipments'),
        where: Pred.gt('qty', 100),
      };

      const result = processJoin(
        left, right,
        Pred.eq(Pred.attr('t1.sid'), Pred.attr('t3.sid')),
        'inner_join',
        b1
      );
      const compiled = compile(result);
      expect(compiled.sql).toContain('WHERE');
      // Both predicates should be in the WHERE
      expect(compiled.params.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ========================================================================
  // processMerge
  // ========================================================================
  describe('processMerge', () => {
    it('UNION', () => {
      const b = new SqlBuilder();
      const left = b.selectFrom(['sid'], 'suppliers');
      const right = b.selectFrom(['sid'], 'parts');
      const result = processMerge(left, right, 'union', false, b);
      expect(sql(result)).toContain('UNION');
      expect(sql(result)).not.toContain('ALL');
    });

    it('UNION ALL', () => {
      const b = new SqlBuilder();
      const left = b.selectFrom(['sid'], 'suppliers');
      const right = b.selectFrom(['sid'], 'parts');
      const result = processMerge(left, right, 'union', true, b);
      expect(sql(result)).toContain('UNION ALL');
    });

    it('EXCEPT', () => {
      const b = new SqlBuilder();
      const left = b.selectFrom(['sid'], 'suppliers');
      const right = b.selectFrom(['sid'], 'excluded');
      const result = processMerge(left, right, 'except', false, b);
      expect(sql(result)).toContain('EXCEPT');
    });

    it('INTERSECT', () => {
      const b = new SqlBuilder();
      const left = b.selectFrom(['sid'], 'suppliers');
      const right = b.selectFrom(['sid'], 'preferred');
      const result = processMerge(left, right, 'intersect', false, b);
      expect(sql(result)).toContain('INTERSECT');
    });
  });

  // ========================================================================
  // Chained operations (integration)
  // ========================================================================
  describe('chained operations', () => {
    it('restrict → project', () => {
      const b = new SqlBuilder();
      const base = b.selectFrom(['sid', 'name', 'status', 'city'], 'suppliers');
      const restricted = processWhere(base, Pred.eq('city', 'London'), b);
      const projected = processProject(restricted, ['sid', 'name'], b);
      const compiled = compile(projected);
      expect(compiled.sql).toBe(
        'SELECT DISTINCT "t1"."sid", "t1"."name" FROM "suppliers" "t1" WHERE "t1"."city" = $1'
      );
      expect(compiled.params).toEqual(['London']);
    });

    it('restrict → rename → project', () => {
      const b = new SqlBuilder();
      const base = b.selectFrom(['sid', 'name', 'status', 'city'], 'suppliers');
      const restricted = processWhere(base, Pred.gt('status', 10), b);
      const renamed = processRename(restricted, { name: 'sname' }, b);
      const projected = processProject(renamed, ['sid', 'sname'], b);
      const compiled = compile(projected);
      expect(compiled.sql).toBe(
        'SELECT DISTINCT "t1"."sid", "t1"."name" AS "sname" ' +
        'FROM "suppliers" "t1" WHERE "t1"."status" > $1'
      );
      expect(compiled.params).toEqual([10]);
    });

    it('project → restrict (wraps in subquery when needed)', () => {
      const b = new SqlBuilder();
      const base = b.selectFrom(['sid', 'name', 'city'], 'suppliers');
      const projected = processProject(base, ['sid', 'city'], b);
      // Adding WHERE to a DISTINCT query doesn't require subquery wrapping
      const restricted = processWhere(projected, Pred.eq('city', 'London'), b);
      const compiled = compile(restricted);
      expect(compiled.sql).toContain('SELECT DISTINCT');
      expect(compiled.sql).toContain('WHERE');
    });
  });

  // ========================================================================
  // processSummarize
  // ========================================================================
  describe('processSummarize', () => {
    it('GROUP BY with COUNT(*)', () => {
      const b = new SqlBuilder();
      const base = b.selectFrom(['sid', 'name', 'status', 'city'], 'suppliers');
      const result = processSummarize(base, ['city'], { cnt: 'count' }, b);
      const compiled = compile(result);
      expect(compiled.sql).toBe(
        'SELECT "t1"."city", COUNT(*) AS "cnt" FROM "suppliers" "t1" GROUP BY "t1"."city"'
      );
    });

    it('GROUP BY with SUM', () => {
      const b = new SqlBuilder();
      const base = b.selectFrom(['sid', 'name', 'status', 'city'], 'suppliers');
      const result = processSummarize(base, ['city'], {
        total: { func: 'sum', attr: 'status' }
      }, b);
      const compiled = compile(result);
      expect(compiled.sql).toBe(
        'SELECT "t1"."city", SUM("t1"."status") AS "total" FROM "suppliers" "t1" GROUP BY "t1"."city"'
      );
    });

    it('multiple aggregates', () => {
      const b = new SqlBuilder();
      const base = b.selectFrom(['sid', 'name', 'status', 'city'], 'suppliers');
      const result = processSummarize(base, ['city'], {
        cnt: 'count',
        avg_status: { func: 'avg', attr: 'status' },
        max_status: { func: 'max', attr: 'status' },
      }, b);
      const compiled = compile(result);
      expect(compiled.sql).toContain('COUNT(*)');
      expect(compiled.sql).toContain('AVG("t1"."status")');
      expect(compiled.sql).toContain('MAX("t1"."status")');
      expect(compiled.sql).toContain('GROUP BY');
    });

    it('wraps in subquery if already grouped', () => {
      const b = new SqlBuilder();
      const base = b.selectFrom(['sid', 'name', 'status', 'city'], 'suppliers');
      const grouped = processSummarize(base, ['city'], { cnt: 'count' }, b);
      // Summarize again on top of grouped result
      const result = processSummarize(grouped, [], { total: 'count' }, b);
      const compiled = compile(result);
      // Should wrap the first GROUP BY in a subquery
      expect(compiled.sql).toContain('FROM (SELECT');
    });
  });

  // ========================================================================
  // processSemiJoin
  // ========================================================================
  describe('processSemiJoin', () => {
    it('matching generates EXISTS', () => {
      const b = new SqlBuilder();
      const left = b.selectFrom(['sid', 'name', 'city'], 'suppliers');
      const b2 = new SqlBuilder(1);
      const right = b2.selectFrom(['sid', 'pid', 'qty'], 'shipments');
      const result = processSemiJoin(left, right, ['sid'], false, b);
      const compiled = compile(result);
      expect(compiled.sql).toContain('EXISTS');
      expect(compiled.sql).toContain('"shipments"');
      expect(compiled.sql).not.toContain('NOT EXISTS');
    });

    it('not_matching generates NOT EXISTS', () => {
      const b = new SqlBuilder();
      const left = b.selectFrom(['sid', 'name', 'city'], 'suppliers');
      const b2 = new SqlBuilder(1);
      const right = b2.selectFrom(['sid', 'pid', 'qty'], 'shipments');
      const result = processSemiJoin(left, right, ['sid'], true, b);
      const compiled = compile(result);
      expect(compiled.sql).toContain('NOT EXISTS');
    });
  });

  // ========================================================================
  // processOrderBy
  // ========================================================================
  describe('processOrderBy', () => {
    it('adds ORDER BY', () => {
      const b = new SqlBuilder();
      const base = b.selectFrom(['sid', 'name', 'city'], 'suppliers');
      const result = processOrderBy(base, [
        { attr: 'city', direction: 'asc' },
        { attr: 'name', direction: 'desc' },
      ], b);
      const compiled = compile(result);
      expect(compiled.sql).toContain('ORDER BY "t1"."city" ASC, "t1"."name" DESC');
    });
  });

  // ========================================================================
  // processLimitOffset
  // ========================================================================
  describe('processLimitOffset', () => {
    it('adds LIMIT', () => {
      const b = new SqlBuilder();
      const base = b.selectFrom(['sid'], 'suppliers');
      const result = processLimitOffset(base, 10, undefined, b);
      const compiled = compile(result);
      expect(compiled.sql).toContain('LIMIT 10');
    });

    it('adds LIMIT and OFFSET', () => {
      const b = new SqlBuilder();
      const base = b.selectFrom(['sid'], 'suppliers');
      const result = processLimitOffset(base, 10, 20, b);
      const compiled = compile(result);
      expect(compiled.sql).toContain('LIMIT 10');
      expect(compiled.sql).toContain('OFFSET 20');
    });
  });
});
