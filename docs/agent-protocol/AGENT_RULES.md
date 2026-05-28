# Agnostic Seed — Agent Rules

**Paste this into your agent's system prompt / rules configuration.**
Works with: Cursor, GitHub Copilot, Windsurf, Claude, or any coding assistant.

---

## The one rule

**You do not write `storage/*.json` files directly. Ever.**

Storage files are the skeleton of the app. A single malformed key, a wrong `context` value, or an invalid JSON char breaks the entire system silently. The MCP bridge is the only safe mutation path.

---

## What you use instead

```bash
npm run mcp:bridge   # starts the MCP server with 21 semantic tools
```

Use these tools — not direct file edits — for all storage mutations:

| Intent | Tool |
|--------|------|
| Define a new entity | `create_schema` |
| Add a field to a schema | `update_schema` |
| Create a page / route | `create_route` |
| Add a block to a route | `update_route` |
| Write automation logic | `write_script` |
| Read existing schemas | `list_schemas`, `get_schema` |
| Read existing routes | `list_routes`, `get_route` |
| Read existing scripts | `list_scripts`, `get_script` |

---

## Layer map — what you can touch

```
packages/                   ← ENGINE. Read-only unless you're fixing a bug.
src/components/agnostic/    ← ENGINE. Read-only.
src/lib/agnostic/           ← ENGINE. Read-only.
src/app/api/                ← ENGINE. Read-only.

agnostic.config.ts          ← YOURS. Register new block types here.
src/components/specialized/ ← YOURS. Custom UI blocks live here.
src/generated/              ← AUTO-GENERATED. Never edit manually.
storage/                    ← DATA. Never edit manually. Use MCP bridge.
```

---

## The invariant that must never break

```
block.context  ===  schema.data.name  ===  storage_file_name (without .json)
```

If these three diverge, the engine silently renders nothing. No error. No log.

---

## How to build a new feature (the correct sequence)

```
1. Define the schema        → create_schema (MCP)
2. Create the route         → create_route  (MCP)
3. Generate types           → npm run agnostic:compile
4. Build custom UI          → create src/components/specialized/YourBlock.tsx
                              (use _TEMPLATE.tsx as base — always default export)
5. Register the block       → agnostic.config.ts → blocks: { your_type: () => import(...) }
6. Set type on route        → update_route (MCP) → block.type = "your_type"
```

---

## Anti-patterns — never do these

```typescript
// ❌ Write storage JSON directly
fs.writeFileSync('storage/db/schemas.json', ...)

// ❌ camelCase in schema field keys or block data
{ schemaId: '...', parentKey: '...' }   // use snake_case always

// ❌ Hardcode business fields in generic engine components
// src/components/agnostic/** is blind — it doesn't know field names

// ❌ Generate new IDs with Math.random() or Date.now()
id: `block_${Date.now()}`   // use crypto.randomUUID()

// ❌ Edit src/generated/agnostic-schemas.ts
// It is auto-generated. Run agnostic:compile instead.
```

---

## Automation logic (zaps)

Scripts that run on button clicks live as data records, not as files.

```
AgnosticAction → POST /api/engine { zap: "my_script" }
              → reads scripts namespace
              → executes in Node.js vm sandbox (5s timeout)
```

Create scripts with: `write_script` MCP tool — never as `.js` files.

Available API inside a script:
```javascript
api.query(context)                          // read records
api.saveItem(context, { id?, data })        // write records
api.notify.success(msg) / api.notify.error(msg)
api.dispatchEvent('print_pdf', { html })
payload.record                              // the record that triggered the action
```
