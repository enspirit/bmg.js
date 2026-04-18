import { describe, it, expect } from 'vitest';
import { BmgSql } from '../../src';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: base', () => {
  const { adapter, suppliers } = buildFixtures();

  it('base.01 — Plain table relation', () => {
    expect(suppliers.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"',
    );
  });

  it('base.02 — Relation over a subquery/dataset source', () => {
    const rel = BmgSql.fromSubquery(
      adapter,
      'SELECT * FROM suppliers',
      ['sid', 'name', 'city', 'status'],
    );
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status"' +
      ' FROM (SELECT * FROM suppliers) "t1"',
    );
  });
});
