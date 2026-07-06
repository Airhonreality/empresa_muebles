# Agnostic Seed Agent Harness

AI agents working in this repo must read this file first.

## Core Model

Agnostic Seed is a Next.js schema-driven UI engine.

This repo is a seed. Each product is a fork. There is no runtime tenant selector.

```text
Engine code -> shared by forks
Project code -> custom components in the fork
Project data -> storage/ in the fork
```

## Ownership Boundaries

| Layer | Location | Owner |
|-------|----------|-------|
| Engine | `packages/`, `src/components/agnostic/`, `src/lib/agnostic/`, `src/app/api/` | Seed |
| Project UI | `src/components/specialized/`, `agnostic.config.ts` | Fork |
| Project context | `storage/` | Fork |

Do not change engine files for business-domain needs. If a project needs custom behavior, use `storage/`, zaps, or `src/components/specialized/`.

## Non-Negotiable Invariant

```text
block.context === schema.data.name === data_file_name_without_json
```

If this diverges, the engine can render nothing without an obvious error.

## Storage Contract

The local fork storage root is:

```text
storage/
  AGENTS.md
  db/
    schema_definitions.json
    page_routes.json
    scripts.json
    {entity}.json
  progreso/
    INDEX.md
    current_state.md
  fork_doc/
  docs/            # auto-generated architecture snapshots (`agno docs all`); never hand-edit
```

Use `snake_case` in block data, schema field keys, relation configs, and data namespaces.

Never reintroduce:

- `ACTIVE_TENANT`
- runtime tenant/silo selection
- `storage/{tenant}/db`
- `schemas.json` as schema source
- loose `.js` scripts under storage
- eager SSR relation catalog loading

## Required Context Loading

After reading this file, agents must check whether these fork files exist:

1. `storage/AGENTS.md`
2. `storage/progreso/current_state.md`
3. `storage/progreso/INDEX.md`

If they exist, read them before making project-specific decisions. They are the living harness of the fork.

Only read extra files from `storage/progreso/` or `storage/fork_doc/` when referenced by the fork harness or directly relevant to the task.

## Support Docs

Read these only when the task needs them:

- [Comandos CLI.md](Comandos CLI.md): use when mutating or validating `storage/`.
- [Interfaces Custom.md](Interfaces Custom.md): use when creating or changing `src/components/specialized/`.

Do not load research archives or old plans by default. Context must stay small, current, and actionable.

## Safe Operations

- Mutate storage through `agno`, MCP semantic tools, or engine APIs.
- Run `npm run agnostic:compile` after schema changes.
- Add custom blocks in `src/components/specialized/`.
- Register custom blocks in `agnostic.config.ts`.
- Keep generated types imported from `@/generated/agnostic-schemas`.

## Harness Mutation Rule

Any `agno.ts` command that mutates `storage/` or `agnostic.config.ts` beyond a single trivial record write must follow the same governed cycle as `refactor-schema`: `plan` (preview, no writes) -> `--dry` (preview, never writes) -> explicit confirmation -> automatic backup under `storage/progreso/backups/`. Do not add a command that mutates state in one uninspectable step.

## Adapter Contract

Installable integrations (data sources, messaging, payments, LLMs) are described by `AdapterManifest` (`packages/core/src/adapter.ts`). Every adapter lives at `src/integrations/<id>/` (see `notion/` as the reference shape) and is registered/unregistered only through `agno install <id>` / `agno remove-adapter <id>` — see [Comandos CLI.md](Comandos CLI.md) ("Adapters"). Non-negotiable: an adapter whose manifest declares `permissions.network !== 'none'` must run its server logic under `src/app/api/`, never inside a zap — the zap sandbox (`src/app/api/engine/route.ts`) has no `fetch`/`fs`/`process`.

## Forbidden Patterns

```typescript
context.replace('vault_', '')
context.replace('schema_', '')
{ schemaId: x, schema_id: x }
id: `block_${Date.now()}`
```

Use exact contexts, one vocabulary (`snake_case`), and `crypto.randomUUID()`.

## Engine Flow

```text
Request
  -> layout.tsx / page.tsx
  -> getVaultData()
  -> resolveAgnosticRoute()
  -> AgnosticShell
  -> AgnosticRenderer
  -> /api/vault
  -> Adapter
  -> storage/db or cloud strategy
```

## Minimal Key Files

| File | Role |
|------|------|
| `packages/core/src/indra.ts` | Canonical engine types |
| `src/core/server/vault.ts` | SSR data loader |
| `src/lib/agnostic/resolver.ts` | Pure route resolver |
| `src/components/agnostic/engine/AgnosticRenderer.tsx` | Block router |
| `src/app/api/vault/route.ts` | Write gateway |
| `src/app/api/engine/route.ts` | Zap executor |
| `scripts/agno.ts` | CLI for storage operations |

## Working Rule

Prefer deleting obsolete context over deprecating it. A fork should start with a small harness and grow only through curated `storage/progreso/INDEX.md` updates.
