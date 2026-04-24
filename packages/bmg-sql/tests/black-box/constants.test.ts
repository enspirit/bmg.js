import { describe, it, expect } from 'vitest';
import { buildFixtures } from './helpers/fixtures';

describe('black-box: constants', () => {
  const { suppliers } = buildFixtures();

  it('constants.01 — Add two literal columns', () => {
    // bmg-rb inlines the literal values ('bar' AS 'foo', 2 AS 'baz');
    // bmg-sql parameterizes them (same precedent as all restrict/
    // extend literals). Semantically equivalent.
    const rel = suppliers.constants({ foo: 'bar', baz: 2 });
    const compiled = rel.toSql();
    expect(compiled.sql).toBe(
      'SELECT "t1"."sid", "t1"."name", "t1"."city", "t1"."status",' +
      ' ? AS "foo", ? AS "baz"' +
      ' FROM "suppliers" "t1"',
    );
    expect(compiled.params).toEqual(['bar', 2]);
  });
});
