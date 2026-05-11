# Agnostic Seed — CLAUDE.md

## What this repo is

A schema-driven, multi-tenant UI framework built on Next.js 15. The engine (`src/`) is a blind renderer. All business entities, routes, and UI modules live in `storage/{tenant}/`. You never hardcode entity names in engine code.

## Before any code change

1. Read `agnostic.context.json` — the machine-readable architectural contract.
2. Check `packages/core/src/indra.ts` — canonical type definitions. If a type is not there, it doesn't exist.

---

## Critical Rules

### Identity — UUID-first, always
- Every record's stable identity is its `id` (UUID v4), assigned by `/api/vault` before write.
- `_slug` is derived from the record name and used **only for URLs**. It is mutable.
- Never use `_slug` for filtering, FK references, or internal state.
- Never generate UUIDs on the client. The vault does it.

### State — two layers, different timing
- `usePageRecord()` → synchronous, computed via `useMemo` in `MasterRoute`. **Use this first.**
- `state.system.activeRecord` → async, one render behind (reducer). Use for custom modules.
- `state.system.activeContext` defaults to `'system'` and means nothing without `activeRecord`.

### Persistence — one gateway, atomic writes
- All mutations go through `POST /api/vault`. Never write to `storage/` from components.
- The vault reads existing items → upserts → writes. Never overwrites the full collection.
- `LocalStrategy.writeContext()` uses write-to-temp + rename for atomicity.

### Schemas — no prefix
- Schema names in `schema_definitions.json` are plain entity names: `projects`, not `schema_projects`.
- `schemaId` prop, `context` prop, and `data.name` in `schema_definitions` all refer to the same string.
- Child schemas declare their FK via `relation: { foreignKey, parentContext }`. `AgnosticCollection` reads this automatically.

### Modules — Vanilla JS, bridge-only
- Guest modules in `storage/{tenant}/modules/` must be pure Vanilla JS. No React imports.
- They communicate exclusively through `AgnosticAPI` (the bridge pattern). No direct DOM or fetch calls.

### Architecture — never cross the boundary
- Never add business logic to `src/`. It belongs in `storage/{tenant}/`.
- Never hardcode entity names (`projects`, `users`, etc.) in engine components.
- Never import from `src/app/[...slug]/page.tsx`. Export shared hooks from `src/context/`.
- Never remove the `useEffect` activeRecord sync in `MasterRoute` — custom modules depend on the reducer state.

---

## Key files map

| Concern | File |
|---|---|
| Canonical types | `packages/core/src/indra.ts` |
| Bridge / AgnosticAPI | `packages/core/src/bridge.ts` |
| Global state | `src/context/AppContext.tsx` |
| Only mutation gateway | `src/app/api/vault/route.ts` |
| Strategy resolution | `src/server/getStrategy.ts` |
| Block router | `src/components/agnostic/engine/AgnosticRenderer.tsx` |
| Tenant config | `storage/{tenant}/manifest.json` |
