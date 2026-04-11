/**
 * SqlBuilder — helper for constructing SQL AST nodes.
 *
 * Manages table qualifier generation (t1, t2, ...) and provides
 * convenience methods for building AST nodes.
 */
import type {
  SqlExpr,
  SelectExpr,
  SelectItem,
  ColumnRef,
  SqlLiteral,
  AggregateExpr,
  StarExpr,
  TableRef,
  SubqueryRef,
  FromClause,
  UnionExpr,
  ExceptExpr,
  IntersectExpr,
  OrderByTerm,
} from './ast';

export class SqlBuilder {
  private nextQualifier: number;

  constructor(start = 0) {
    this.nextQualifier = start;
  }

  /** Generate the next table qualifier (t1, t2, ...) */
  qualify(): string {
    this.nextQualifier++;
    return `t${this.nextQualifier}`;
  }

  /** Current (last generated) qualifier */
  lastQualifier(): string {
    return `t${this.nextQualifier}`;
  }

  // ===========================================================================
  // SELECT
  // ===========================================================================

  /** SELECT * FROM table */
  selectStarFrom(table: string): SelectExpr {
    const alias = this.qualify();
    return {
      kind: 'select',
      quantifier: 'all',
      selectList: [{ expr: { kind: 'star', qualifier: alias }, alias: '*' }],
      from: { tableSpec: { kind: 'table_ref', table, alias } },
    };
  }

  /** SELECT col1, col2, ... FROM table */
  selectFrom(attrs: string[], table: string): SelectExpr {
    const alias = this.qualify();
    return {
      kind: 'select',
      quantifier: 'all',
      selectList: attrs.map(a => this.selectItem(alias, a)),
      from: { tableSpec: { kind: 'table_ref', table, alias } },
    };
  }

  // ===========================================================================
  // Select items and scalar expressions
  // ===========================================================================

  /** A select item: qualifier.column AS column */
  selectItem(qualifier: string, column: string, alias?: string): SelectItem {
    return {
      expr: this.columnRef(qualifier, column),
      alias: alias ?? column,
    };
  }

  /** A qualified column reference */
  columnRef(qualifier: string, column: string): ColumnRef {
    return { kind: 'column_ref', qualifier, column };
  }

  /** A literal value */
  literal(value: unknown): SqlLiteral {
    return { kind: 'sql_literal', value };
  }

  /** An aggregate expression */
  aggregate(func: AggregateExpr['func'], expr?: ColumnRef): AggregateExpr {
    return { kind: 'aggregate', func, expr };
  }

  /** qualifier.* */
  star(qualifier: string): StarExpr {
    return { kind: 'star', qualifier };
  }

  // ===========================================================================
  // FROM clause helpers
  // ===========================================================================

  tableRef(table: string, alias?: string): TableRef {
    return { kind: 'table_ref', table, alias: alias ?? this.qualify() };
  }

  subqueryRef(subquery: SqlExpr, alias?: string): SubqueryRef {
    return { kind: 'subquery_ref', subquery, alias: alias ?? this.qualify() };
  }

  fromClause(tableSpec: FromClause['tableSpec']): FromClause {
    return { tableSpec };
  }

  // ===========================================================================
  // Set operations
  // ===========================================================================

  union(left: SqlExpr, right: SqlExpr, all = false): UnionExpr {
    return { kind: 'union', all, left, right };
  }

  except(left: SqlExpr, right: SqlExpr): ExceptExpr {
    return { kind: 'except', left, right };
  }

  intersect(left: SqlExpr, right: SqlExpr): IntersectExpr {
    return { kind: 'intersect', left, right };
  }

  // ===========================================================================
  // ORDER BY
  // ===========================================================================

  orderByTerm(qualifier: string, column: string, direction: 'asc' | 'desc' = 'asc'): OrderByTerm {
    return { expr: this.columnRef(qualifier, column), direction };
  }

  // ===========================================================================
  // Wrap in subquery (FROM SELF)
  // ===========================================================================

  /**
   * Wrap a SqlExpr in a subquery: SELECT t2.* FROM (expr) AS t2
   * Used when an operation needs to treat the current query as a subquery.
   */
  fromSelf(expr: SqlExpr): SelectExpr {
    const alias = this.qualify();
    const selectList = this.extractSelectList(expr, alias);
    return {
      kind: 'select',
      quantifier: 'all',
      selectList,
      from: { tableSpec: { kind: 'subquery_ref', subquery: expr, alias } },
    };
  }

  /** Extract the select list from an expression, re-qualifying to a new alias */
  private extractSelectList(expr: SqlExpr, newAlias: string): SelectItem[] {
    if (expr.kind === 'select') {
      return expr.selectList
        .filter(item => item.alias !== '*')
        .map(item => ({
          expr: { kind: 'column_ref' as const, qualifier: newAlias, column: item.alias },
          alias: item.alias,
        }));
    }
    // For set operations, we can't know the columns — use star
    return [{ expr: { kind: 'star', qualifier: newAlias }, alias: '*' }];
  }
}
