import { Relation, Tuple } from '../types';
import { isRelation } from '../operators/isRelation';

/**
 * Options for text rendering
 */
export interface TextOptions {
  /** Format string for floating point numbers (default: '%.3f' style) */
  floatPrecision?: number;
  /** Maximum width to trim output at */
  trimAt?: number;
}

// Type guards
const isTupleLike = (t: unknown): t is Tuple =>
  t !== null && typeof t === 'object' && !Array.isArray(t);

const isRelationLike = (r: unknown): r is Relation | Tuple[] =>
  isRelation(r) || (Array.isArray(r) && r.every(isTupleLike));

/**
 * Utility function to get max of two nullable numbers
 */
const max = (x: number | null, y: number | null): number => {
  if (x === null) return y ?? 0;
  if (y === null) return x;
  return x > y ? x : y;
};

/**
 * Represents a single cell in the table
 */
class Cell {
  private value: unknown;
  private renderer: TextWriter;
  private _textRendering: string | null = null;
  private _minWidth: number | null = null;

  constructor(renderer: TextWriter, value: unknown) {
    this.renderer = renderer;
    this.value = value;
  }

  get minWidth(): number {
    if (this._minWidth === null) {
      this._minWidth = this.renderingLines().reduce(
        (maxLen, line) => max(maxLen, line.length),
        0
      );
    }
    return this._minWidth;
  }

  renderingLines(size?: number): string[] {
    if (size === undefined) {
      return this.textRendering.split('\n');
    } else if (typeof this.value === 'number') {
      // Right-align numbers
      return this.renderingLines().map(l => l.padStart(size));
    } else {
      // Left-align other values
      return this.renderingLines().map(l => l.padEnd(size));
    }
  }

  get textRendering(): string {
    if (this._textRendering === null) {
      this._textRendering = this.computeTextRendering();
    }
    return this._textRendering;
  }

  private computeTextRendering(): string {
    const value = this.value;

    if (value === null) {
      return '[null]';
    }
    if (value === undefined) {
      return '[undefined]';
    }
    if (typeof value === 'symbol') {
      return value.toString();
    }
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return String(value);
      }
      const precision = this.renderer.options.floatPrecision ?? 3;
      return value.toFixed(precision);
    }
    if (isRelationLike(value)) {
      return this.renderer.render(value, '');
    }
    if (Array.isArray(value)) {
      return this.arrayRendering(value);
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private arrayRendering(value: unknown[]): string {
    if (value.length > 0 && isTupleLike(value[0])) {
      return this.renderer.render(value as Tuple[], '');
    }
    if (value.length === 0) {
      return '[]';
    }
    const values = value.map(x => {
      const cell = new Cell(this.renderer, x);
      return cell.textRendering;
    });
    const totalLength = values.reduce((sum, s) => sum + s.length, 0);
    if (totalLength < 20) {
      return '[' + values.join(', ') + ']';
    } else {
      return '[' + values.join(',\n ') + ']';
    }
  }
}

/**
 * Represents a row of cells in the table
 */
class Row {
  private cells: Cell[];

  constructor(renderer: TextWriter, values: unknown[]) {
    this.cells = values.map(v => new Cell(renderer, v));
  }

  minWidths(): number[] {
    return this.cells.map(cell => cell.minWidth);
  }

  renderingLines(sizes: number[]): string[] {
    let nbLines = 0;
    const byCell = this.cells.map((cell, i) => {
      const lines = cell.renderingLines(sizes[i]);
      nbLines = max(nbLines, lines.length);
      return lines;
    });

    const grid: string[] = [];
    for (let lineI = 0; lineI < nbLines; lineI++) {
      const lineContent = byCell
        .map((cellLines, i) => cellLines[lineI] ?? ' '.repeat(sizes[i]))
        .join(' | ');
      grid.push('| ' + lineContent + ' |');
    }

    return grid.length === 0 ? ['|  |'] : grid;
  }
}

/**
 * Represents the entire table structure
 */
class Table {
  private renderer: TextWriter;
  private header: Row;
  private rows: Row[];
  private _sizes: number[] | null = null;
  private _sep: string | null = null;

  constructor(renderer: TextWriter, records: unknown[][], attributes: string[]) {
    this.renderer = renderer;
    this.header = new Row(renderer, attributes);
    this.rows = records.map(r => new Row(renderer, r));
  }

  get sizes(): number[] {
    if (this._sizes === null) {
      const headerWidths = this.header.minWidths();
      this._sizes = this.rows.reduce((memo, row) => {
        const rowWidths = row.minWidths();
        return memo.map((w, i) => max(w, rowWidths[i] ?? 0));
      }, headerWidths);
    }
    return this._sizes;
  }

  get sep(): string {
    if (this._sep === null) {
      this._sep = '+-' + this.sizes.map(s => '-'.repeat(s)).join('-+-') + '-+';
    }
    return this._sep;
  }

  *eachLine(): Generator<string> {
    const trimAt = this.renderer.options.trimAt;

    if (trimAt !== undefined) {
      for (const line of this.eachLineRaw()) {
        yield line.substring(0, trimAt);
      }
    } else {
      yield* this.eachLineRaw();
    }
  }

  private *eachLineRaw(): Generator<string> {
    yield this.sep;
    yield this.header.renderingLines(this.sizes)[0];
    yield this.sep;
    for (const row of this.rows) {
      for (const line of row.renderingLines(this.sizes)) {
        yield line;
      }
    }
    yield this.sep;
  }

  *[Symbol.iterator](): Generator<string> {
    for (const line of this.eachLine()) {
      yield line.trimEnd() + '\n';
    }
  }

  toString(): string {
    let result = '';
    for (const line of this) {
      result += line;
    }
    return result;
  }
}

/**
 * Text writer for rendering relations as ASCII tables
 */
export class TextWriter {
  readonly options: TextOptions;

  constructor(options: TextOptions = {}) {
    this.options = options;
  }

  /**
   * Renders a relation or tuple array to an ASCII table string
   */
  render(input: Relation | Tuple[] | Tuple, output: string = ''): string {
    for (const line of this.eachLine(input)) {
      output += line;
    }
    return output;
  }

  *eachLine(input: Relation | Tuple[] | Tuple): Generator<string> {
    // Handle single tuple
    let tuples: Tuple[];
    if (isTupleLike(input) && !isRelation(input)) {
      tuples = [input];
    } else if (isRelation(input)) {
      tuples = input.toArray();
    } else {
      tuples = input;
    }

    // Collect all attribute names across all tuples
    const attrs = tuples.reduce((memo: string[], tuple) => {
      for (const key of Object.keys(tuple)) {
        if (!memo.includes(key)) {
          memo.push(key);
        }
      }
      return memo;
    }, []);

    // Build records array (values in attribute order)
    const records = tuples.map(t => attrs.map(a => t[a]));

    const table = new Table(this, records, attrs);
    yield* table;
  }
}

/**
 * Renders a relation as an ASCII table string
 *
 * @param operand - The relation or tuple array to render
 * @param options - Text rendering options
 * @returns ASCII table string representation
 *
 * @example
 * const r = Bmg([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
 * console.log(toText(r));
 * // +----+-------+
 * // | id | name  |
 * // +----+-------+
 * // |  1 | Alice |
 * // |  2 | Bob   |
 * // +----+-------+
 */
export const toText = (
  operand: Relation | Tuple[] | Tuple,
  options: TextOptions = {}
): string => {
  return new TextWriter(options).render(operand);
};
