import { describe, it, expect } from 'vitest';
import { Bmg } from 'src';
import { toText } from 'src/async';

describe('toText', () => {

  describe('on a Relation', () => {
    const input = Bmg([
      { id: 1 },
      { id: 2 },
    ]);
    const expected =
      "+----+\n" +
      "| id |\n" +
      "+----+\n" +
      "|  1 |\n" +
      "|  2 |\n" +
      "+----+\n";

    it('outputs as expected', () => {
      expect(toText(input)).to.eql(expected);
    });
  });

  describe('on a Hash/tuple', () => {
    const input = { id: 1 };
    const expected =
      "+----+\n" +
      "| id |\n" +
      "+----+\n" +
      "|  1 |\n" +
      "+----+\n";

    it('outputs as expected', () => {
      expect(toText(input)).to.eql(expected);
    });
  });

  describe('its exposition on Relation', () => {
    const relation = Bmg([
      { id: '1', name: 'Bernard Lambeau' },
      { id: '2', name: 'Yoann;Guyot' },
    ]);
    const expected =
      "+----+-----------------+\n" +
      "| id | name            |\n" +
      "+----+-----------------+\n" +
      "| 1  | Bernard Lambeau |\n" +
      "| 2  | Yoann;Guyot     |\n" +
      "+----+-----------------+\n";

    it('works as expected', () => {
      expect(relation.toText()).to.eql(expected);
    });
  });

  describe('with multiple columns', () => {
    const relation = Bmg([
      { sid: 'S1', name: 'Smith', status: 20, city: 'London' },
      { sid: 'S2', name: 'Jones', status: 10, city: 'Paris' },
    ]);

    it('renders all columns', () => {
      const text = relation.toText();
      // Check that all column headers appear (with proper spacing)
      expect(text).to.contain('| sid ');
      expect(text).to.contain('| name ');
      expect(text).to.contain('| status ');
      expect(text).to.contain('| city ');
      // Check data values
      expect(text).to.contain('| S1 ');
      expect(text).to.contain('| Smith ');
    });
  });

  describe('with null values', () => {
    const relation = Bmg([
      { id: 1, value: null },
    ]);

    it('renders null as [null]', () => {
      expect(relation.toText()).to.contain('[null]');
    });
  });

  describe('with undefined values', () => {
    const relation = Bmg([
      { id: 1, value: undefined },
    ]);

    it('renders undefined as [undefined]', () => {
      expect(relation.toText()).to.contain('[undefined]');
    });
  });

  describe('with floating point numbers', () => {
    const relation = Bmg([
      { id: 1, value: 3.14159265 },
    ]);

    it('rounds to 3 decimal places by default', () => {
      expect(relation.toText()).to.contain('3.142');
    });

    it('respects floatPrecision option', () => {
      expect(relation.toText({ floatPrecision: 1 })).to.contain('3.1');
      expect(relation.toText({ floatPrecision: 5 })).to.contain('3.14159');
    });
  });

  describe('with nested relations', () => {
    it('renders nested relations as tables', () => {
      const inner = Bmg([{ x: 1 }, { x: 2 }]);
      const outer = Bmg([{ id: 1, items: inner }]);
      const text = outer.toText();
      // Should contain nested table structure
      expect(text).to.contain('| id |');
      expect(text).to.contain('| items');
      // Inner relation should be rendered
      expect(text).to.contain('| x |');
    });
  });

  describe('with arrays of primitives', () => {
    const relation = Bmg([
      { id: 1, tags: ['a', 'b', 'c'] },
    ]);

    it('renders arrays compactly', () => {
      const text = relation.toText();
      expect(text).to.contain('[a, b, c]');
    });
  });

  describe('with Date values', () => {
    const date = new Date('2024-01-15T12:30:00.000Z');
    const relation = Bmg([
      { id: 1, created: date },
    ]);

    it('renders dates as ISO strings', () => {
      expect(relation.toText()).to.contain('2024-01-15T12:30:00.000Z');
    });
  });

  describe('with objects', () => {
    const relation = Bmg([
      { id: 1, meta: { foo: 'bar' } },
    ]);

    it('renders objects as JSON', () => {
      expect(relation.toText()).to.contain('{"foo":"bar"}');
    });
  });

  describe('number alignment', () => {
    const relation = Bmg([
      { id: 1 },
      { id: 10 },
      { id: 100 },
    ]);

    it('right-aligns numbers', () => {
      const text = relation.toText();
      const lines = text.split('\n');
      // Find the data lines (after header separator)
      const dataLines = lines.filter(l => l.includes('|') && !l.includes('---') && !l.includes('id'));
      // Numbers should be right-aligned
      expect(dataLines[0]).to.contain('|   1 |');
      expect(dataLines[1]).to.contain('|  10 |');
      expect(dataLines[2]).to.contain('| 100 |');
    });
  });

  describe('string alignment', () => {
    const relation = Bmg([
      { name: 'A' },
      { name: 'BB' },
      { name: 'CCC' },
    ]);

    it('left-aligns strings', () => {
      const text = relation.toText();
      const lines = text.split('\n');
      const dataLines = lines.filter(l => l.includes('|') && !l.includes('---') && !l.includes('name'));
      // Column width is 4 (from header "name"), so values are padded to 4 chars
      // plus the " |" suffix adds one more space before the closing pipe
      expect(dataLines[0]).to.contain('| A    |');
      expect(dataLines[1]).to.contain('| BB   |');
      expect(dataLines[2]).to.contain('| CCC  |');
    });
  });

  describe('trimAt option', () => {
    const relation = Bmg([
      { id: 1, longColumn: 'This is a very long value that should be trimmed' },
    ]);

    it('trims lines to specified width', () => {
      const text = relation.toText({ trimAt: 20 });
      const lines = text.split('\n');
      for (const line of lines) {
        expect(line.length).to.be.lessThanOrEqual(21); // 20 + newline trimmed
      }
    });
  });

  describe('empty relation', () => {
    const relation = Bmg<{ id: number }>([]);

    it('renders just separators', () => {
      const text = relation.toText();
      // Empty relation has no attributes to display
      expect(text).to.contain('+');
    });
  });

  describe('DEE (one tuple, no attributes)', () => {
    const DEE = Bmg([{}]);
    const expected =
      "+--+\n" +
      "|  |\n" +
      "+--+\n" +
      "|  |\n" +
      "+--+\n";

    it('renders as empty table with one row', () => {
      expect(DEE.toText()).to.eql(expected);
    });
  });

  describe('DUM (no tuples, no attributes)', () => {
    const DUM = Bmg([]);
    const expected =
      "+--+\n" +
      "|  |\n" +
      "+--+\n" +
      "+--+\n";

    it('renders as empty table with no rows', () => {
      expect(DUM.toText()).to.eql(expected);
    });
  });

  describe('with group (nested relations)', () => {
    it('renders grouped relations as nested tables', () => {
      const suppliers = Bmg([
        { city: 'London', name: 'Smith' },
        { city: 'London', name: 'Clark' },
        { city: 'Paris', name: 'Jones' },
      ]);

      const grouped = suppliers.group(['name'], 'suppliers');
      const text = grouped.toText();

      // Should contain the outer table structure
      expect(text).to.contain('| city');
      expect(text).to.contain('| suppliers');
      // Should contain nested table with names
      expect(text).to.contain('| name');
      expect(text).to.contain('Smith');
      expect(text).to.contain('Jones');
    });
  });

  describe('with image (nested relations)', () => {
    it('renders image relations as nested tables', () => {
      const suppliers = Bmg([
        { sid: 'S1', city: 'London' },
        { sid: 'S2', city: 'Paris' },
      ]);

      const parts = Bmg([
        { pid: 'P1', city: 'London', color: 'red' },
        { pid: 'P2', city: 'London', color: 'blue' },
        { pid: 'P3', city: 'Paris', color: 'green' },
      ]);

      const withParts = suppliers.image(parts, 'parts', ['city']);
      const text = withParts.toText();

      // Should contain outer table
      expect(text).to.contain('| sid');
      expect(text).to.contain('| parts');
      // Should contain nested parts table
      expect(text).to.contain('| pid');
      expect(text).to.contain('| color');
    });
  });

});
