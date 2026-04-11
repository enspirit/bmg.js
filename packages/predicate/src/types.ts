/**
 * Predicate AST types.
 *
 * A predicate is a boolean expression over named attributes.
 * It can be evaluated against a JS object or compiled to SQL.
 */

// ============================================================================
// Scalar expressions (things that appear in comparisons)
// ============================================================================

/** Reference to a named attribute */
export interface AttrRef {
  kind: 'attr';
  name: string;
}

/** A literal value */
export interface Literal {
  kind: 'literal';
  value: unknown;
}

/** Scalar expression: either an attribute reference or a literal */
export type ScalarExpr = AttrRef | Literal;

// ============================================================================
// Comparison predicates
// ============================================================================

export interface EqPredicate {
  kind: 'eq';
  left: ScalarExpr;
  right: ScalarExpr;
}

export interface NeqPredicate {
  kind: 'neq';
  left: ScalarExpr;
  right: ScalarExpr;
}

export interface LtPredicate {
  kind: 'lt';
  left: ScalarExpr;
  right: ScalarExpr;
}

export interface LtePredicate {
  kind: 'lte';
  left: ScalarExpr;
  right: ScalarExpr;
}

export interface GtPredicate {
  kind: 'gt';
  left: ScalarExpr;
  right: ScalarExpr;
}

export interface GtePredicate {
  kind: 'gte';
  left: ScalarExpr;
  right: ScalarExpr;
}

/** All dyadic comparison predicates */
export type ComparisonPredicate =
  | EqPredicate
  | NeqPredicate
  | LtPredicate
  | LtePredicate
  | GtPredicate
  | GtePredicate;

// ============================================================================
// Set membership
// ============================================================================

export interface InPredicate {
  kind: 'in';
  left: ScalarExpr;
  values: unknown[];
}

// ============================================================================
// Boolean connectives
// ============================================================================

export interface AndPredicate {
  kind: 'and';
  operands: Predicate[];
}

export interface OrPredicate {
  kind: 'or';
  operands: Predicate[];
}

export interface NotPredicate {
  kind: 'not';
  operand: Predicate;
}

// ============================================================================
// Constants
// ============================================================================

export interface Tautology {
  kind: 'tautology';
}

export interface Contradiction {
  kind: 'contradiction';
}

// ============================================================================
// The union type
// ============================================================================

export type Predicate =
  | ComparisonPredicate
  | InPredicate
  | AndPredicate
  | OrPredicate
  | NotPredicate
  | Tautology
  | Contradiction;
