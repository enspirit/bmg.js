import { describe, it, expect } from 'vitest';
import { Pred, eq, neq, lt, lte, gt, gte, isIn, match, and, or, not, tautology, contradiction, fromObject, attr, literal } from '../src';

describe('Pred builder', () => {

  describe('comparison predicates', () => {
    it('eq with string attr and literal value', () => {
      const p = Pred.eq('city', 'London');
      expect(p).toEqual({
        kind: 'eq',
        left: { kind: 'attr', name: 'city' },
        right: { kind: 'literal', value: 'London' },
      });
    });

    it('eq with explicit ScalarExpr nodes', () => {
      const p = eq(attr('city'), literal('London'));
      expect(p).toEqual({
        kind: 'eq',
        left: { kind: 'attr', name: 'city' },
        right: { kind: 'literal', value: 'London' },
      });
    });

    it('neq', () => {
      expect(neq('status', 10).kind).toBe('neq');
    });

    it('lt', () => {
      expect(lt('status', 10).kind).toBe('lt');
    });

    it('lte', () => {
      expect(lte('status', 10).kind).toBe('lte');
    });

    it('gt', () => {
      expect(gt('status', 10).kind).toBe('gt');
    });

    it('gte', () => {
      expect(gte('status', 10).kind).toBe('gte');
    });

    it('eq with null', () => {
      const p = eq('city', null);
      expect(p.right).toEqual({ kind: 'literal', value: null });
    });

    it('eq comparing two attributes', () => {
      const p = eq(attr('city'), attr('hometown'));
      expect(p.left).toEqual({ kind: 'attr', name: 'city' });
      expect(p.right).toEqual({ kind: 'attr', name: 'hometown' });
    });
  });

  describe('in predicate', () => {
    it('creates an in predicate', () => {
      const p = Pred.in('city', ['London', 'Paris']);
      expect(p).toEqual({
        kind: 'in',
        left: { kind: 'attr', name: 'city' },
        values: ['London', 'Paris'],
      });
    });

    it('with empty values', () => {
      const p = isIn('city', []);
      expect(p.values).toEqual([]);
    });
  });

  describe('match predicate', () => {
    it('creates a case-sensitive match by default', () => {
      const p = match('city', 'Lon');
      expect(p).toEqual({
        kind: 'match',
        left: { kind: 'attr', name: 'city' },
        pattern: 'Lon',
        caseSensitive: undefined,
      });
    });

    it('carries caseSensitive: false when set', () => {
      const p = Pred.match('city', 'Lon', { caseSensitive: false });
      expect(p.caseSensitive).toBe(false);
    });
  });

  describe('boolean connectives', () => {
    it('and with two operands', () => {
      const p = Pred.and(eq('city', 'London'), gt('status', 10));
      expect(p.kind).toBe('and');
      expect(p.operands).toHaveLength(2);
    });

    it('and flattens nested ANDs', () => {
      const inner = and(eq('a', 1), eq('b', 2));
      const outer = and(inner, eq('c', 3));
      expect(outer.operands).toHaveLength(3);
    });

    it('or with two operands', () => {
      const p = or(eq('city', 'London'), eq('city', 'Paris'));
      expect(p.kind).toBe('or');
      expect(p.operands).toHaveLength(2);
    });

    it('or flattens nested ORs', () => {
      const inner = or(eq('a', 1), eq('b', 2));
      const outer = or(inner, eq('c', 3));
      expect(outer.operands).toHaveLength(3);
    });

    it('not', () => {
      const p = not(eq('city', 'London'));
      expect(p.kind).toBe('not');
      expect(p.operand.kind).toBe('eq');
    });
  });

  describe('constants', () => {
    it('tautology', () => {
      expect(tautology()).toEqual({ kind: 'tautology' });
    });

    it('contradiction', () => {
      expect(contradiction()).toEqual({ kind: 'contradiction' });
    });
  });

  describe('fromObject', () => {
    it('converts a single key to eq', () => {
      const p = fromObject({ city: 'London' });
      expect(p.kind).toBe('eq');
    });

    it('converts multiple keys to and of eqs', () => {
      const p = fromObject({ city: 'London', status: 20 });
      expect(p.kind).toBe('and');
      if (p.kind === 'and') {
        expect(p.operands).toHaveLength(2);
        expect(p.operands[0].kind).toBe('eq');
        expect(p.operands[1].kind).toBe('eq');
      }
    });

    it('converts empty object to tautology', () => {
      const p = fromObject({});
      expect(p.kind).toBe('tautology');
    });
  });

  describe('Pred namespace', () => {
    it('exposes all builders', () => {
      expect(typeof Pred.eq).toBe('function');
      expect(typeof Pred.neq).toBe('function');
      expect(typeof Pred.lt).toBe('function');
      expect(typeof Pred.lte).toBe('function');
      expect(typeof Pred.gt).toBe('function');
      expect(typeof Pred.gte).toBe('function');
      expect(typeof Pred.in).toBe('function');
      expect(typeof Pred.match).toBe('function');
      expect(typeof Pred.and).toBe('function');
      expect(typeof Pred.or).toBe('function');
      expect(typeof Pred.not).toBe('function');
      expect(typeof Pred.tautology).toBe('function');
      expect(typeof Pred.contradiction).toBe('function');
      expect(typeof Pred.fromObject).toBe('function');
      expect(typeof Pred.attr).toBe('function');
      expect(typeof Pred.literal).toBe('function');
    });
  });
});
