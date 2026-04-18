import { describe, it, expect } from 'vitest';
import { Pred, toSql, PostgresDialect, SqliteDialect } from '../src';

describe('toSql', () => {

  describe('comparison predicates (Postgres)', () => {
    it('eq', () => {
      const { sql, params } = toSql(Pred.eq('city', 'London'));
      expect(sql).toBe('"city" = $1');
      expect(params).toEqual(['London']);
    });

    it('neq', () => {
      const { sql, params } = toSql(Pred.neq('city', 'London'));
      expect(sql).toBe('"city" <> $1');
      expect(params).toEqual(['London']);
    });

    it('lt', () => {
      const { sql, params } = toSql(Pred.lt('status', 20));
      expect(sql).toBe('"status" < $1');
      expect(params).toEqual([20]);
    });

    it('lte', () => {
      const { sql, params } = toSql(Pred.lte('status', 20));
      expect(sql).toBe('"status" <= $1');
      expect(params).toEqual([20]);
    });

    it('gt', () => {
      const { sql, params } = toSql(Pred.gt('status', 20));
      expect(sql).toBe('"status" > $1');
      expect(params).toEqual([20]);
    });

    it('gte', () => {
      const { sql, params } = toSql(Pred.gte('status', 20));
      expect(sql).toBe('"status" >= $1');
      expect(params).toEqual([20]);
    });
  });

  describe('NULL handling', () => {
    it('eq null becomes IS NULL', () => {
      const { sql, params } = toSql(Pred.eq('city', null));
      expect(sql).toBe('"city" IS NULL');
      expect(params).toEqual([]);
    });

    it('neq null becomes IS NOT NULL', () => {
      const { sql, params } = toSql(Pred.neq('city', null));
      expect(sql).toBe('"city" IS NOT NULL');
      expect(params).toEqual([]);
    });
  });

  describe('comparing two attributes', () => {
    it('generates correct SQL', () => {
      const { sql, params } = toSql(Pred.eq(Pred.attr('city'), Pred.attr('hometown')));
      expect(sql).toBe('"city" = "hometown"');
      expect(params).toEqual([]);
    });
  });

  describe('in predicate', () => {
    it('generates IN clause', () => {
      const { sql, params } = toSql(Pred.in('city', ['London', 'Paris']));
      expect(sql).toBe('"city" IN ($1, $2)');
      expect(params).toEqual(['London', 'Paris']);
    });

    it('empty values becomes contradiction', () => {
      const { sql, params } = toSql(Pred.in('city', []));
      expect(sql).toBe('1 = 0');
      expect(params).toEqual([]);
    });

    it('null-only list becomes IS NULL', () => {
      const { sql, params } = toSql(Pred.in('city', [null]));
      expect(sql).toBe('"city" IS NULL');
      expect(params).toEqual([]);
    });

    it('list with only nulls (multiple) still becomes IS NULL', () => {
      const { sql, params } = toSql(Pred.in('city', [null, null]));
      expect(sql).toBe('"city" IS NULL');
      expect(params).toEqual([]);
    });

    it('null + one value splits null out', () => {
      const { sql, params } = toSql(Pred.in('city', [null, 'London']));
      expect(sql).toBe('("city" IS NULL OR "city" IN ($1))');
      expect(params).toEqual(['London']);
    });

    it('null + multiple values splits null out, preserves order', () => {
      const { sql, params } = toSql(Pred.in('city', [null, 'London', 'Paris']));
      expect(sql).toBe('("city" IS NULL OR "city" IN ($1, $2))');
      expect(params).toEqual(['London', 'Paris']);
    });

    it('nulls anywhere in the list are partitioned out', () => {
      const { sql, params } = toSql(Pred.in('city', ['London', null, 'Paris']));
      expect(sql).toBe('("city" IS NULL OR "city" IN ($1, $2))');
      expect(params).toEqual(['London', 'Paris']);
    });

    it('null-split form parenthesizes correctly inside AND', () => {
      const p = Pred.and(
        Pred.in('city', [null, 'London']),
        Pred.gt('status', 10),
      );
      const { sql, params } = toSql(p);
      expect(sql).toBe('("city" IS NULL OR "city" IN ($1)) AND "status" > $2');
      expect(params).toEqual(['London', 10]);
    });

    it('null-split form parenthesizes correctly inside NOT', () => {
      const { sql, params } = toSql(Pred.not(Pred.in('city', [null, 'London'])));
      expect(sql).toBe('NOT ("city" IS NULL OR "city" IN ($1))');
      expect(params).toEqual(['London']);
    });
  });

  describe('and', () => {
    it('joins with AND', () => {
      const { sql, params } = toSql(Pred.and(
        Pred.eq('city', 'London'),
        Pred.gt('status', 10)
      ));
      expect(sql).toBe('"city" = $1 AND "status" > $2');
      expect(params).toEqual(['London', 10]);
    });

    it('single operand is unwrapped', () => {
      const { sql } = toSql(Pred.and(Pred.eq('city', 'London')));
      expect(sql).toBe('"city" = $1');
    });

    it('empty and is tautology', () => {
      const { sql } = toSql(Pred.and());
      expect(sql).toBe('1 = 1');
    });

    it('parenthesizes OR inside AND', () => {
      const { sql } = toSql(Pred.and(
        Pred.or(Pred.eq('city', 'London'), Pred.eq('city', 'Paris')),
        Pred.gt('status', 10)
      ));
      expect(sql).toBe('("city" = $1 OR "city" = $2) AND "status" > $3');
    });
  });

  describe('or', () => {
    it('joins with OR', () => {
      const { sql, params } = toSql(Pred.or(
        Pred.eq('city', 'London'),
        Pred.eq('city', 'Paris')
      ));
      expect(sql).toBe('"city" = $1 OR "city" = $2');
      expect(params).toEqual(['London', 'Paris']);
    });

    it('single operand is unwrapped', () => {
      const { sql } = toSql(Pred.or(Pred.eq('city', 'London')));
      expect(sql).toBe('"city" = $1');
    });

    it('empty or is contradiction', () => {
      const { sql } = toSql(Pred.or());
      expect(sql).toBe('1 = 0');
    });

    it('parenthesizes AND inside OR', () => {
      const { sql } = toSql(Pred.or(
        Pred.and(Pred.eq('city', 'London'), Pred.gt('status', 20)),
        Pred.eq('city', 'Athens')
      ));
      expect(sql).toBe('("city" = $1 AND "status" > $2) OR "city" = $3');
    });
  });

  describe('not', () => {
    it('simple negation', () => {
      const { sql } = toSql(Pred.not(Pred.eq('city', 'London')));
      expect(sql).toBe('NOT "city" = $1');
    });

    it('parenthesizes compound expressions', () => {
      const { sql } = toSql(Pred.not(
        Pred.and(Pred.eq('city', 'London'), Pred.gt('status', 10))
      ));
      expect(sql).toBe('NOT ("city" = $1 AND "status" > $2)');
    });
  });

  describe('tautology and contradiction', () => {
    it('tautology', () => {
      const { sql, params } = toSql(Pred.tautology());
      expect(sql).toBe('1 = 1');
      expect(params).toEqual([]);
    });

    it('contradiction', () => {
      const { sql, params } = toSql(Pred.contradiction());
      expect(sql).toBe('1 = 0');
      expect(params).toEqual([]);
    });
  });

  describe('complex composition', () => {
    it('parameter ordering is correct across nested predicates', () => {
      const p = Pred.and(
        Pred.eq('city', 'London'),
        Pred.or(
          Pred.gt('status', 10),
          Pred.in('name', ['Smith', 'Clark'])
        )
      );
      const { sql, params } = toSql(p);
      expect(sql).toBe('"city" = $1 AND ("status" > $2 OR "name" IN ($3, $4))');
      expect(params).toEqual(['London', 10, 'Smith', 'Clark']);
    });
  });

  describe('fromObject', () => {
    it('single key', () => {
      const { sql, params } = toSql(Pred.fromObject({ city: 'London' }));
      expect(sql).toBe('"city" = $1');
      expect(params).toEqual(['London']);
    });

    it('multiple keys', () => {
      const { sql, params } = toSql(Pred.fromObject({ city: 'London', status: 20 }));
      expect(sql).toBe('"city" = $1 AND "status" = $2');
      expect(params).toEqual(['London', 20]);
    });

    it('empty object', () => {
      const { sql } = toSql(Pred.fromObject({}));
      expect(sql).toBe('1 = 1');
    });
  });

  describe('SQLite dialect', () => {
    it('uses ? placeholders', () => {
      const { sql, params } = toSql(
        Pred.and(Pred.eq('city', 'London'), Pred.gt('status', 10)),
        SqliteDialect
      );
      expect(sql).toBe('"city" = ? AND "status" > ?');
      expect(params).toEqual(['London', 10]);
    });
  });

  describe('identifier quoting', () => {
    it('escapes double quotes in identifiers', () => {
      const { sql } = toSql(Pred.eq('col"name', 'value'));
      expect(sql).toBe('"col""name" = $1');
    });
  });
});
