import { describe, it, expect } from 'vitest';
import { Pred, isPredicate, isScalarExpr, attr, literal } from '../src';

describe('isPredicate', () => {
  it('returns true for predicate AST nodes', () => {
    expect(isPredicate(Pred.eq('city', 'London'))).toBe(true);
    expect(isPredicate(Pred.and(Pred.eq('a', 1)))).toBe(true);
    expect(isPredicate(Pred.or(Pred.eq('a', 1)))).toBe(true);
    expect(isPredicate(Pred.not(Pred.eq('a', 1)))).toBe(true);
    expect(isPredicate(Pred.in('a', [1, 2]))).toBe(true);
    expect(isPredicate(Pred.tautology())).toBe(true);
    expect(isPredicate(Pred.contradiction())).toBe(true);
  });

  it('returns false for non-predicates', () => {
    expect(isPredicate(null)).toBe(false);
    expect(isPredicate(undefined)).toBe(false);
    expect(isPredicate(42)).toBe(false);
    expect(isPredicate('hello')).toBe(false);
    expect(isPredicate({ city: 'London' })).toBe(false);
    expect(isPredicate({ kind: 'unknown' })).toBe(false);
    expect(isPredicate(() => true)).toBe(false);
  });
});

describe('isScalarExpr', () => {
  it('returns true for scalar expressions', () => {
    expect(isScalarExpr(attr('city'))).toBe(true);
    expect(isScalarExpr(literal('London'))).toBe(true);
  });

  it('returns false for non-scalars', () => {
    expect(isScalarExpr(null)).toBe(false);
    expect(isScalarExpr(Pred.eq('a', 1))).toBe(false);
    expect(isScalarExpr({ kind: 'unknown' })).toBe(false);
  });
});
