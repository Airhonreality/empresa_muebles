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

## Next Fork Action

When this seed is forked, update:

1. `storage/AGENTS.md`
2. `storage/progreso/current_state.md`
3. `storage/fork_doc/README.md`

Keep only current, useful context in these files.
