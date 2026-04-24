/**
 * SQL AST processors.
 *
 * Each processor is a pure function that transforms a SqlExpr into a new SqlExpr.
 * They mirror the Ruby bmg SQL processors (Processor::Where, Processor::Clip, etc.)
 *
 * Key pattern: when an operation can't be applied directly to the current AST
 * (e.g., WHERE on a GROUP BY, or project on a UNION), wrap in a subquery first
 * via builder.fromSelf().
 */
import type {
  SqlExpr,
  SelectExpr,
  SelectItem,
  ColumnRef,
  AggregateExpr,
  TableSpec,
  FromClause,
} from './ast';
import type { Predicate } from '@enspirit/predicate';
import { and as predAnd, eq as predEq, not as predNot, attr as predAttr } from '@enspirit/predicate';
import { SqlBuilder } from './builder';
import type { RelationType } from './reltype';

// ============================================================================
// Helpers
// ============================================================================

/** Check if expression needs wrapping before further manipulation */
function needsSubquery(expr: SqlExpr): boolean {
  return expr.kind !== 'select';
}

/** Check if a SELECT has features that prevent direct modification */
function isComplex(expr: SelectExpr): boolean {
  return !!(expr.groupBy && expr.groupBy.length > 0) ||
    !!(expr.limit !== undefined) ||
    !!(expr.offset !== undefined && expr.offset !== 0) ||
    hasComputedAttributes(expr);
}

function hasComputedAttributes(expr: SelectExpr): boolean {
  return expr.selectList.some(item =>
    item.expr.kind === 'aggregate' ||
    item.expr.kind === 'func_call' ||
    item.expr.kind === 'sql_literal'
  );
}

/** Ensure we have a simple SELECT we can modify. Wraps set ops/complex queries. */
function ensureSelect(expr: SqlExpr, builder: SqlBuilder): SelectExpr {
  if (needsSubquery(expr)) return builder.fromSelf(expr);
  return expr as SelectExpr;
}

/** Get the primary table alias from a FROM clause */
function getPrimaryAlias(from?: FromClause): string | undefined {
  if (!from) return undefined;
  return getAlias(from.tableSpec);
}

function getAlias(spec: TableSpec): string | undefined {
  switch (spec.kind) {
    case 'table_ref':
    case 'subquery_ref':
    case 'raw_subquery_ref':
      return spec.alias;
    case 'inner_join':
    case 'left_join':
    case 'cross_join':
      return getAlias(spec.left);
  }
}

// ============================================================================
// processWhere — restriction (WHERE clause)
// ============================================================================

/**
 * Add a WHERE predicate to a SQL expression.
 * If the expression already has a WHERE, merges with AND.
 * If the expression has GROUP BY or computed attributes, wraps in subquery first.
 */
export function processWhere(
  expr: SqlExpr,
  predicate: Predicate,
  builder: SqlBuilder
): SqlExpr {
  let select = ensureSelect(expr, builder);

  // If complex (GROUP BY, LIMIT, computed), wrap first
  if (isComplex(select)) {
    select = builder.fromSelf(select);
  }

  // Merge with existing WHERE
  const merged = select.where
    ? predAnd(select.where, predicate)
    : predicate;

  return { ...select, where: merged };
}

// ============================================================================
// processProject — projection (keep only specified columns)
// ============================================================================

/**
 * Project: keep only the specified columns in the select list.
 * Adds DISTINCT unless a key is preserved (when relType is provided).
 */
export function processProject(
  expr: SqlExpr,
  attrs: string[],
  builder: SqlBuilder,
  relType?: RelationType
): SqlExpr {
  let select = ensureSelect(expr, builder);

  const attrSet = new Set(attrs);
  const filtered = select.selectList.filter(item => attrSet.has(item.alias));

  const needsDistinct = !(relType && relType.hasPreservedKey(attrs));

  return {
    ...select,
    quantifier: needsDistinct ? 'distinct' : select.quantifier,
    selectList: filtered,
  };
}

/**
 * Allbut: remove the specified columns from the select list.
 * Adds DISTINCT unless a key is preserved (when relType is provided).
 */
export function processAllbut(
  expr: SqlExpr,
  attrs: string[],
  builder: SqlBuilder,
  relType?: RelationType
): SqlExpr {
  let select = ensureSelect(expr, builder);

  const attrSet = new Set(attrs);
  const filtered = select.selectList.filter(item => !attrSet.has(item.alias));
  const remainingAttrs = filtered.map(item => item.alias);

  const needsDistinct = !(relType && relType.hasPreservedKey(remainingAttrs));

  return {
    ...select,
    quantifier: needsDistinct ? 'distinct' : select.quantifier,
    selectList: filtered,
  };
}

// ============================================================================
// processRename — column aliasing
// ============================================================================

/**
 * Rename columns in the select list.
 * @param renaming - Map from old name to new name.
 */
export function processRename(
  expr: SqlExpr,
  renaming: Record<string, string>,
  builder: SqlBuilder
): SqlExpr {
  const select = ensureSelect(expr, builder);

  const renamed = select.selectList.map(item => {
    const newName = renaming[item.alias];
    if (newName) {
      return { ...item, alias: newName };
    }
    return item;
  });

  return { ...select, selectList: renamed };
}

// ============================================================================
// processExtend — add computed columns
// ============================================================================

/**
 * Extend: add new columns that are copies of existing columns.
 * Only supports attribute references (symbol-only, like Ruby).
 * @param extension - Map from new column name to source column name.
 */
export function processExtend(
  expr: SqlExpr,
  extension: Record<string, string>,
  builder: SqlBuilder
): SqlExpr {
  let select = ensureSelect(expr, builder);
  if (needsSubquery(expr)) {
    select = builder.fromSelf(expr);
  }

  const alias = getPrimaryAlias(select.from);
  if (!alias) return select;

  const newItems: SelectItem[] = Object.entries(extension).map(([newName, sourceCol]) => ({
    expr: { kind: 'column_ref' as const, qualifier: alias, column: sourceCol },
    alias: newName,
  }));

  return {
    ...select,
    selectList: [...select.selectList, ...newItems],
  };
}

// ============================================================================
// processConstants — add literal constant columns
// ============================================================================

/**
 * Constants: add literal value columns to every row.
 * @param constants - Map from column name to literal value.
 */
export function processConstants(
  expr: SqlExpr,
  constants: Record<string, unknown>,
  builder: SqlBuilder
): SqlExpr {
  let select = ensureSelect(expr, builder);
  if (needsSubquery(expr)) {
    select = builder.fromSelf(expr);
  }

  const newItems: SelectItem[] = Object.entries(constants).map(([name, value]) => ({
    expr: { kind: 'sql_literal' as const, value },
    alias: name,
  }));

  return {
    ...select,
    selectList: [...select.selectList, ...newItems],
  };
}

// ============================================================================
// processRequalify — regenerate table qualifiers
// ============================================================================

/**
 * Regenerate all table qualifiers in a SQL expression to avoid conflicts
 * when merging two expressions (e.g., for JOIN or set operations).
 */
export function processRequalify(
  expr: SqlExpr,
  builder: SqlBuilder
): SqlExpr {
  if (expr.kind !== 'select') {
    // For set operations, requalify each branch
    if (expr.kind === 'union') {
      return { ...expr, left: processRequalify(expr.left, builder), right: processRequalify(expr.right, builder) };
    }
    if (expr.kind === 'except') {
      return { ...expr, left: processRequalify(expr.left, builder), right: processRequalify(expr.right, builder) };
    }
    if (expr.kind === 'intersect') {
      return { ...expr, left: processRequalify(expr.left, builder), right: processRequalify(expr.right, builder) };
    }
    return expr;
  }

  // Build old→new qualifier map
  const qualMap = new Map<string, string>();
  function remap(old: string): string {
    if (!qualMap.has(old)) {
      qualMap.set(old, builder.qualify());
    }
    return qualMap.get(old)!;
  }

  // Requalify select list
  const selectList = expr.selectList.map(item => ({
    ...item,
    expr: requalifyScalar(item.expr, remap),
  }));

  // Requalify FROM
  const from = expr.from
    ? { tableSpec: requalifyTableSpec(expr.from.tableSpec, remap) }
    : undefined;

  // Requalify GROUP BY
  const groupBy = expr.groupBy?.map(c => requalifyColumnRef(c, remap));

  // Requalify ORDER BY
  const orderBy = expr.orderBy?.map(t => ({
    ...t,
    expr: requalifyColumnRef(t.expr, remap),
  }));

  // WHERE predicates reference attribute names, not qualifiers,
  // so they don't need requalification at this level

  return { ...expr, selectList, from, groupBy, orderBy };
}

function requalifyScalar(expr: SelectItem['expr'], remap: (old: string) => string): SelectItem['expr'] {
  switch (expr.kind) {
    case 'column_ref':
      return { ...expr, qualifier: remap(expr.qualifier) };
    case 'star':
      return { ...expr, qualifier: remap(expr.qualifier) };
    case 'aggregate':
      return expr.expr
        ? { ...expr, expr: requalifyScalar(expr.expr, remap) as ColumnRef }
        : expr;
    case 'func_call':
      return { ...expr, args: expr.args.map(a => requalifyScalar(a, remap)) };
    case 'sql_literal':
      return expr;
  }
}

function requalifyColumnRef(ref: ColumnRef, remap: (old: string) => string): ColumnRef {
  return { ...ref, qualifier: remap(ref.qualifier) };
}

function requalifyTableSpec(spec: TableSpec, remap: (old: string) => string): TableSpec {
  switch (spec.kind) {
    case 'table_ref':
      return { ...spec, alias: remap(spec.alias) };
    case 'subquery_ref':
      return { ...spec, alias: remap(spec.alias) };
    case 'raw_subquery_ref':
      return { ...spec, alias: remap(spec.alias) };
    case 'inner_join':
      return {
        ...spec,
        left: requalifyTableSpec(spec.left, remap),
        right: requalifyTableSpec(spec.right, remap),
        on: requalifyPredicate(spec.on, remap),
      };
    case 'left_join':
      return {
        ...spec,
        left: requalifyTableSpec(spec.left, remap),
        right: requalifyTableSpec(spec.right, remap),
        on: requalifyPredicate(spec.on, remap),
      };
    case 'cross_join':
      return {
        ...spec,
        left: requalifyTableSpec(spec.left, remap),
        right: requalifyTableSpec(spec.right, remap),
      };
  }
}

/**
 * Rewrite qualifier prefixes in a predicate's AttrRef nodes.
 *
 * AttrRef names are stored as strings; `"t1.col"` denotes a qualified
 * column. This helper splits on the first dot, remaps the qualifier,
 * and leaves unqualified names alone.
 */
function requalifyPredicate(pred: Predicate, remap: (old: string) => string): Predicate {
  switch (pred.kind) {
    case 'eq':
    case 'neq':
    case 'lt':
    case 'lte':
    case 'gt':
    case 'gte':
      return {
        ...pred,
        left: requalifyPredicateScalar(pred.left, remap),
        right: requalifyPredicateScalar(pred.right, remap),
      };
    case 'in':
      return { ...pred, left: requalifyPredicateScalar(pred.left, remap) };
    case 'and':
      return { ...pred, operands: pred.operands.map(p => requalifyPredicate(p, remap)) };
    case 'or':
      return { ...pred, operands: pred.operands.map(p => requalifyPredicate(p, remap)) };
    case 'not':
      return { ...pred, operand: requalifyPredicate(pred.operand, remap) };
    case 'tautology':
    case 'contradiction':
      return pred;
  }
}

function requalifyPredicateScalar(
  s: { kind: 'attr'; name: string } | { kind: 'literal'; value: unknown },
  remap: (old: string) => string
): typeof s {
  if (s.kind !== 'attr') return s;
  const dot = s.name.indexOf('.');
  if (dot < 0) return s;
  const qual = s.name.slice(0, dot);
  const rest = s.name.slice(dot + 1);
  return { ...s, name: `${remap(qual)}.${rest}` };
}

// ============================================================================
// processJoin — INNER JOIN / LEFT JOIN
// ============================================================================

/** Join keys: array (shared names) or object ({leftKey: rightKey}). */
export type JoinKeys = string[] | Record<string, string>;

/**
 * Build an equi-join predicate `l.col = r.col AND ...`, resolving each
 * key to its *underlying* qualified column via the select list. This
 * matters because:
 *   - Multi-way joins contribute attrs from nested tables.
 *   - After `rename`/`prefix`, a key name in the relation's interface
 *     maps to a different physical column — and SQL column aliases
 *     aren't visible in ON, so the predicate must reference the
 *     physical column.
 */
function buildJoinOn(left: SelectExpr, right: SelectExpr, keys: JoinKeys): Predicate {
  const entries: [string, string][] = Array.isArray(keys)
    ? keys.map(k => [k, k])
    : Object.entries(keys);
  const leftPrimary = getPrimaryAlias(left.from);
  const rightPrimary = getPrimaryAlias(right.from);
  const preds = entries.map(([lk, rk]) => {
    const [lq, lc] = resolveKey(left, lk, leftPrimary);
    const [rq, rc] = resolveKey(right, rk, rightPrimary);
    return predEq(predAttr(`${lq}.${lc}`), predAttr(`${rq}.${rc}`));
  });
  if (preds.length === 0) {
    // Degenerate: no equi-predicates. Use tautology (callers normally
    // filter this out / use cross_join instead).
    return { kind: 'tautology' } as Predicate;
  }
  return preds.length === 1 ? preds[0] : predAnd(...preds);
}

/**
 * Resolve a relation-attribute name to the underlying qualified SQL
 * column (qualifier, column). If the select list has a column_ref
 * aliased to `attr`, use its physical qualifier+column; otherwise
 * fall back to `(fallback, attr)`.
 */
function resolveKey(
  sel: SelectExpr,
  attr: string,
  fallback: string | undefined
): [string, string] {
  const item = sel.selectList.find(i => i.alias === attr);
  if (item && item.expr.kind === 'column_ref') {
    return [item.expr.qualifier, item.expr.column];
  }
  if (!fallback) throw new Error(`Cannot resolve qualifier for attribute ${attr}`);
  return [fallback, attr];
}

/**
 * Join two SQL expressions.
 * Merges select lists, FROM clauses, and WHERE clauses.
 *
 * `keys` is the list/map of equi-join attributes; the ON predicate is
 * built *after* requalification, using the final left/right aliases, so
 * callers don't have to know (or guess) those aliases.
 */
export function processJoin(
  left: SqlExpr,
  right: SqlExpr,
  keys: JoinKeys,
  joinKind: 'inner_join' | 'left_join',
  builder: SqlBuilder
): SqlExpr {
  // Ensure both are simple selects
  let leftSel = ensureSelect(left, builder);
  if (isComplex(leftSel)) leftSel = builder.fromSelf(leftSel);

  let rightSel = ensureSelect(right, builder);
  if (isComplex(rightSel)) rightSel = builder.fromSelf(rightSel);

  // Requalify right to avoid alias conflicts
  rightSel = processRequalify(rightSel, builder) as SelectExpr;

  // Merge select lists: keep all left columns, add right columns not in left
  const leftAliases = new Set(leftSel.selectList.map(i => i.alias));
  const rightNewItems = rightSel.selectList.filter(i => !leftAliases.has(i.alias));
  const mergedSelectList = [...leftSel.selectList, ...rightNewItems];

  // Build joined FROM clause
  if (!leftSel.from || !rightSel.from) {
    throw new Error('Cannot join expressions without FROM clauses');
  }

  // Build ON predicate now that both sides have stable aliases.
  // Look up each key's qualifier in the respective select list so that
  // multi-way joins (where the key may belong to a nested table) emit
  // correct references.
  const on = buildJoinOn(leftSel, rightSel, keys);

  const joinSpec: TableSpec = {
    kind: joinKind,
    left: leftSel.from.tableSpec,
    right: rightSel.from.tableSpec,
    on,
  };

  // Merge WHERE clauses
  let where: Predicate | undefined;
  if (leftSel.where && rightSel.where) {
    where = predAnd(leftSel.where, rightSel.where);
  } else {
    where = leftSel.where ?? rightSel.where;
  }

  return {
    kind: 'select',
    quantifier: leftSel.quantifier === 'distinct' || rightSel.quantifier === 'distinct'
      ? 'distinct' : 'all',
    selectList: mergedSelectList,
    from: { tableSpec: joinSpec },
    where,
  };
}

// ============================================================================
// applyLeftJoinDefaults — wrap right-side attrs in COALESCE(col, default)
// ============================================================================

/**
 * Replace each defaulted attribute's select-list item with
 * `COALESCE(expr, literal) AS alias`. If `attr` isn't already in the
 * select list, append it as `COALESCE(fallback.attr, literal) AS attr`
 * so an entirely-absent right-side attr still shows up (matches bmg-rb's
 * semantics when defaults provide attrs the right side doesn't have).
 */
export function applyLeftJoinDefaults(
  expr: SqlExpr,
  defaults: Record<string, unknown>
): SqlExpr {
  if (expr.kind !== 'select') return expr;
  const select = expr;
  const items = select.selectList.map(item => {
    if (!(item.alias in defaults)) return item;
    return {
      ...item,
      expr: buildCoalesce(item.expr as any, defaults[item.alias]),
    };
  });
  // If any default attr isn't in the select list, there's nothing we
  // can wrap (no underlying column to COALESCE). Callers typically
  // restrict defaults to right-side attrs, which will always be in
  // the select list after processJoin, so we don't synthesize.
  return { ...select, selectList: items };
}

function buildCoalesce(inner: any, value: unknown): any {
  return {
    kind: 'func_call' as const,
    func: 'coalesce',
    args: [inner, { kind: 'sql_literal' as const, value }],
  };
}

// ============================================================================
// processCrossJoin — CROSS JOIN
// ============================================================================

/**
 * Cross product of two SQL expressions. Merges select lists and FROMs
 * like `processJoin`, but emits a CrossJoin spec (no ON clause).
 */
export function processCrossJoin(
  left: SqlExpr,
  right: SqlExpr,
  builder: SqlBuilder
): SqlExpr {
  let leftSel = ensureSelect(left, builder);
  if (isComplex(leftSel)) leftSel = builder.fromSelf(leftSel);

  let rightSel = ensureSelect(right, builder);
  if (isComplex(rightSel)) rightSel = builder.fromSelf(rightSel);

  // Requalify right to avoid alias conflicts
  rightSel = processRequalify(rightSel, builder) as SelectExpr;

  // Merge select lists: left columns + right columns not already in left
  const leftAliases = new Set(leftSel.selectList.map(i => i.alias));
  const rightNewItems = rightSel.selectList.filter(i => !leftAliases.has(i.alias));
  const mergedSelectList = [...leftSel.selectList, ...rightNewItems];

  if (!leftSel.from || !rightSel.from) {
    throw new Error('Cannot cross-join expressions without FROM clauses');
  }

  const joinSpec: TableSpec = {
    kind: 'cross_join',
    left: leftSel.from.tableSpec,
    right: rightSel.from.tableSpec,
  };

  let where: Predicate | undefined;
  if (leftSel.where && rightSel.where) {
    where = predAnd(leftSel.where, rightSel.where);
  } else {
    where = leftSel.where ?? rightSel.where;
  }

  return {
    kind: 'select',
    quantifier: leftSel.quantifier === 'distinct' || rightSel.quantifier === 'distinct'
      ? 'distinct' : 'all',
    selectList: mergedSelectList,
    from: { tableSpec: joinSpec },
    where,
  };
}

// ============================================================================
// processMerge — UNION / EXCEPT / INTERSECT
// ============================================================================

/**
 * Merge two SQL expressions with a set operation.
 */
export function processMerge(
  left: SqlExpr,
  right: SqlExpr,
  op: 'union' | 'except' | 'intersect',
  all: boolean,
  _builder: SqlBuilder
): SqlExpr {
  switch (op) {
    case 'union':
      return { kind: 'union', all, left, right };
    case 'except':
      return { kind: 'except', left, right };
    case 'intersect':
      return { kind: 'intersect', left, right };
  }
}

// ============================================================================
// processSummarize — GROUP BY + aggregates
// ============================================================================

type SummarizeFn = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct_count';

/**
 * Summarize: GROUP BY + aggregates.
 * @param by - Attributes to group by.
 * @param aggs - Map from result name to { func, attr } or func name.
 */
export function processSummarize(
  expr: SqlExpr,
  by: string[],
  aggs: Record<string, { func: SummarizeFn; attr?: string } | SummarizeFn>,
  builder: SqlBuilder
): SqlExpr {
  let select = ensureSelect(expr, builder);

  // If already has GROUP BY, wrap first
  if (select.groupBy && select.groupBy.length > 0) {
    select = builder.fromSelf(select);
  }

  const alias = getPrimaryAlias(select.from);
  if (!alias) return select;

  // Build new select list: group-by columns + aggregate columns
  const byItems: SelectItem[] = by.map(attr => {
    const existing = select.selectList.find(i => i.alias === attr);
    if (existing) return existing;
    return { expr: builder.columnRef(alias, attr), alias: attr };
  });

  const aggItems: SelectItem[] = Object.entries(aggs).map(([name, spec]) => {
    const funcName = typeof spec === 'string' ? spec : spec.func;
    const attrName = typeof spec === 'string' ? undefined : spec.attr;

    const aggExpr: AggregateExpr = {
      kind: 'aggregate',
      func: funcName,
      expr: attrName ? findColumnRef(select, alias, attrName) : undefined,
    };
    return { expr: aggExpr, alias: name };
  });

  // Build GROUP BY column refs
  const groupBy: ColumnRef[] = by.map(attr => {
    const existing = select.selectList.find(i => i.alias === attr);
    if (existing && existing.expr.kind === 'column_ref') return existing.expr;
    return builder.columnRef(alias, attr);
  });

  return {
    ...select,
    selectList: [...byItems, ...aggItems],
    groupBy: groupBy.length > 0 ? groupBy : undefined,
  };
}

/** Find the column ref for an attribute in the current select list */
function findColumnRef(select: SelectExpr, defaultAlias: string, attr: string): ColumnRef {
  const existing = select.selectList.find(i => i.alias === attr);
  if (existing && existing.expr.kind === 'column_ref') return existing.expr;
  return { kind: 'column_ref', qualifier: defaultAlias, column: attr };
}

// ============================================================================
// processSemiJoin — matching / not_matching via EXISTS
// ============================================================================

/**
 * Semi-join: matching (EXISTS) or not_matching (NOT EXISTS).
 * Generates: WHERE [NOT] EXISTS (SELECT 1 FROM right WHERE left.key = right.key)
 */
export function processSemiJoin(
  left: SqlExpr,
  right: SqlExpr,
  on: string[],
  negate: boolean,
  builder: SqlBuilder
): SqlExpr {
  let leftSel = ensureSelect(left, builder);
  let rightSel = ensureSelect(right, builder);

  // Requalify right to avoid alias conflicts
  rightSel = processRequalify(rightSel, builder) as SelectExpr;

  const leftAlias = getPrimaryAlias(leftSel.from);
  const rightAlias = getPrimaryAlias(rightSel.from);
  if (!leftAlias || !rightAlias || !rightSel.from) return leftSel;

  // Build the correlated subquery predicate: left.key = right.key
  const joinPreds = on.map(key =>
    predEq(predAttr(`${leftAlias}.${key}`), predAttr(`${rightAlias}.${key}`))
  );
  const joinPred = joinPreds.length === 1 ? joinPreds[0] : predAnd(...joinPreds);

  // Merge with right's existing WHERE
  const subqueryWhere = rightSel.where
    ? predAnd(rightSel.where, joinPred)
    : joinPred;

  // Build: SELECT 1 FROM right WHERE join_pred
  const subquery: SelectExpr = {
    kind: 'select',
    quantifier: 'all',
    selectList: [{ expr: { kind: 'sql_literal', value: 1 }, alias: '_exists' }],
    from: rightSel.from,
    where: subqueryWhere,
  };

  // Build EXISTS/NOT EXISTS predicate
  // We represent this as a special predicate that the compiler handles
  // For now, we use a raw approach: add the EXISTS as part of the WHERE
  const existsPred: Predicate = {
    kind: 'exists' as any,
    subquery,
  } as any;

  const finalPred = negate
    ? predNot(existsPred)
    : existsPred;

  // Add to left's WHERE
  const where = leftSel.where
    ? predAnd(leftSel.where, finalPred)
    : finalPred;

  return { ...leftSel, where };
}

// ============================================================================
// processOrderBy — ORDER BY
// ============================================================================

/**
 * Add ORDER BY to a SQL expression.
 *
 * If the current SELECT is complex (GROUP BY, LIMIT, or computed
 * columns like aggregates), wraps it in a subquery first so the
 * ORDER BY can reference aggregate results by their alias as plain
 * columns of the outer relation. Mirrors processWhere's behavior.
 */
export function processOrderBy(
  expr: SqlExpr,
  ordering: Array<{ attr: string; direction: 'asc' | 'desc' }>,
  builder: SqlBuilder
): SqlExpr {
  let select = ensureSelect(expr, builder);

  if (isComplex(select)) {
    select = builder.fromSelf(select);
  }

  const alias = getPrimaryAlias(select.from);
  if (!alias) return select;

  const orderBy = ordering.map(({ attr, direction }) => ({
    expr: findColumnRef(select, alias, attr),
    direction,
  }));

  return { ...select, orderBy };
}

// ============================================================================
// processLimitOffset — LIMIT / OFFSET
// ============================================================================

/**
 * Add LIMIT and/or OFFSET to a SQL expression.
 */
export function processLimitOffset(
  expr: SqlExpr,
  limit?: number,
  offset?: number,
  builder?: SqlBuilder
): SqlExpr {
  let select = builder ? ensureSelect(expr, builder) : expr as SelectExpr;

  return {
    ...select,
    limit: limit ?? select.limit,
    offset: offset ?? select.offset,
  };
}
