import { describe, it, expect } from 'vitest';
import { Pred, evaluate, toFunction } from '../src';

const smith = { sid: 'S1', name: 'Smith', status: 20, city: 'London' };
const jones = { sid: 'S2', name: 'Jones', status: 10, city: 'Paris' };
const blake = { sid: 'S3', name: 'Blake', status: 30, city: 'Paris' };
const clark = { sid: 'S4', name: 'Clark', status: 20, city: 'London' };
const adams = { sid: 'S5', name: 'Adams', status: 30, city: 'Athens' };

describe('evaluate', () => {

  describe('eq', () => {
    it('matches equal values', () => {
      expect(evaluate(Pred.eq('city', 'London'), smith)).toBe(true);
    });

    it('rejects unequal values', () => {
      expect(evaluate(Pred.eq('city', 'London'), jones)).toBe(false);
    });

    it('compares two attributes', () => {
      const tuple = { a: 'x', b: 'x' };
      expect(evaluate(Pred.eq(Pred.attr('a'), Pred.attr('b')), tuple)).toBe(true);
    });

    it('handles null', () => {
      expect(evaluate(Pred.eq('city', null), { city: null })).toBe(true);
      expect(evaluate(Pred.eq('city', null), smith)).toBe(false);
    });
  });

  describe('neq', () => {
    it('matches unequal values', () => {
      expect(evaluate(Pred.neq('city', 'London'), jones)).toBe(true);
    });

    it('rejects equal values', () => {
      expect(evaluate(Pred.neq('city', 'London'), smith)).toBe(false);
    });
  });

  describe('lt', () => {
    it('matches lesser values', () => {
      expect(evaluate(Pred.lt('status', 20), jones)).toBe(true);
    });

    it('rejects equal values', () => {
      expect(evaluate(Pred.lt('status', 20), smith)).toBe(false);
    });

    it('rejects greater values', () => {
      expect(evaluate(Pred.lt('status', 20), blake)).toBe(false);
    });
  });

  describe('lte', () => {
    it('matches equal values', () => {
      expect(evaluate(Pred.lte('status', 20), smith)).toBe(true);
    });

    it('matches lesser values', () => {
      expect(evaluate(Pred.lte('status', 20), jones)).toBe(true);
    });

    it('rejects greater values', () => {
      expect(evaluate(Pred.lte('status', 20), blake)).toBe(false);
    });
  });

  describe('gt', () => {
    it('matches greater values', () => {
      expect(evaluate(Pred.gt('status', 20), blake)).toBe(true);
    });

    it('rejects equal values', () => {
      expect(evaluate(Pred.gt('status', 20), smith)).toBe(false);
    });
  });

  describe('gte', () => {
    it('matches equal values', () => {
      expect(evaluate(Pred.gte('status', 20), smith)).toBe(true);
    });

    it('matches greater values', () => {
      expect(evaluate(Pred.gte('status', 20), blake)).toBe(true);
    });

    it('rejects lesser values', () => {
      expect(evaluate(Pred.gte('status', 20), jones)).toBe(false);
    });
  });

  describe('in', () => {
    it('matches values in the set', () => {
      expect(evaluate(Pred.in('city', ['London', 'Paris']), smith)).toBe(true);
      expect(evaluate(Pred.in('city', ['London', 'Paris']), jones)).toBe(true);
    });

    it('rejects values not in the set', () => {
      expect(evaluate(Pred.in('city', ['London', 'Paris']), adams)).toBe(false);
    });

    it('empty set matches nothing', () => {
      expect(evaluate(Pred.in('city', []), smith)).toBe(false);
    });
  });

  describe('and', () => {
    it('requires all operands to be true', () => {
      const p = Pred.and(Pred.eq('city', 'London'), Pred.gte('status', 20));
      expect(evaluate(p, smith)).toBe(true);   // London, 20
      expect(evaluate(p, jones)).toBe(false);   // Paris, 10
    });

    it('empty and is tautology', () => {
      const p = Pred.and();
      // and with no operands — all vacuously true
      expect(evaluate(p, smith)).toBe(true);
    });
  });

  describe('or', () => {
    it('requires at least one operand to be true', () => {
      const p = Pred.or(Pred.eq('city', 'London'), Pred.eq('city', 'Paris'));
      expect(evaluate(p, smith)).toBe(true);
      expect(evaluate(p, jones)).toBe(true);
      expect(evaluate(p, adams)).toBe(false); // Athens
    });

    it('empty or is contradiction', () => {
      const p = Pred.or();
      expect(evaluate(p, smith)).toBe(false);
    });
  });

  describe('not', () => {
    it('negates the operand', () => {
      const p = Pred.not(Pred.eq('city', 'London'));
      expect(evaluate(p, smith)).toBe(false);
      expect(evaluate(p, jones)).toBe(true);
    });
  });

  describe('tautology', () => {
    it('always returns true', () => {
      expect(evaluate(Pred.tautology(), smith)).toBe(true);
      expect(evaluate(Pred.tautology(), {})).toBe(true);
    });
  });

  describe('contradiction', () => {
    it('always returns false', () => {
      expect(evaluate(Pred.contradiction(), smith)).toBe(false);
      expect(evaluate(Pred.contradiction(), {})).toBe(false);
    });
  });

  describe('complex compositions', () => {
    it('(city = London AND status >= 20) OR city = Athens', () => {
      const p = Pred.or(
        Pred.and(Pred.eq('city', 'London'), Pred.gte('status', 20)),
        Pred.eq('city', 'Athens')
      );
      expect(evaluate(p, smith)).toBe(true);   // London, 20
      expect(evaluate(p, jones)).toBe(false);   // Paris, 10
      expect(evaluate(p, adams)).toBe(true);   // Athens
    });

    it('NOT (city IN [London, Paris])', () => {
      const p = Pred.not(Pred.in('city', ['London', 'Paris']));
      expect(evaluate(p, smith)).toBe(false);
      expect(evaluate(p, jones)).toBe(false);
      expect(evaluate(p, adams)).toBe(true);
    });
  });

  describe('toFunction', () => {
    it('returns a filter function', () => {
      const fn = toFunction(Pred.eq('city', 'London'));
      expect(fn(smith)).toBe(true);
      expect(fn(jones)).toBe(false);
    });

    it('works with Array.filter', () => {
      const suppliers = [smith, jones, blake, clark, adams];
      const londonSuppliers = suppliers.filter(toFunction(Pred.eq('city', 'London')));
      expect(londonSuppliers).toHaveLength(2);
      expect(londonSuppliers.map(s => s.name).sort()).toEqual(['Clark', 'Smith']);
    });
  });
});
