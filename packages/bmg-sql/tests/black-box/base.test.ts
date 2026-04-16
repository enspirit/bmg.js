import { describe, it, expect } from 'vitest';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: base', () => {
  const { suppliers } = buildFixtures();

  it('base.01 — Plain table relation', () => {
    expect(suppliers.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"',
    );
  });

  // base.02 — Relation over a subquery/dataset source
  // Blocked: requires a raw-SQL subquery relation factory in bmg-sql.
  it.todo('base.02 — Relation over an underlying dataset/subquery (blocked)');
});
