/**
 * agnostic:compile — Schema → TypeScript contract generator
 *
 * Reads storage/{project}/db/schema_definitions.json and emits
 * src/generated/agnostic-schemas.ts — the stable typed contract
 * between the engine and any custom components or AI assistants.
 *
 * Run: npm run agnostic:compile
 * Also runs automatically before `npm run dev` and `npm run build`.
 *
 * The output file is committed to the repo so AI assistants in the IDE
 * can read it without running the compiler first.
 */

import fs from 'fs'
import path from 'path'

// ─── Types (mirrors indra.ts, duplicated to keep this script self-contained) ──

interface SchemaField {
  id?: string
  key: string
  label?: string
  type: string
  required?: boolean
  width?: string
  section?: string
  config?: Record<string, unknown>
  isPrimary?: boolean
}

interface SchemaData {
  name: string
  fields?: SchemaField[]
}

interface SchemaItem {
  id: string
  context: string
  data: SchemaData
  updated_at?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toPascalCase(str: string): string {
  return str
    .split(/[_\s-]/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

/**
 * Maps a schema field type to its TypeScript equivalent.
 * relation fields store the related record's UUID as a string.
 * markdown and textarea are plain strings.
 */
function toTsType(fieldType: string): string {
  const map: Record<string, string> = {
    text:      'string',
    textarea:  'string',
    markdown:  'string',
    number:    'number',
    boolean:   'boolean',
    date:      'string',      // ISO 8601
    datetime:  'string',      // ISO 8601
    email:     'string',
    tel:       'string',
    url:       'string',
    select:    'string',
    relation:  'string',      // stores the related record's UUID
    image:     'string',      // URL or base64
    file:      'string',      // URL
    color:     'string',      // hex
    json:      'Record<string, unknown>',
  }
  return map[fieldType] ?? 'unknown'
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function resolveProjectPath(): string {
  // Respect explicit override
  if (process.env.STORAGE_PATH) return process.env.STORAGE_PATH

  // Read active project from system_config.json (same logic as activeProject.ts)
  const configPath = path.join(process.cwd(), 'storage', 'system_config.json')
  if (!fs.existsSync(configPath)) {
    console.warn('[agnostic:compile] storage/system_config.json not found — fresh workspace, skipping compile.')
    process.exit(0)
  }
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  const items = Array.isArray(raw) ? raw : [raw]
  const passport = items.find((i: any) => i.id === 'master_passport')
  const identity = passport?.data?.project_identity

  if (!identity) {
    console.warn('[agnostic:compile] master_passport.project_identity not found — skipping compile.')
    process.exit(0)
  }

  return path.join(process.cwd(), 'storage', identity, 'db')
}

function compile(): void {
  const storagePath = resolveProjectPath()
  const schemasPath = path.join(storagePath, 'schema_definitions.json')
  const outputPath  = process.env.OUTPUT_PATH
    ?? path.join(process.cwd(), 'src', 'generated', 'agnostic-schemas.ts')

  if (!fs.existsSync(schemasPath)) {
    console.warn(`[agnostic:compile] schema_definitions.json not found — skipping compile.`)
    process.exit(0)
  }

  const raw: SchemaItem[] = JSON.parse(fs.readFileSync(schemasPath, 'utf-8'))
  const schemas = raw
    .filter(item => item.data?.name)
    .map(item => item.data)

  if (schemas.length === 0) {
    console.warn('[agnostic:compile] No schemas found — output will be empty.')
  }

  const lines: string[] = [
    `// ============================================================`,
    `// AUTO-GENERATED — do not edit manually.`,
    `// Source: ${schemasPath.replace(process.cwd(), '.')}`,
    `// Run:    npm run agnostic:compile`,
    `// Generated: ${new Date().toISOString()}`,
    `// ============================================================`,
    ``,
    `// DataItem is the universal record wrapper used by the engine.`,
    `// id: crypto.randomUUID() — never Math.random() or Date.now()`,
    `// context: matches schema.name and the data file name (without .json)`,
    `export interface AgnosticDataItem<T = Record<string, unknown>> {`,
    `  id: string`,
    `  context: string`,
    `  data: T`,
    `  created_at?: string`,
    `  updated_at?: string`,
    `}`,
    ``,
  ]

  for (const schema of schemas) {
    const typeName = toPascalCase(schema.name)
    const fields   = (schema.fields ?? [])

    // Build field lines — one per field key
    const fieldLines = fields
      .filter(f => f.key)
      .map(f => {
        const optional = f.required ? '' : '?'
        const tsType   = toTsType(f.type)
        const comment  = f.label ? `  // ${f.label}` : ''
        return `  ${f.key}${optional}: ${tsType}${comment}`
      })

    // Find the primary field for documentation
    const primaryField = fields.find(f => f.isPrimary || f.config?.isPrimary)
    const primaryNote  = primaryField ? ` — primary field: "${primaryField.key}"` : ''

    lines.push(
      `// ─── Schema: "${schema.name}"${primaryNote} `,
      `export interface ${typeName} {`,
      ...(fieldLines.length > 0 ? fieldLines : [`  [key: string]: unknown`]),
      `}`,
      ``,
      `export type ${typeName}Record = AgnosticDataItem<${typeName}>`,
      ``,
    )
  }

  // ── Global map — what AI assistants should reference ──────────────────────
  const schemaEntries = schemas.map(s => `  ${s.name}: ${toPascalCase(s.name)}`).join('\n')
  const schemaNames   = schemas.map(s => `'${s.name}'`).join(' | ')

  lines.push(
    `// ============================================================`,
    `// AgnosticSchemas — complete project schema map`,
    `//`,
    `// When generating custom components, import from here:`,
    `//   import type { Cliente, ClienteRecord } from '@/generated/agnostic-schemas'`,
    `//`,
    `// When setting block.context in page_routes.json, use SchemaName values.`,
    `// ============================================================`,
    `export interface AgnosticSchemas {`,
    schemaEntries,
    `}`,
    ``,
    `// Valid values for block.context and fetch(\`/api/vault?namespace=\${ctx}\`)`,
    `export type SchemaName = keyof AgnosticSchemas`,
    `// Resolved: ${schemaNames}`,
    ``,
  )

  // ── Write output ──────────────────────────────────────────────────────────
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8')

  console.log(`\n✓ agnostic:compile — ${schemas.length} schemas → ${outputPath.replace(process.cwd(), '.')}`)
  for (const s of schemas) {
    const fieldCount = s.fields?.length ?? 0
    const primary    = s.fields?.find(f => f.isPrimary || f.config?.isPrimary)?.key ?? '—'
    console.log(`  · ${s.name.padEnd(28)} ${String(fieldCount).padStart(2)} fields   primary: ${primary}`)
  }
  console.log()
}

compile()
