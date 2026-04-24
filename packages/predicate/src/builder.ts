/**
 * Pred — builder helpers for constructing predicate AST nodes.
 *
 * Usage:
 *   Pred.eq('city', 'London')
 *   Pred.and(Pred.gt('status', 10), Pred.neq('city', 'Athens'))
 *   Pred.not(Pred.in('city', ['London', 'Paris']))
 */
import type {
  Predicate,
  ScalarExpr,
  AttrRef,
  Literal,
  EqPredicate,
  NeqPredicate,
  LtPredicate,
  LtePredicate,
  GtPredicate,
  GtePredicate,
  InPredicate,
  MatchPredicate,
  AndPredicate,
  OrPredicate,
  NotPredicate,
  Tautology,
  Contradiction,
} from './types';

// ============================================================================
// Scalar expression helpers
// ============================================================================

/** Create an attribute reference */
export function attr(name: string): AttrRef {
  return { kind: 'attr', name };
}

/** Create a literal value */
export function literal(value: unknown): Literal {
  return { kind: 'literal', value };
}

/**
 * Normalize a comparison argument:
 * - string → attribute reference
 * - anything else → literal
 *
 * This lets users write Pred.eq('city', 'London') instead of
 * Pred.eq(attr('city'), literal('London')).
 */
function toScalar(arg: string | ScalarExpr): ScalarExpr {
  if (typeof arg === 'string') return attr(arg);
  return arg;
}

function toRight(arg: unknown): ScalarExpr {
  if (typeof arg === 'object' && arg !== null && 'kind' in arg) {
    const s = arg as ScalarExpr;
    if (s.kind === 'attr' || s.kind === 'literal') return s;
  }
  return literal(arg);
}

// ============================================================================
// Comparison predicates
// ============================================================================

/**
 * Equality: attr = value, or expr = expr.
 * First argument is always interpreted as an attribute name (string).
 * Second argument is a literal value, unless it's an explicit ScalarExpr.
 */
export function eq(left: string | ScalarExpr, right: unknown): EqPredicate {
  return { kind: 'eq', left: toScalar(left), right: toRight(right) };
}

export function neq(left: string | ScalarExpr, right: unknown): NeqPredicate {
  return { kind: 'neq', left: toScalar(left), right: toRight(right) };
}

export function lt(left: string | ScalarExpr, right: unknown): LtPredicate {
  return { kind: 'lt', left: toScalar(left), right: toRight(right) };
}

export function lte(left: string | ScalarExpr, right: unknown): LtePredicate {
  return { kind: 'lte', left: toScalar(left), right: toRight(right) };
}

export function gt(left: string | ScalarExpr, right: unknown): GtPredicate {
  return { kind: 'gt', left: toScalar(left), right: toRight(right) };
}

export function gte(left: string | ScalarExpr, right: unknown): GtePredicate {
  return { kind: 'gte', left: toScalar(left), right: toRight(right) };
}

// ============================================================================
// Set membership
// ============================================================================

export function isIn(left: string | ScalarExpr, values: unknown[]): InPredicate {
  return { kind: 'in', left: toScalar(left), values };
}

// ============================================================================
// Substring match
// ============================================================================

/**
 * Substring match: `attr LIKE '%pattern%'`. Opts:
 *   - caseSensitive (default true): when false, compiles to
 *     `UPPER(attr) LIKE UPPER('%pattern%')` for dialect-agnostic
 *     case-insensitive matching.
 */
export function match(
  left: string | ScalarExpr,
  pattern: string,
  opts?: { caseSensitive?: boolean },
): MatchPredicate {
  return {
    kind: 'match',
    left: toScalar(left),
    pattern,
    caseSensitive: opts?.caseSensitive,
  };
}

// ============================================================================
// Boolean connectives
// ============================================================================

/** Conjunction: all operands must be true. Flattens nested ANDs. */
export function and(...operands: Predicate[]): AndPredicate {
  const flat: Predicate[] = [];
  for (const op of operands) {
    if (op.kind === 'and') {
      flat.push(...op.operands);
    } else {
      flat.push(op);
    }
  }
  return { kind: 'and', operands: flat };
}

/** Disjunction: at least one operand must be true. Flattens nested ORs. */
export function or(...operands: Predicate[]): OrPredicate {
  const flat: Predicate[] = [];
  for (const op of operands) {
    if (op.kind === 'or') {
      flat.push(...op.operands);
    } else {
      flat.push(op);
    }
  }
  return { kind: 'or', operands: flat };
}

/** Negation */
export function not(operand: Predicate): NotPredicate {
  return { kind: 'not', operand };
}

// ============================================================================
// Constants
// ============================================================================

export function tautology(): Tautology {
  return { kind: 'tautology' };
}

export function contradiction(): Contradiction {
  return { kind: 'contradiction' };
}

// ============================================================================
// Convenience: convert a plain object to a conjunction of equalities
// ============================================================================

/**
 * Convert { city: 'London', status: 20 } to
 * Pred.and(Pred.eq('city', 'London'), Pred.eq('status', 20))
 *
 * Returns tautology for empty objects.
 */
export function fromObject(obj: Record<string, unknown>): Predicate {
  const keys = Object.keys(obj);
  if (keys.length === 0) return tautology();
  if (keys.length === 1) return eq(keys[0], obj[keys[0]]);
  return and(...keys.map(k => eq(k, obj[k])));
}

// ============================================================================
// Grouped export as Pred namespace
// ============================================================================

export const Pred = {
  attr,
  literal,
  eq,
  neq,
  lt,
  lte,
  gt,
  gte,
  in: isIn,
  match,
  and,
  or,
  not,
  tautology,
  contradiction,
  fromObject,
} as const;
