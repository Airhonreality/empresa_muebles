# Agnostic System Seed

Schema-driven UI engine built on Next.js 15. Define data models → the engine renders standard views automatically. Build custom interfaces with AI using typed schema contracts.

**This is the seed.** Every client project is a separate repo that forks from here. The engine lives here. Business logic never does.

---

## Two roles, two workflows

| You are... | Your repo is... | You read... |
|-----------|----------------|-------------|
| Building a **new project** | A fork of this seed | [→ Starting a new project](#starting-a-new-project) |
| Improving the **engine** | This seed repo | [→ Contributing engine improvements](#contributing-engine-improvements) |

---

## Starting a new project

### 1. Clone the seed into your project repo

```bash
# On GitHub: create a new empty repo (e.g. github.com/your-org/proyecto-cliente)
# Then locally:
git clone https://github.com/Airhonreality/Agnostic_System_Seed.git proyecto-cliente
cd proyecto-cliente

# Point origin to your new project repo
git remote set-url origin https://github.com/your-org/proyecto-cliente.git

# Keep the seed as upstream to receive engine updates
git remote add upstream https://github.com/Airhonreality/Agnostic_System_Seed.git

git push -u origin main
```

### 2. Install and boot

```bash
npm install
npm run agnostic:compile   # generate TypeScript types from your schemas
npm run dev
# → http://localhost:3000
# → Config Manager at http://localhost:3000/_agnostic
```

### 3. Create your storage tenant

```bash
mkdir -p storage/mi-proyecto/db
# Create storage/mi-proyecto/manifest.json
```

```json
{
  "project": "mi-proyecto",
  "strategy": "local",
  "dataDir": "./storage/mi-proyecto/db"
}
```

Then update `src/server/activeProject.ts` to return `"mi-proyecto"`.

### 4. Build custom UI blocks (AI-assisted)

```bash
npm run agnostic:compile
# Gives AI the typed contracts:
# → src/generated/agnostic-schemas.ts
# → src/components/specialized/_TEMPLATE.tsx
# → agnostic.config.ts
```

The AI generates `src/components/specialized/YourBlock.tsx`. Register it:

```typescript
// agnostic.config.ts
export default defineConfig({
  blocks: {
    your_block: () => import('./src/components/specialized/YourBlock'),
  }
})
```

Set `"type": "your_block"` in `storage/mi-proyecto/db/page_routes.json`. Done.

---

## What lives where

```
packages/                    ← ENGINE — never touch in a project
src/
  components/
    agnostic/                ← ENGINE — never touch in a project
    specialized/             ← YOUR PROJECT — AI-generated custom blocks
  generated/                 ← AUTO-GENERATED — run agnostic:compile after schema changes
agnostic.config.ts           ← YOUR PROJECT — registers your custom blocks
storage/                     ← YOUR DATA — gitignored in seed, tracked in project repos
  {project}/
    db/
      schemas.json           → entity definitions + field types
      page_routes.json       → URL → block composition map
      scripts.json           → zap automations (server-side Node.js VM)
      {entity}.json          → one file per data collection
    manifest.json            → strategy (local / supabase / hybrid)
    styles/tokens.css        → project visual identity (CSS variables)
```

**The one invariant that must never break:**
```
block.context === schema.data.name === data_file_name (without .json)
```

---

## Receiving engine updates in your project

When the seed improves (new block types, bug fixes, performance), pull them into your project:

```bash
git fetch upstream
git merge upstream/main
# Resolve conflicts if any — they will NEVER be in storage/ or specialized/
# because those paths are gitignored in the seed
git push origin main
```

This is safe because the seed's `.gitignore` excludes `storage/` and `src/components/specialized/`. The merge only touches engine files that the seed owns.

---

## Contributing engine improvements

If you discover a bug fix or engine improvement while working on a project:

```bash
# In your project repo — isolate the engine change
git checkout -b seed/fix-resolver-edge-case

# Make only engine-layer changes:
# - packages/
# - src/components/agnostic/
# - src/lib/agnostic/
# - src/app/api/
# - CLAUDE.md, README.md

# Push to your project and open a PR to the seed
git push origin seed/fix-resolver-edge-case

# On GitHub: open PR from your-org/proyecto-cliente:seed/fix-resolver-edge-case
#                        → Airhonreality/Agnostic_System_Seed:main
```

**Rule:** a PR to the seed must contain zero files from `storage/` or `src/components/specialized/`. If it does, it's a project change, not an engine change.

---

## Five Atoms

The entire system is built from exactly five concepts:

| Atom | Shape | Role |
|------|-------|------|
| **Schema** | `{ name, fields[] }` | Data shape contract |
| **Record** | `{ id, context, data }` | Instance of a schema |
| **Adapter** | `read / write / remove` | Persistence interface |
| **Block** | `{ type, context }` | Projection directive |
| **Page** | ordered blocks at a URL path | Route composition |

---

## Architecture

```
Request → layout.tsx → getVaultData() [SSR, React.cache deduplicates]
          resolveAgnosticRoute()       [pure memory, no I/O]
          AgnosticShell                [hydrates Zustand once per navigation]
          AgnosticRenderer             [routes block.type to registered component]
          /api/vault                   [only write gateway → Adapter → storage/]
```

---

## Key files

| File | Responsibility |
|------|----------------|
| `packages/core/src/indra.ts` | Canonical types — single source of truth |
| `agnostic.config.ts` | Custom block registration + engine config |
| `src/generated/agnostic-schemas.ts` | Auto-generated typed contracts |
| `src/components/specialized/_TEMPLATE.tsx` | Base pattern for AI-generated components |
| `src/lib/agnostic/resolver.ts` | Route resolver — pure memory, no I/O |
| `src/components/agnostic/engine/AgnosticRenderer.tsx` | Block type router |
| `src/app/api/vault/route.ts` | Only write gateway |
| `scripts/mcp-bridge.ts` | MCP server — semantic tools for schema/route/script CRUD |
| `CLAUDE.md` | Engine rules and anti-patterns — read before touching any code |

---

## Storage strategies

Configured in `storage/{project}/manifest.json`:

| Strategy | Use case |
|----------|----------|
| `local` | Development — JSON files in `storage/{project}/db/` |
| `supabase` | Production — Supabase cloud DB |
| `hybrid` | GitHub schemas + Supabase data |

---

## Active projects forked from this seed

| Project | Repo | Tenant |
|---------|------|--------|
| Empresa Muebles | [Airhonreality/empresa_muebles](https://github.com/Airhonreality/empresa_muebles) | `empresa-2` |

---

## Architecture decisions

- [ADR-001](docs/adr/ADR-001-blind-renderer-five-atoms.md) — Blind renderer, five atoms, invariants
- [ADR-002](docs/adr/ADR-002-seed-distribution-model.md) — Seed repo model, not multi-tenant SaaS
- [ADR-003](docs/adr/ADR-003-schema-compiler-contract.md) — Schema compiler as the stable AI contract
