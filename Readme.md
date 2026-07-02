# Agnostic System Seed

Schema-driven UI engine built on Next.js 15. Define data models, routes, and automations in storage; build custom interfaces in project forks using typed schema contracts.

**This is the seed.** Every client project is a separate repo that forks from here. The engine lives here. Business logic never does.

## Two Roles

| You are... | Your repo is... | Main workflow |
|-----------|----------------|---------------|
| Building a new project | A fork of this seed | Customize `storage/`, `src/components/specialized/`, and `agnostic.config.ts` |
| Improving the engine | This seed repo | Change engine-owned files and merge updates into forks deliberately |

## Starting A New Project

### 1. Clone the seed into your project repo

```bash
git clone https://github.com/Airhonreality/Agnostic_System_Seed.git proyecto-cliente
cd proyecto-cliente

git remote set-url origin https://github.com/your-org/proyecto-cliente.git
git remote add upstream https://github.com/Airhonreality/Agnostic_System_Seed.git

git push -u origin main
```

### 2. Install and boot

```bash
npm install
npm run agnostic:compile
npm run dev
```

### 3. Create project storage

Each fork owns exactly one local storage root:

```text
storage/
  db/
    schema_definitions.json
    page_routes.json
    scripts.json
    {entity}.json
  styles/tokens.css
  assets/
```

The default local adapter reads `storage/db/*.json`. Do not create runtime tenants or edit `src/server/activeProject.ts` for project selection.

### 4. Build custom UI blocks

Give AI these files as context:

```text
src/generated/agnostic-schemas.ts
src/components/specialized/_TEMPLATE.tsx
agnostic.config.ts
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

Set `"type": "your_block"` in `storage/db/page_routes.json`.

## What Lives Where

```text
packages/                    <- ENGINE: never touch for project changes
src/
  components/
    agnostic/                <- ENGINE UI
    specialized/             <- PROJECT custom blocks
  generated/                 <- AUTO-GENERATED schema types
agnostic.config.ts           <- PROJECT bridge for custom block registration
storage/                     <- PROJECT data, styles, assets
  AGENTS.md                  <- fork-specific agent harness
  db/
    schema_definitions.json  <- entity definitions + field types
    page_routes.json         <- URL -> block composition map
    scripts.json             <- zap automations
    {entity}.json            <- one file per data collection
  progreso/                  <- active progress, audits, plans
  fork_doc/                  <- human-facing fork documentation
```

The invariant that must never break:

```text
block.context === schema.data.name === data_file_name_without_json
```

## Architecture

```text
Request
  -> layout.tsx
  -> getVaultData()
  -> resolveAgnosticRoute()
  -> AgnosticShell
  -> AgnosticRenderer
  -> /api/vault -> Adapter -> storage/db or cloud strategy
```

## Storage Strategies

Strategies are selected by deployment environment variables, not by runtime tenant selection.

| Env vars | Strategy | Use case |
|----------|----------|----------|
| none | `local` | Development JSON files in `storage/db/` |
| `GITHUB_REPO` | `github` | Git-backed JSON files in `storage/db/` |
| `DATABASE_URL` | `postgres` | Neon, Supabase Postgres, Railway, Render |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | `supabase` | Legacy Supabase REST strategy |

## Receiving Engine Updates

Project forks receive engine updates deliberately:

```bash
git fetch upstream
git merge upstream/main
git push origin main
```

The merge should not touch project-owned paths such as `storage/` or `src/components/specialized/`.

## Contributing Engine Improvements

A PR to the seed must contain engine changes only. It should not include project-specific storage, custom blocks, or business-domain code.

Engine-owned paths include:

```text
packages/
src/components/agnostic/
src/lib/agnostic/
src/app/api/
scripts/
```

Project-owned paths include:

```text
storage/
src/components/specialized/
agnostic.config.ts
```

## Agent Harness

The seed keeps agent context intentionally small:

```text
AGENTS.md              <- engine rules and context loading protocol
CLAUDE.md              <- compatibility copy of AGENTS.md
Comandos CLI.md        <- read only for storage CLI work
Interfaces Custom.md   <- read only for specialized UI work
agnostic.context.json  <- machine-readable engine contract
```

Each fork owns its living context in:

```text
storage/AGENTS.md
storage/progreso/current_state.md
storage/progreso/INDEX.md
storage/fork_doc/
```

Agents should read the root `AGENTS.md` first, then the fork harness in `storage/` when it exists. Old plans, audits, and research notes should not live in the seed.

## Five Atoms

| Atom | Shape | Role |
|------|-------|------|
| Schema | `{ name, fields[] }` | Data shape contract |
| Record | `{ id, context, data }` | Instance of a schema |
| Adapter | `read / write / remove` | Persistence interface |
| Block | `{ type, context }` | Projection directive |
| Page | ordered blocks at a URL path | Route composition |

## Key Files

| File | Responsibility |
|------|----------------|
| `packages/core/src/indra.ts` | Canonical engine types |
| `agnostic.config.ts` | Custom block registration |
| `src/generated/agnostic-schemas.ts` | Auto-generated project schema types |
| `src/components/specialized/_TEMPLATE.tsx` | Base pattern for custom blocks |
| `src/lib/agnostic/resolver.ts` | Pure route resolver |
| `src/components/agnostic/engine/AgnosticRenderer.tsx` | Block type router |
| `src/app/api/vault/route.ts` | Only write gateway |
| `scripts/mcp-bridge.ts` | Semantic MCP tools |
| `AGENTS.md` | Agent operating rules |

## Architecture Decisions

The current architectural contract is captured in `AGENTS.md`, `agnostic.context.json`, and this README. Historical plans and old ADRs were removed to keep the seed context minimal.
