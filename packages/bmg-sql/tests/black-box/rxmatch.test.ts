import { describe, it, expect } from 'vitest';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: rxmatch', () => {
  const { suppliers } = buildFixtures();

  it('rxmatch.01 — Match substring across multiple columns (case-sensitive)', () => {
    const rel = suppliers.rxmatch(['city', 'name'], 'S');
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ` WHERE "t1"."city" LIKE ? ESCAPE '\\' OR "t1"."name" LIKE ? ESCAPE '\\'`,
    );
    expect(compiled.params).toEqual(['%S%', '%S%']);
  });

  it('rxmatch.02 — Case-insensitive match via caseSensitive: false', () => {
    const rel = suppliers.rxmatch(['city', 'name'], 'S', { caseSensitive: false });
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status" FROM "suppliers" "t1"' +
      ` WHERE UPPER("t1"."city") LIKE UPPER(?) ESCAPE '\\' OR UPPER("t1"."name") LIKE UPPER(?) ESCAPE '\\'`,
    );
    expect(compiled.params).toEqual(['%S%', '%S%']);
  });
});
