# Engine Rules — Agnostic Seed

AI assistants working on this repo MUST read this file first.

## What this system is

A **blind renderer**. `src/` knows nothing about clients, invoices, or products. All business meaning lives in `storage/{tenant}/db/*.json`. To change what the app shows, edit `storage/`. Never touch `src/` for business changes.

## The one invariant that must never break

```
block.context === schema.data.name === data_file_name (without .json)
```

If these three diverge, the engine silently renders nothing. Every bug in this codebase's history traces back to violating this invariant.

## Five atoms — nothing else exists

| Atom | Shape |
|------|-------|
| Schema | `{ name, fields[] }` |
| Record | `{ id, data }` |
| Adapter | `read(ctx) / write(ctx, record) / remove(ctx, id)` |
| Block | `{ type, schema_id, context }` |
| Page | ordered blocks at a URL path |

## Architecture chain (read-only mental model)

```
Request
  → layout.tsx        → getVaultData([routes, schemas, config])  ← SSR, React.cache deduplicates
  → page.tsx          → getVaultData([routes, schemas, + page contexts])  ← SSR
  → resolveAgnosticRoute()   → pure memory, no I/O
  → AgnosticShell     → hydrates Zustand ONCE on navigation (resolution.path dep)
  → AgnosticRenderer  → routes block.type to registered components
  → /api/vault        → ONLY write gateway → Adapter → storage/
```

## Naming contract

**Always snake_case** in block data, schema field keys, and relation configs. No camelCase aliases anywhere in the data layer.

```typescript
// CORRECT
{ schema_id: '...', parent_key: '...', display_field: '...' }

// FORBIDDEN — camelCase creates dual vocabulary entropy
{ schemaId: '...', parentKey: '...', displayField: '...' }
```

## Data loading contract

**SSR loads**: primary entities of the page (what the user navigates TO see).

**Lazy loads**: relation field options (what the user SELECTs from). These load client-side via the `RelationField` component in `AgnosticForm.tsx` using `fetch('/api/vault?namespace=X')` on mount.

**Never add**: an `inferredRelations` loop in `page.tsx` to eagerly SSR catalog data. This pattern was deleted because it inflated the HTML payload by 143KB per navigation. Relation selectors don't need Zero FOUC — they need correctness.

## Anti-patterns — forbidden forever

These were actual bugs in this codebase. Do not reintroduce them.

```typescript
// 1. Prefix band-aids — contexts must match schema names exactly
context.replace('vault_', '')   // FORBIDDEN
context.replace('schema_', '')  // FORBIDDEN

// 2. CamelCase alias alongside snake_case
{ schemaId: x, schema_id: x }  // FORBIDDEN — pick one (snake_case)

// 3. Eager SSR for relation catalog data
const inferredRelations = new Set()
for (const field of schema.fields) {
  if (field.type === 'relation') inferredRelations.add(field.config.relation.entity)
}  // FORBIDDEN — relation data loads lazily in RelationField

// 4. Hydration outside of AgnosticShell (except AppContext which serves the designer)
hydrateDNA(...)   // Only in AppContext (designer) and AgnosticShell (pages)
hydrateMateria(…) // Only in AppContext (designer) and AgnosticShell (pages)

// 5. New ID generation with Math.random() or Date.now()
id: `block_${Date.now()}`  // FORBIDDEN — use crypto.randomUUID()

// 6. Leer datos de relación directamente del store sin resolver
const relatedList = materiaStore[rel.entity] || [] // FORBIDDEN sin useRelationData
// Usar siempre: const { data } = useRelationData(rel.entity)

// 7. Hardcodear campos de negocio en componentes genéricos de src/
await saveItem(context, { data: { direccion_obra: "", costos_operativos: 0 } }) // FORBIDDEN en src/
// src/ es ciego. Solo guarda { [inferredTitleField]: value }. Los demás campos los llena el usuario.

// 8. Crear scripts de lógica como archivos .js en el filesystem
// storage/{tenant}/logic/*.js   // FORBIDDEN — no existe este patrón
// storage/{tenant}/actions/*.js // FORBIDDEN — no existe este patrón
// Los scripts SIEMPRE viven en storage/{tenant}/db/scripts.json como DataItems
// y se ejecutan vía /api/engine. Usar herramienta MCP write_script para crearlos.
```

## Zap execution system (action buttons with logic)

Action blocks (`type: "action"`) have a `zap` field that names a script. When clicked:

```
AgnosticAction.tsx → POST /api/engine { zap, payload: { record, context, schema } }
  → reads 'scripts' namespace from adapter
  → finds script record by data.name === zap
  → executes code string in Node.js vm.runInNewContext sandbox (5s timeout)
  → returns { success, events[] }
  → client processes events: notify / materia_sync / print_pdf
```

Scripts live in `storage/{tenant}/db/scripts.json` as standard DataItems:
```json
{ "id": "uuid", "context": "scripts", "data": { "name": "my_zap", "code": "..." } }
```

**Available API inside a script (server-side only):**
```javascript
api.notify.success(msg) / api.notify.error(msg)   // queues a toast event
api.query(context)                                  // returns data[] (r.data for each record)
api.saveItem(context, { id?, data })               // writes + queues materia_sync event
api.dispatchEvent('print_pdf', { html })           // queues browser print event
payload.record                                      // the activeRecord that triggered the button
```

**To manage scripts via MCP:** use `list_scripts`, `get_script`, `write_script`, `delete_script` tools. Never manage scripts as generic records via `create_record`/`update_record` — those tools don't validate the `name`/`code` structure.

## Key files

| File | Responsibility |
|------|----------------|
| `packages/core/src/indra.ts` | Canonical types — single source of truth for all interfaces |
| `src/core/server/vault.ts` | SSR data loader — wrapped in `React.cache()`, never call it more than needed |
| `src/lib/agnostic/resolver.ts` | Route resolver — pure memory, no I/O |
| `src/lib/agnostic/constants.ts` | `SYSTEM_NS` — use these, never string literals `'page_routes'` |
| `src/components/agnostic/engine/AgnosticRenderer.tsx` | Block type router |
| `src/components/agnostic/blocks/AgnosticForm.tsx` | Form renderer + `RelationField` lazy loader |
| `src/components/agnostic/blocks/AgnosticAction.tsx` | Action button — calls `/api/engine` with `zap` name |
| `src/app/api/vault/route.ts` | Only write gateway — all mutations go through here |
| `src/app/api/engine/route.ts` | Zap executor — vm sandbox, reads scripts from adapter |
| `scripts/mcp-bridge.ts` | MCP stdio server — 21 semantic tools for schema/route/record/script CRUD |

## Storage strategies

Configured in `storage/{tenant}/manifest.json`:

- `local` — JSON files in `storage/{tenant}/db/`
- `supabase` — cloud DB
- `hybrid` — GitHub DNA + Supabase data

Active tenant is resolved by `src/server/activeProject.ts`. Change the tenant there, not in code.

## What you can safely do

- Edit `storage/{tenant}/db/*.json` to change data, schemas, routes
- Edit `storage/{tenant}/styles/tokens.css` to change visual identity
- Edit `storage/{tenant}/manifest.json` to change strategy or tenant config
- Add new block types by registering them in `src/lib/agnostic/Registry.ts`
- Use `npm run mcp:bridge` for semantic CRUD operations via MCP

## What you must not do

- Add business logic to `src/` (it belongs in `storage/`)
- Add new namespaces to the SSR relation inference (the loop was deleted intentionally)
- Add `any` types to `indra.ts` — it is the canonical type contract
- Create files outside of established layers without an explicit architectural reason
- Add comments that describe WHAT code does — only comment non-obvious WHY
