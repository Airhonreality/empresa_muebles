# Agnostic Seed

Schema-driven parametric UI engine built on Next.js 15. Define data models in JSON — the engine renders them.

## Quick Start

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Core Concept

The engine (`src/`) is a **blind renderer**. It knows nothing about "clients", "invoices", or "products". All business meaning lives in the storage silo:

```
storage/{tenant}/
├── db/
│   ├── schema_definitions.json   # Entity schemas and field definitions
│   ├── page_routes.json          # URL → block composition map
│   └── {entity}.json             # One file per data collection
├── manifest.json                 # Strategy selection and tenant config
├── modules/                      # Guest UI modules (Vanilla JS only)
└── styles/tokens.css             # CSS variable overrides
```

**Rule:** to change what the app shows, edit `storage/`. Never touch `src/` for business changes.

## Five Atoms

The entire system is built from exactly five concepts:

| Atom | Definition |
|---|---|
| **Schema** | Data shape contract. `{ name, fields[] }` |
| **Record** | Instance of a schema. `{ id, data }` |
| **Adapter** | Persistence interface. `read / write / remove` |
| **Block** | Projection directive. `{ type, schema_id, context }` |
| **Page** | Ordered list of blocks at a URL path |

The invariant that must always hold: `block.context === schema.data.name === data_file_name`.

## Architecture

```
Request → layout.tsx → getVaultData()
          MasterRoute → resolveAgnosticRoute()
          AgnosticRenderer → maps block types to components
          /api/vault → only write gateway → Adapter → storage/
```

## Key Files

| Concern | File |
|---|---|
| Canonical types | `packages/core/src/indra.ts` |
| Only write gateway | `src/app/api/vault/route.ts` |
| Route resolver | `src/lib/agnostic/resolver.ts` |
| Block router | `src/components/agnostic/engine/AgnosticRenderer.tsx` |
| Strategy selection | `src/server/getStrategy.ts` |
| Parametric Designer | `/schema` route → `AgnosticDesigner.tsx` |

## MCP Bridge

Semantic AI interface — 17 intent-driven tools:

```bash
npm run mcp:bridge    # stdio JSON-RPC server (registered in .mcp.json)
```

## Storage Strategies

Configured in `storage/{tenant}/manifest.json`:

| Strategy | Use case |
|---|---|
| `local` | Development, JSON files |
| `supabase` | Production cloud DB |
| `hybrid` | GitHub DNA + Supabase data |

## Docs

- [`CLAUDE.md`](CLAUDE.md) — Engine invariants and anti-patterns. **Read before touching any code.**
- [`docs/AXIOMATIC_DESIGN.md`](docs/AXIOMATIC_DESIGN.md) — Axiomatic Design (Nam P. Suh) applied.
- [`docs/INFRASTRUCTURE.md`](docs/INFRASTRUCTURE.md) — Storage strategies and deployment.
