// ============================================================
// AUTO-GENERATED — do not edit manually.
// Source: .\storage\db\schema_definitions.json
// Run:    npm run agnostic:compile
// ============================================================

// DataItem is the universal record wrapper used by the engine.
// id: crypto.randomUUID() — never Math.random() or Date.now()
// context: matches schema.name and the data file name (without .json)
export interface AgnosticDataItem<T = Record<string, unknown>> {
  id: string
  context: string
  data: T
  created_at?: string
  updated_at?: string
}

// ============================================================
// AgnosticSchemas — complete project schema map
//
// When generating custom components, import from here:
//   import type { Cliente, ClienteRecord } from '@/generated/agnostic-schemas'
//
// When setting block.context in page_routes.json, use SchemaName values.
// ============================================================
export interface AgnosticSchemas {

}

// Valid values for block.context and fetch(`/api/vault?namespace=${ctx}`)
export type SchemaName = keyof AgnosticSchemas
// Resolved: 
