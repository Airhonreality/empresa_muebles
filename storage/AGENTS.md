# Fork Agent Harness

This file belongs to the fork layer. Update it in each project fork.

## Project Identity

Name: Agnostic Seed

Purpose: base seed for schema-driven project forks.

Business domain: none in the seed. Real domain meaning must be added by each fork.

## Fork Context Rules

- Treat `storage/` as the project-owned context root.
- Treat `storage/db/` as the data contract root.
- Keep all namespace names in `snake_case`.
- Keep `block.context`, `schema.data.name`, and `{namespace}.json` aligned.
- Do not add runtime tenant selection.
- Do not store loose JavaScript files under `storage/`; zaps live in `storage/db/scripts.json`.

## Required Reading For Project Work

Agents should read these files after this one when they exist:

1. `storage/progreso/current_state.md`
2. `storage/progreso/INDEX.md`
3. Files referenced by `storage/progreso/INDEX.md` as active

Do not read every historical note by default.

## Project-Owned Areas

```text
storage/db/                 data, schemas, routes, scripts
storage/progreso/           current plans, audits, progress notes
storage/fork_doc/           human-facing fork documentation
src/components/specialized/ custom UI blocks
agnostic.config.ts          custom block registration
```

## Seed Baseline

The seed starts with no project schemas. A fork should create its own `schema_definitions.json`, `page_routes.json`, and records through `agno` or MCP semantic tools.
