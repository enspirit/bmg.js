import { describe, it, expect } from 'vitest';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: transform', () => {
  const { supplies } = buildFixtures();

  it('transform.01 — CAST a single attribute to String (varchar)', () => {
    const rel = supplies.transform({ qty: 'string' });
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."pid",' +
      ' CAST("t1"."qty" AS varchar(255)) AS "qty"' +
      ' FROM "supplies" "t1"',
    );
  });

  it('transform.02 — Transform-all-columns form (single token applied to every attr)', () => {
    const rel = supplies.transform('string');
    expect(rel.toSql().sql).toBe(
      'SELECT' +
      ' CAST("t1"."sid" AS varchar(255)) AS "sid",' +
      ' CAST("t1"."pid" AS varchar(255)) AS "pid",' +
      ' CAST("t1"."qty" AS varchar(255)) AS "qty"' +
      ' FROM "supplies" "t1"',
    );
  });

  it('transform.03 — Composed transform [string, integer] (nested CAST)', () => {
    const rel = supplies.transform({ qty: ['string', 'integer'] });
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."pid",' +
      ' CAST(CAST("t1"."qty" AS varchar(255)) AS integer) AS "qty"' +
      ' FROM "supplies" "t1"',
    );
  });

  it('transform.04 — Composed transform [string, date] (date() around CAST)', () => {
    const rel = supplies.transform({ qty: ['string', 'date'] });
    expect(rel.toSql().sql).toBe(
      'SELECT "t1"."sid", "t1"."pid",' +
      ' date(CAST("t1"."qty" AS varchar(255))) AS "qty"' +
      ' FROM "supplies" "t1"',
    );
  });
});
