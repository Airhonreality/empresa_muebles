# WP-0 Report — `agno validate:routes`

## Files Touched

| File | Action |
|------|--------|
| `scripts/agno-validate-routes.ts` | Created (new module) |
| `scripts/agno.ts` | Modified (import + dispatch case + help text) |

No other files were modified. No writes to `storage/`.

## Acceptance Criteria Results

### 1. `npx tsc --noEmit`

- No type errors introduced by the new code.
- Pre-existing error in `src/app/layout.tsx:34` (`@/lib/veta/seo/schemaGenerator` not found) is unrelated.

### 2. `npx tsx scripts/agno.ts validate:routes` (green path)

```
validate:routes
Summary: ok=true routes=1 errors=0 warnings=0
```

All types resolvable:
- `calendar_scheduler` → registered in `agnostic.config.ts` `blocks`
- Context `events` → matches schema `events` in `schema_definitions.json`
- Data file `storage/db/events.json` exists

Exit code: **0** ✅

### 3. Negative test with `--file`

Procedure:
1. Copy `storage/db/page_routes.json` to temp
2. Inject block `{"type":"tipo_inexistente"}` via `ConvertFrom-Json` + `ConvertTo-Json`
3. Run `npx tsx scripts/agno.ts validate:routes --file <tmp>`

Output:
```
validate:routes
Summary: ok=false routes=1 errors=1 warnings=0

[error] AGNO_ROUTE_UNRESOLVABLE_TYPE /calendar
  Block type "tipo_inexistente" is not registered in init.ts or agnostic.config.ts
  Fix: Register "tipo_inexistente" in src/lib/agnostic/init.ts or agnostic.config.ts
```

Exit code: **1** ✅ (real file untouched)

## Decisions Taken

- **Static regex parsing**: Extracts types from `init.ts` using `registry.register('type',` pattern and from `agnostic.config.ts` using `key: () =>` pattern inside the `blocks` object. No React/ReactDOM import required — CLI works in plain Node.
- **BOM handling**: Added `stripBom()` to `readJson()` because `storage/db/page_routes.json` has a UTF-8 BOM that causes `JSON.parse` to fail on certain PowerShell-generated temp files.
- **V3 route handling**: The walker also descends into `route.data.root` (V3 format) in addition to `route.data.blocks` (V2 format), though current routes are V2.
- **Context invariant check (bonus)**: Validates both `block.context` matches a `schema.data.name` and that `storage/db/{context}.json` exists. Both are reported as `warn` level (no exit code impact).
- **`--file` flag**: Follows the same pattern as `script export --file` for consistency.

## Questions for the Orchestrator

- The invariant `block.context === schema.data.name === nombre_de_archivo` includes the "file name" part — I implemented it as checking whether `storage/db/{context}.json` exists. Is this the correct interpretation, or should it also validate the file content matches the schema?
- Should `validate:routes` also validate V3 routes (where nodes use `kind` instead of `type`) in a future iteration?
- Pre-existing `tsc` error in `src/app/layout.tsx` is unrelated but might affect CI gates.
