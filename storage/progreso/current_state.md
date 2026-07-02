# Current State

## Summary

This repository is the Agnostic Seed baseline after documentation purification.

The canonical model is:

```text
seed repo -> project forks
engine -> domain-blind
fork -> owns storage and specialized UI
```

## Current Contract

- No runtime multi-tenant selector.
- Local JSON data lives in `storage/db/`.
- Schemas are defined in `storage/db/schema_definitions.json`.
- Routes are defined in `storage/db/page_routes.json`.
- Zaps are records in `storage/db/scripts.json`.
- Project progress and audits live under `storage/progreso/`.
- Fork documentation lives under `storage/fork_doc/`.
- Agent-facing generated docs live under `storage/progreso/`.

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
