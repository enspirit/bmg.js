import { Relation, Tuple } from '../types';
import { isRelation } from '../sync/operators/isRelation';

/**
 * Characters used for table borders
 */
export interface BorderChars {
  topLeft: string;
  topCenter: string;
  topRight: string;
  midLeft: string;
  midCenter: string;
  midRight: string;
  bottomLeft: string;
  bottomCenter: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
}

/** ASCII border style (default) - maximum compatibility */
export const ASCII_BORDER: BorderChars = {
  topLeft: '+',
  topCenter: '+',
  topRight: '+',
  midLeft: '+',
  midCenter: '+',
  midRight: '+',
  bottomLeft: '+',
  bottomCenter: '+',
  bottomRight: '+',
  horizontal: '-',
  vertical: '|',
};

/** Unicode single-line border style */
export const SINGLE_BORDER: BorderChars = {
  topLeft: '┌',
  topCenter: '┬',
  topRight: '┐',
  midLeft: '├',
  midCenter: '┼',
  midRight: '┤',
  bottomLeft: '└',
  bottomCenter: '┴',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
};

/** Unicode double-line border style */
export const DOUBLE_BORDER: BorderChars = {
  topLeft: '╔',
  topCenter: '╦',
  topRight: '╗',
  midLeft: '╠',
  midCenter: '╬',
  midRight: '╣',
  bottomLeft: '╚',
  bottomCenter: '╩',
  bottomRight: '╝',
  horizontal: '═',
  vertical: '║',
};

/** Unicode rounded corners border style */
export const ROUNDED_BORDER: BorderChars = {
  topLeft: '╭',
  topCenter: '┬',
  topRight: '╮',
  midLeft: '├',
  midCenter: '┼',
  midRight: '┤',
  bottomLeft: '╰',
  bottomCenter: '┴',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│',
};

/** Border style preset names */
export type BorderStyleName = 'ascii' | 'single' | 'double' | 'rounded';

const BORDER_PRESETS: Record<BorderStyleName, BorderChars> = {
  ascii: ASCII_BORDER,
  single: SINGLE_BORDER,
  double: DOUBLE_BORDER,
  rounded: ROUNDED_BORDER,
};

/** Resolve border option to BorderChars */
const resolveBorder = (
  border: BorderStyleName | BorderChars | undefined
): BorderChars => {
  if (border === undefined) return ASCII_BORDER;
  if (typeof border === 'string') return BORDER_PRESETS[border];
  return border;
};

/**
 * Options for text rendering
 */
export interface TextOptions {
  /** Format string for floating point numbers (default: '%.3f' style) */
  floatPrecision?: number;
  /** Maximum width to trim output at */
  trimAt?: number;
  /** Border style: preset name or custom BorderChars object */
  border?: BorderStyleName | BorderChars;
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

  renderingLines(sizes: number[], border: BorderChars): string[] {
    const v = border.vertical;
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
        .join(` ${v} `);
      grid.push(`${v} ` + lineContent + ` ${v}`);
    }

    return grid.length === 0 ? [`${v}  ${v}`] : grid;
  }
}

/**
 * Represents the entire table structure
 */
class Table {
  private renderer: TextWriter;
  private border: BorderChars;
  private header: Row;
  private rows: Row[];
  private _sizes: number[] | null = null;

  constructor(renderer: TextWriter, records: unknown[][], attributes: string[]) {
    this.renderer = renderer;
    this.border = resolveBorder(renderer.options.border);
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

  private makeSep(left: string, center: string, right: string): string {
    const h = this.border.horizontal;
    return left + h + this.sizes.map(s => h.repeat(s)).join(h + center + h) + h + right;
  }

  get topSep(): string {
    return this.makeSep(this.border.topLeft, this.border.topCenter, this.border.topRight);
  }

  get midSep(): string {
    return this.makeSep(this.border.midLeft, this.border.midCenter, this.border.midRight);
  }

  get bottomSep(): string {
    return this.makeSep(this.border.bottomLeft, this.border.bottomCenter, this.border.bottomRight);
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
    yield this.topSep;
    yield this.header.renderingLines(this.sizes, this.border)[0];
    yield this.midSep;
    for (const row of this.rows) {
      for (const line of row.renderingLines(this.sizes, this.border)) {
        yield line;
      }
    }
    yield this.bottomSep;
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
