/**
 * Bmg.js Example - toText for ASCII Table Rendering
 *
 * Demonstrates the toText operator for rendering relations as ASCII tables,
 * including flat relations and nested relations (from group, image, wrap).
 */

import { Bmg } from '@enspirit/bmg-js';

// =============================================================================
// Sample Data
// =============================================================================

interface Supplier {
  sid: string;
  name: string;
  status: number;
  city: string;
}

interface Part {
  pid: string;
  pname: string;
  color: string;
  weight: number;
  city: string;
}

interface Shipment {
  sid: string;
  pid: string;
  qty: number;
}

const suppliers = Bmg<Supplier>([
  { sid: 'S1', name: 'Smith', status: 20, city: 'London' },
  { sid: 'S2', name: 'Jones', status: 10, city: 'Paris' },
  { sid: 'S3', name: 'Blake', status: 30, city: 'Paris' },
  { sid: 'S4', name: 'Clark', status: 20, city: 'London' },
  { sid: 'S5', name: 'Adams', status: 30, city: 'Athens' },
]);

const parts = Bmg<Part>([
  { pid: 'P1', pname: 'Nut', color: 'Red', weight: 12.5, city: 'London' },
  { pid: 'P2', pname: 'Bolt', color: 'Green', weight: 17.0, city: 'Paris' },
  { pid: 'P3', pname: 'Screw', color: 'Blue', weight: 17.25, city: 'Oslo' },
]);

const shipments = Bmg<Shipment>([
  { sid: 'S1', pid: 'P1', qty: 300 },
  { sid: 'S1', pid: 'P2', qty: 200 },
  { sid: 'S2', pid: 'P1', qty: 300 },
  { sid: 'S2', pid: 'P2', qty: 400 },
  { sid: 'S3', pid: 'P2', qty: 200 },
]);

// =============================================================================
// Example 1: Flat Relations
// =============================================================================

console.log('='.repeat(70));
console.log('EXAMPLE 1: Flat Relations');
console.log('='.repeat(70));

console.log('\n--- Suppliers ---');
console.log(suppliers.toText());

console.log('\n--- Parts (with floats) ---');
console.log(parts.toText());

console.log('\n--- Projected Relation (sid, name only) ---');
console.log(suppliers.project(['sid', 'name']).toText());

// =============================================================================
// Example 2: DEE and DUM (special relations)
// =============================================================================

console.log('='.repeat(70));
console.log('EXAMPLE 2: DEE and DUM');
console.log('='.repeat(70));

// DEE: relation with one tuple, no attributes (represents TRUE)
const DEE = Bmg([{}]);
console.log('\n--- DEE: one tuple, no attributes (TRUE) ---');
console.log(DEE.toText());

// DUM: relation with no tuples, no attributes (represents FALSE)
const DUM = Bmg([]);
console.log('\n--- DUM: no tuples, no attributes (FALSE) ---');
console.log(DUM.toText());

// =============================================================================
// Example 3: Group - Nested Relations
// =============================================================================

console.log('='.repeat(70));
console.log('EXAMPLE 3: Group (nested relations)');
console.log('='.repeat(70));

console.log('\n--- Suppliers grouped by city ---');
const suppliersByCity = suppliers.group(['sid', 'name', 'status'], 'suppliers');
console.log(suppliersByCity.toText());

// =============================================================================
// Example 4: Image - Nested Relations
// =============================================================================

console.log('='.repeat(70));
console.log('EXAMPLE 4: Image (nested relations)');
console.log('='.repeat(70));

console.log('\n--- Suppliers with their shipments ---');
const suppliersWithShipments = suppliers
  .project(['sid', 'name'])
  .image(shipments.project(['sid', 'pid', 'qty']), 'shipments', ['sid']);
console.log(suppliersWithShipments.toText());

// =============================================================================
// Example 5: Wrap - Nested Objects
// =============================================================================

console.log('='.repeat(70));
console.log('EXAMPLE 5: Wrap (nested objects)');
console.log('='.repeat(70));

console.log('\n--- Suppliers with location wrapped ---');
const wrappedSuppliers = suppliers.wrap(['city', 'status'], 'location');
console.log(wrappedSuppliers.toText());

// =============================================================================
// Example 6: Special Values
// =============================================================================

console.log('='.repeat(70));
console.log('EXAMPLE 6: Special Values');
console.log('='.repeat(70));

const specialValues = Bmg([
  { id: 1, value: null, note: 'null value' },
  { id: 2, value: undefined, note: 'undefined value' },
  { id: 3, value: 3.14159265, note: 'float (default precision)' },
  { id: 4, value: new Date('2024-06-15T10:30:00Z'), note: 'date' },
  { id: 5, value: { nested: 'object' }, note: 'plain object' },
  { id: 6, value: ['a', 'b', 'c'], note: 'array of primitives' },
]);

console.log('\n--- Various value types ---');
console.log(specialValues.toText());

// =============================================================================
// Example 7: Options
// =============================================================================

console.log('='.repeat(70));
console.log('EXAMPLE 7: Options');
console.log('='.repeat(70));

console.log('\n--- Float precision: 1 decimal ---');
console.log(parts.toText({ floatPrecision: 1 }));

console.log('\n--- Float precision: 5 decimals ---');
const preciseData = Bmg([{ pi: 3.14159265358979 }]);
console.log(preciseData.toText({ floatPrecision: 5 }));

console.log('\n--- Trimmed output (trimAt: 40) ---');
console.log(suppliers.toText({ trimAt: 40 }));

// =============================================================================
// Example 8: Border Styles
// =============================================================================

console.log('='.repeat(70));
console.log('EXAMPLE 8: Border Styles');
console.log('='.repeat(70));

const sample = Bmg([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
]);

console.log('\n--- ASCII (default) ---');
console.log(sample.toText({ border: 'ascii' }));

console.log('\n--- Single (Unicode single lines) ---');
console.log(sample.toText({ border: 'single' }));

console.log('\n--- Double (Unicode double lines) ---');
console.log(sample.toText({ border: 'double' }));

console.log('\n--- Rounded (Unicode rounded corners) ---');
console.log(sample.toText({ border: 'rounded' }));

console.log('\n--- Border style with nested relations ---');
const nested = suppliers
  .project(['sid', 'name', 'city'])
  .group(['sid', 'name'], 'suppliers');
console.log(nested.toText({ border: 'single' }));

// =============================================================================
// Example 9: Complex Nesting (group + summarize)
// =============================================================================

console.log('='.repeat(70));
console.log('EXAMPLE 9: Complex Nesting');
console.log('='.repeat(70));

console.log('\n--- Shipments summarized by supplier, with supplier info ---');
const shipmentSummary = shipments
  .summarize(['sid'], {
    total_qty: { op: 'sum', attr: 'qty' },
    num_parts: 'count',
  });

const summaryWithSupplier = suppliers
  .project(['sid', 'name', 'city'])
  .join(shipmentSummary, ['sid']);

console.log(summaryWithSupplier.toText());

console.log('\n--- Parts grouped by color with count ---');
const partsByColor = parts
  .group(['pid', 'pname', 'weight', 'city'], 'parts')
  .extend({ count: (t: { parts: { toArray: () => unknown[] } }) => t.parts.toArray().length });
console.log(partsByColor.toText());
