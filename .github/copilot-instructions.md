# GitHub Copilot Instructions — Agnostic Seed

## Hard rules

- **NEVER write `storage/**/*.json` directly.** Use `npm run mcp:bridge` tools.
- **NEVER edit `src/components/agnostic/`, `packages/`, or `src/generated/`.**
- **NEVER use camelCase** in schema field keys, block data, or relation configs. snake_case always.
- **NEVER generate IDs** with `Math.random()` or `Date.now()`. Use `crypto.randomUUID()`.

## Mutation gateway for storage/

```bash
npm run mcp:bridge
# create_schema | update_schema | create_route | update_route | write_script
# list_schemas  | get_schema    | list_routes  | get_route    | list_scripts
```

## The invariant

`block.context === schema.data.name === filename_without_json`

## Where to write new code

- Custom UI blocks → `src/components/specialized/` (default export, extend `_TEMPLATE.tsx`)
- Block registration → `agnostic.config.ts`
- Everything else → use MCP bridge, not file writes

## Full rules and prompting guide

See `docs/agent-protocol/AGENT_RULES.md` and `docs/agent-protocol/PROMPTING_GUIDE.md`.
