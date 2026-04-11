/**
 * Generates lib-definitions.ts from types.ts
 *
 * This script reads the TypeScript type definitions and converts them to a
 * string constant that can be used by the playground's type checker.
 *
 * Run with: npm run generate:lib-definitions
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '..', 'src')

const typesPath = path.join(srcDir, 'types.ts')
const outputPath = path.join(srcDir, 'lib-definitions.ts')

// Read types.ts
const typesContent = fs.readFileSync(typesPath, 'utf-8')

// Process: strip exports and convert to ambient declarations
const processed = typesContent
  // Convert 'export type' to 'type'
  .replace(/^export type /gm, 'type ')
  // Convert 'export interface' to 'interface'
  .replace(/^export interface /gm, 'interface ')
  // Remove standalone export statements (if any)
  .replace(/^export \{[^}]*\};?\s*$/gm, '')
  // Escape backticks for template literal
  .replace(/`/g, '\\`')
  // Escape ${...} template expressions
  .replace(/\$\{/g, '\\${')
  // Clean up multiple blank lines
  .replace(/\n{3,}/g, '\n\n')
  .trim()

// Generate output with Bmg function declaration appended
const output = `// Auto-generated from types.ts
// Run 'npm run generate:lib-definitions' to regenerate

export const LIB_DEFINITIONS = \`
${processed}

// ============================================================================
// Bmg Function Declaration
// ============================================================================

/** Create a relation from an array of tuples */
declare function Bmg<T>(tuples: T[]): Relation<T>
declare namespace Bmg {
  function isRelation(op: unknown): boolean
}
\`
`

fs.writeFileSync(outputPath, output)
console.log(`Generated ${outputPath}`)
