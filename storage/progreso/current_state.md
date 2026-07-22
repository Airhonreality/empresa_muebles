# Current State

## Summary

This repository is the Agnostic Seed baseline after documentation purification.

The canonical model is:

```text
seed repo -> project forks
engine -> domain-blind
fork -> owns storage and specialized UI
```

## Definition Lifecycle Evolution — 2026-07-17

- `schema_definitions`, `page_routes`, and `scripts` keep their existing formats.
- Added explicit `legacy`, `shadow`, and `revision` modes.
- Existing forks remain in `legacy` until an explicit migration.
- Revision mode reads one validated, content-addressed bundle and activates it with compare-and-set.
- Filesystem, Postgres, GitHub, and Supabase revision stores are implemented.
- SSR, Vault, zaps, CLI, MCP, pulse, history, and refactoring paths are definition-aware.
- Production revision mode requires a tracked snapshot and matching `AGNOSTIC_DEFINITION_REVISION`.
- `storage/db/scripts.json` now exists as the required empty canonical registry in the seed.

Engine reference: `src/docs/DEFINITION_LIFECYCLE.md`.

## Daily Closeout

Date: 2026-07-02

Work completed today:

- Hardened text encoding validation and the fork sync flow in the seed.
- Synced the engine into the active forks:
  - `empresa_muebles_clone`
  - `HUG_WORKS`
  - `Airhon_web_site`
- Left `nomon_clone` synced locally but blocked on publish because its `origin` remote points to a missing repository.
- Confirmed the repository ignores the top-level `/progreso/` path in Git.
- Confirmed `storage/progreso/` is intentionally tracked because the harness uses it as live project context.
- Kept fork-specific progress separate from engine code paths and avoided changing fork business logic while syncing the engine.
- Closed a half-finished migration: generated architecture snapshots (`agno docs all`) now live under `storage/docs/`, not `storage/progreso/`. Removed the 5 stale duplicate `.md` files left behind in `storage/progreso/` and realigned `Comandos CLI.md`, `storage/AGENTS.md`, and root `CLAUDE.md` to the new path.
- Documented the `cli-reporter.ts` / `storage-repository.ts` primitives as the required pattern for new `agno.ts` commands, and formalized the existing `plan -> dry -> confirm -> backup` mutation cycle (used by `refactor-schema`) as the required pattern for any future command that mutates `storage/` or `agnostic.config.ts`.
- Built the adapter subsystem: `AdapterManifest` type (`packages/core/src/adapter.ts`), `notion` retrofitted with a reference `manifest.ts`, `src/lib/integrations/adapters.server.ts` rewritten from a hardcoded per-id switch to a declarative `REGISTRY` maintained by the CLI, and three governed commands (`list-adapters`, `install`, `remove-adapter`) in `scripts/agno-adapters.ts` with a collision resolver ("risky siblings": already-installed, env-key collisions, missing required schemas, unset env vars) and a hard rule rejecting adapters that claim network access without `runsOutsideSandbox: true`. Verified with a full remove/install round-trip (byte-identical `adapters.server.ts`, cosmetic-only line-ending diff in `agnostic.config.ts`) and a clean `tsc --noEmit`. Also fixed a pre-existing bug where `IntegrationsSection.tsx` posted the wrong payload shape to `/api/admin/config/save`, and excluded `storage/progreso/backups/` from `tsconfig.json` (backups of `agnostic.config.ts` were being type-checked as if they lived at the repo root).

## Current Contract

- No runtime multi-tenant selector.
- Local JSON data lives in `storage/db/`.
- Schemas are defined in `storage/db/schema_definitions.json`.
- Routes are defined in `storage/db/page_routes.json`.
- Zaps are records in `storage/db/scripts.json`.
- `system_groups` is an optional metadata namespace for organizing routes, schemas, and scripts by subsystem.
- Project progress and audits live under `storage/progreso/`.
- Fork documentation lives under `storage/fork_doc/`.
- Agent-facing generated docs (auto-regenerated architecture snapshots) live under `storage/docs/`.
- The top-level `/progreso/` path is ignored by Git and is not part of the tracked seed context.
- `storage/progreso/` remains tracked on purpose so the fork harness stays available.

## Current CLI Additions

- `npx tsx scripts/agno.ts docs all` generates compact schema, zap, route, module, and agent summary docs.
- `npx tsx scripts/agno.ts validate:zaps` checks Zap API namespace references against storage schemas/files.
- `npx tsx scripts/agno.ts refactor-schema plan <old> <new>` previews safe namespace refactors before apply.
- `npx tsx scripts/agno.ts bootstrap doctor` reports production bootstrap blockers without mutating cloud resources.
- `npx tsx scripts/agno.ts bootstrap install` initializes local non-versioned bootstrap state in `.agno/bootstrap-state.json`.
- In production, first admin creation is blocked unless the active persistence strategy is `postgres` and `SESSION_SECRET` exists.
- User passwords are normalized server-side to `password_hash` using Node `scrypt`; legacy plaintext `password` records are accepted only for login migration.

## Next Fork Action

When this seed is forked, update:

1. `storage/AGENTS.md`
2. `storage/progreso/current_state.md`
3. `storage/fork_doc/README.md`

Keep only current, useful context in these files.
