/**
 * Bmg.js Example - Relational Algebra Operations (TypeScript)
 *
 * This example demonstrates chaining various relational operators
 * using the classic suppliers/parts/shipments dataset with full type safety.
 */

import { Bmg, Relation } from 'bmg.js';

// =============================================================================
// Type Definitions
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

// =============================================================================
// Sample Data: Suppliers, Parts, and Shipments
// =============================================================================

const suppliers = Bmg<Supplier>([
  { sid: 'S1', name: 'Smith', status: 20, city: 'London' },
  { sid: 'S2', name: 'Jones', status: 10, city: 'Paris' },
  { sid: 'S3', name: 'Blake', status: 30, city: 'Paris' },
  { sid: 'S4', name: 'Clark', status: 20, city: 'London' },
  { sid: 'S5', name: 'Adams', status: 30, city: 'Athens' },
]);

const parts = Bmg<Part>([
  { pid: 'P1', pname: 'Nut', color: 'Red', weight: 12, city: 'London' },
  { pid: 'P2', pname: 'Bolt', color: 'Green', weight: 17, city: 'Paris' },
  { pid: 'P3', pname: 'Screw', color: 'Blue', weight: 17, city: 'Oslo' },
  { pid: 'P4', pname: 'Screw', color: 'Red', weight: 14, city: 'London' },
  { pid: 'P5', pname: 'Cam', color: 'Blue', weight: 12, city: 'Paris' },
  { pid: 'P6', pname: 'Cog', color: 'Red', weight: 19, city: 'London' },
]);

const shipments = Bmg<Shipment>([
  { sid: 'S1', pid: 'P1', qty: 300 },
  { sid: 'S1', pid: 'P2', qty: 200 },
  { sid: 'S1', pid: 'P3', qty: 400 },
  { sid: 'S1', pid: 'P4', qty: 200 },
  { sid: 'S1', pid: 'P5', qty: 100 },
  { sid: 'S1', pid: 'P6', qty: 100 },
  { sid: 'S2', pid: 'P1', qty: 300 },
  { sid: 'S2', pid: 'P2', qty: 400 },
  { sid: 'S3', pid: 'P2', qty: 200 },
  { sid: 'S4', pid: 'P2', qty: 200 },
  { sid: 'S4', pid: 'P4', qty: 300 },
  { sid: 'S4', pid: 'P5', qty: 400 },
]);

// Helper to print results
const printRelation = <T>(title: string, relation: Relation<T>): void => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(title);
  console.log('='.repeat(60));
  console.log(relation.toArray());
};

// =============================================================================
// Example 1: Basic Operations - restrict, project, rename
// =============================================================================

console.log('\n*** EXAMPLE 1: Basic Operations ***');

// Find suppliers in Paris, showing only their id and name
// Type: Relation<{ sid: string; name: string }>
const parisSuppliers = suppliers
  .restrict({ city: 'Paris' })
  .project(['sid', 'name']);

printRelation('Suppliers in Paris (id and name only)', parisSuppliers);

// Rename attributes for clarity
// Type: Relation<{ supplierId: string; supplierName: string; city: string }>
const renamedSuppliers = suppliers
  .project(['sid', 'name', 'city'])
  .rename({ sid: 'supplierId', name: 'supplierName' });

printRelation('Suppliers with renamed attributes', renamedSuppliers);

// =============================================================================
// Example 2: Extending Relations - extend, constants, prefix
// =============================================================================

console.log('\n*** EXAMPLE 2: Extending Relations ***');

// Add computed attributes
// Type: Relation<Part & { weightInKg: number; description: string }>
const partsWithMetrics = parts
  .extend({
    weightInKg: (t: Part) => t.weight / 1000,
    description: (t: Part) => `${t.color} ${t.pname}`,
  })
  .project(['pid', 'description', 'weight', 'weightInKg']);

printRelation('Parts with computed metrics', partsWithMetrics);

// Add constant values
const taggedParts = parts
  .restrict({ color: 'Red' })
  .constants({ category: 'Primary', inStock: true })
  .project(['pid', 'pname', 'category', 'inStock']);

printRelation('Red parts with constant tags', taggedParts);

// =============================================================================
// Example 3: Set Operations - union, minus, intersect
// =============================================================================

console.log('\n*** EXAMPLE 3: Set Operations ***');

const partCities = parts.project(['city']);

// Cities where we have either suppliers or parts
const allCities = suppliers.project(['city']).union(partCities);
printRelation('All cities (suppliers OR parts)', allCities);

// Cities where we have both suppliers and parts
const commonCities = suppliers.project(['city']).intersect(partCities);
printRelation('Common cities (suppliers AND parts)', commonCities);

// Cities with parts but no suppliers
const partOnlyCities = partCities.minus(suppliers.project(['city']));
printRelation('Cities with parts but no suppliers', partOnlyCities);

// =============================================================================
// Example 4: Join Operations - join, left_join, matching
// =============================================================================

console.log('\n*** EXAMPLE 4: Join Operations ***');

// Natural join: suppliers and parts in the same city
const supplierPartsInSameCity = suppliers
  .project(['sid', 'name', 'city'])
  .join(parts.project(['pid', 'pname', 'city']));

printRelation('Suppliers and parts in the same city', supplierPartsInSameCity);

// Full shipment details with supplier and part info
const fullShipments = shipments
  .join(suppliers.project(['sid', 'name']), ['sid'])
  .join(parts.project(['pid', 'pname', 'color']), ['pid'])
  .project(['name', 'pname', 'color', 'qty']);

printRelation('Full shipment details', fullShipments);

// Left join: all suppliers with their shipments (if any)
const suppliersWithShipments = suppliers
  .project(['sid', 'name'])
  .left_join(
    shipments.summarize(['sid'], { totalQty: { op: 'sum', attr: 'qty' } }),
    ['sid']
  );

printRelation('All suppliers with total shipped qty', suppliersWithShipments);

// Matching: suppliers who have shipped something
const activeSuppliers = suppliers.matching(shipments, ['sid']);
printRelation('Suppliers who have made shipments', activeSuppliers);

// Not matching: suppliers who haven't shipped anything
const inactiveSuppliers = suppliers.not_matching(shipments, ['sid']);
printRelation('Suppliers with no shipments', inactiveSuppliers);

// =============================================================================
// Example 5: Aggregation - summarize
// =============================================================================

console.log('\n*** EXAMPLE 5: Aggregation ***');

// Count suppliers per city
const suppliersPerCity = suppliers.summarize(['city'], {
  supplierCount: 'count',
  avgStatus: { op: 'avg', attr: 'status' },
});

printRelation('Suppliers per city with average status', suppliersPerCity);

// Shipment statistics per supplier
const shipmentStats = shipments
  .join(suppliers.project(['sid', 'name']), ['sid'])
  .summarize(['name'], {
    shipmentCount: 'count',
    totalQty: { op: 'sum', attr: 'qty' },
    avgQty: { op: 'avg', attr: 'qty' },
    minQty: { op: 'min', attr: 'qty' },
    maxQty: { op: 'max', attr: 'qty' },
  });

printRelation('Shipment statistics per supplier', shipmentStats);

// Grand total
const grandTotal = shipments.summarize([], {
  totalShipments: 'count',
  totalQuantity: { op: 'sum', attr: 'qty' },
});

printRelation('Grand total', grandTotal);

// =============================================================================
// Example 6: Grouping and Nesting - group, image, wrap
// =============================================================================

console.log('\n*** EXAMPLE 6: Grouping and Nesting ***');

// Group parts: nest pid and pname into a 'items' relation, grouped by color
const partsByColor = parts
  .project(['color', 'pid', 'pname'])
  .group(['pid', 'pname'], 'items');

printRelation('Parts grouped by color (nested items)', partsByColor);

// Show expanded view of one group
const redParts = partsByColor.restrict({ color: 'Red' }).one();
console.log('Red parts items:', redParts.items.toArray());

// Image: for each supplier, get their shipped parts
const supplierParts = suppliers
  .project(['sid', 'name'])
  .image(shipments.project(['sid', 'pid', 'qty']), 'shipments', ['sid']);

printRelation('Each supplier with their shipments', supplierParts);

// Wrap: combine part attributes into a nested object
const wrappedParts = parts.wrap(['color', 'weight'], 'specs');

printRelation('Parts with wrapped specs', wrappedParts);

// =============================================================================
// Example 7: Complex Chained Query
// =============================================================================

console.log('\n*** EXAMPLE 7: Complex Chained Query ***');

// Find supplier quantities by part color
const supplierQtyByColor = shipments
  .join(parts.project(['pid', 'color']), ['pid'])
  .join(suppliers.project(['sid', 'name']), ['sid'])
  .summarize(['color', 'name'], {
    totalQty: { op: 'sum', attr: 'qty' },
  })
  .project(['color', 'name', 'totalQty']);

printRelation('Supplier quantities by part color', supplierQtyByColor);

// =============================================================================
// Example 8: Data Transformation - transform, allbut
// =============================================================================

console.log('\n*** EXAMPLE 8: Data Transformation ***');

// Transform all string values to uppercase
const uppercasedSuppliers = suppliers.transform({
  name: (v: unknown) => (v as string).toUpperCase(),
  city: (v: unknown) => (v as string).toUpperCase(),
});

printRelation('Suppliers with uppercase names and cities', uppercasedSuppliers);

// Allbut: select all attributes except some
// Type: Relation<{ pid: string; pname: string; color: string; weight: number }>
const partsWithoutLocation = parts.allbut(['city']);

printRelation('Parts without city attribute', partsWithoutLocation);

// =============================================================================
// Example 9: Using .one() to extract a single tuple
// =============================================================================

console.log('\n*** EXAMPLE 9: Extracting Single Tuples ***');

// Get a specific supplier - returns typed Supplier
const smith: Supplier = suppliers.restrict({ sid: 'S1' }).one();
console.log('\nSupplier S1 (Smith):', smith);

// Get the total quantity shipped
const total = shipments.summarize([], { total: { op: 'sum', attr: 'qty' } }).one();
console.log('Total quantity shipped:', total.total);

// =============================================================================
// Example 10: Checking Relation Properties
// =============================================================================

console.log('\n*** EXAMPLE 10: Relation Properties ***');

// Check if two relations are equal
const parisSuppliers1 = suppliers.restrict({ city: 'Paris' });
const parisSuppliers2 = suppliers.restrict((t: Supplier) => t.city === 'Paris');

console.log('\nAre the two Paris supplier queries equal?', parisSuppliers1.isEqual(parisSuppliers2));

// Check if something is a relation
console.log('Is suppliers a relation?', Bmg.isRelation(suppliers));
console.log('Is an array a relation?', Bmg.isRelation([{ a: 1 }]));

console.log('\n*** ALL EXAMPLES COMPLETED ***\n');
