/**
 * validate-storage.mjs
 * Pre-commit hook: validates staged storage/*.json files.
 *
 * Checks:
 *   1. Every staged storage/ JSON parses without error (hard block)
 *   2. Every block.context in page_routes.json exists as a schema (warning)
 *
 * Invoked by .githooks/pre-commit — never run manually in production.
 */

import { execSync } from 'child_process'

// ── Get staged storage/ JSON files ───────────────────────────────────────────
const staged = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
  .trim().split('\n')
  .filter(f => f && f.startsWith('storage/') && f.endsWith('.json'))

if (staged.length === 0) process.exit(0)

const errors   = []
const warnings = []

// ── Per-file checks ───────────────────────────────────────────────────────────
for (const file of staged) {
  // Read staged content (not working-tree — what will actually be committed)
  let raw
  try {
    raw = execSync(`git show :${file}`, { encoding: 'utf-8' })
  } catch {
    continue // file deleted in this commit — skip
  }

  // 1. Valid JSON ───────────────────────────────────────────────────────────────
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    errors.push(`  ❌  ${file}\n      ${e.message}`)
    continue
  }

  // 2. Invariant: block.context must match a known schema name ─────────────────
  if (!file.endsWith('page_routes.json')) continue

  // Current seed/fork contract: routes and schemas live under storage/db.
  const schemaFile = 'storage/db/schema_definitions.json'

  const schemaNames = new Set(['page_routes', 'schema_definitions', 'scripts', 'system_config'])

  try {
    const schemaRaw = execSync(`git show :${schemaFile}`, { encoding: 'utf-8' })
    const arr = JSON.parse(schemaRaw)
    ;(Array.isArray(arr) ? arr : []).forEach(s => {
      const name = s.data?.name ?? s.name
      if (name) schemaNames.add(name)
    })
  } catch {
    // schema file not staged — read from working tree as fallback
    try {
      const { readFileSync } = await import('fs')
      const arr = JSON.parse(readFileSync(schemaFile, 'utf-8'))
      ;(Array.isArray(arr) ? arr : []).forEach(s => {
        const name = s.data?.name ?? s.name
        if (name) schemaNames.add(name)
      })
    } catch { /* no schemas available — skip invariant check */ }
  }

  // Walk blocks recursively
  function walkBlocks(blocks) {
    if (!Array.isArray(blocks)) return
    for (const block of blocks) {
      if (block.context && !schemaNames.has(block.context)) {
        warnings.push(
          `  ⚠️   ${file}\n` +
          `       block "${block.id ?? block.type}" → context="${block.context}" no existe en schema_definitions`
        )
      }
      walkBlocks(block.blocks)
    }
  }

  ;(Array.isArray(parsed) ? parsed : []).forEach(route => walkBlocks(route.data?.blocks))
}

// ── Report ────────────────────────────────────────────────────────────────────
const RESET = '\x1b[0m', RED = '\x1b[31m', YELLOW = '\x1b[33m', GREEN = '\x1b[32m'

if (errors.length) {
  console.error(`\n${RED}🚫  COMMIT BLOQUEADO — JSON inválido en storage/${RESET}\n`)
  errors.forEach(e => console.error(e))
  console.error(`\n${YELLOW}Usa el MCP bridge para editar storage/ de forma segura:${RESET}`)
  console.error('    npm run mcp:bridge\n')
  process.exit(1)
}

if (warnings.length) {
  console.warn(`\n${YELLOW}⚠️   Advertencias de invariante (commit permitido pero revisa)${RESET}\n`)
  warnings.forEach(w => console.warn(w))
  console.warn(`\n    Regla: block.context === schema.name === nombre_de_archivo.json\n`)
}

console.log(`${GREEN}✅  storage/ validado: ${staged.length} archivo(s) OK${RESET}`)
