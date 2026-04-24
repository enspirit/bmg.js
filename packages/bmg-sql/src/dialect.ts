/**
 * SQL dialect abstraction.
 *
 * Different databases have different quoting styles and syntax.
 */

export interface SqlDialect {
  /** Quote an identifier (table/column name) */
  quoteIdentifier(name: string): string;
  /** Parameter placeholder for the nth parameter (1-based) */
  paramPlaceholder(index: number): string;
}

export const PostgresDialect: SqlDialect = {
  quoteIdentifier: (name) => `"${name.replace(/"/g, '""')}"`,
  paramPlaceholder: (index) => `$${index}`,
};

export const SqliteDialect: SqlDialect = {
  quoteIdentifier: (name) => `"${name.replace(/"/g, '""')}"`,
  paramPlaceholder: (_index) => '?',
};
