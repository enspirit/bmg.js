import { describe, it, expect } from 'vitest';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: minus', () => {
  const { suppliers } = buildFixtures();

  it('minus.01 — Self-minus', () => {
    const rel = suppliers.minus(suppliers);
    expect(rel.toSql().sql).toBe(
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1")' +
      ' EXCEPT ' +
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1")',
    );
  });

  it('minus.02 — Chained minus', () => {
    const rel = suppliers.minus(suppliers).minus(suppliers);
    expect(rel.toSql().sql).toBe(
      '((SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1")' +
      ' EXCEPT ' +
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"))' +
      ' EXCEPT ' +
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1")',
    );
  });

  it('minus.03 — Minus followed by summarize (wrapped as derived table)', () => {
    const rel = suppliers.minus(suppliers).summarize(['sid'], { count: 'count' });
    expect(rel.toSql().sql).toBe(
      'SELECT "t2"."sid", COUNT(*) AS "count" FROM ' +
      '((SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1")' +
      ' EXCEPT ' +
      '(SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"))' +
      ' "t2"' +
      ' GROUP BY "t2"."sid"',
    );
  });
});
