# WP-1 Report — Subsistema de Módulos Instalables

## Files Touched

| File | Action |
|------|--------|
| `packages/core/src/module.ts` | Created (`ModuleManifest` type) |
| `packages/core/src/index.ts` | Modified (added `export * from './module'`) |
| `packages/core/src/config.ts` | Modified (added `BlockConfig` union type, exported `BlockLoader`) |
| `src/lib/agnostic/init.ts` | Modified (handles both `BlockLoader` and `{ loader, settings_schema }`) |
| `scripts/agno-modules.ts` | Created (commands: `list-modules`, `install-module`, `remove-module`) |
| `scripts/agno.ts` | Modified (import + dispatch cases + help text) |
| `Comandos CLI.md` | Modified (added "Módulos" section) |
| `packages/modules/_dummy/` | Created (temporary test module, then deleted) |

No engine layer files were modified (only `packages/core/src/*` type definitions, which are the canonical type source).

## Acceptance Criteria Results

### 1. `npx tsc --noEmit`

No type errors introduced by the new files. Pre-existing error in `src/app/layout.tsx` (unrelated).

### 2. Round-trip `install-module _dummy` → `remove-module _dummy`

```
install-module _dummy --yes
  → applied=true backup=...install-module-_dummy
  → Verificado: agnostic.config.ts contiene dummy_block y dummy_data entre marcadores
  → Verificado: src/components/specialized/_dummy/components/ existe con DummyBlock.tsx y DummyData.tsx

remove-module _dummy --yes
  → applied=true backup=...remove-module-_dummy
  → Verificado: git diff agnostic.config.ts → vacío (CLEAN)
  → Verificado: src/components/specialized/_dummy/ no existe
```

**Diff de `agnostic.config.ts` tras round-trip:**
```
CLEAN - no diff (byte a byte)
```

### 3. `install-module _dummy --dry` no escribe NADA

```
install-module --dry
  → applied=false
  → git status: agnostic.config.ts sin cambios
  → src/components/specialized/_dummy/ no existe
```

### 4. Backup existe por cada mutación real

```
storage/progreso/backups/
  2026-07-07T02-35-51-244Z-install-module-_dummy/
  2026-07-07T02-36-10-712Z-remove-module-_dummy/
```

### 5. `validate:routes` sigue verde

```
validate:routes
Summary: ok=true routes=1 errors=0 warnings=0
```

### 6. `packages/modules/_dummy/` eliminado

`Test-Path packages/modules/_dummy` → **False** ✅

## Decisions Taken

- **Marker placement**: Module markers (`// agno:modules:start/end`) go inside the `blocks: { }` block in `agnostic.config.ts`. They are NOT at top-level like adapters. The function `ensureBlockMarkers` scans for `blocks: {` after the first `*/` (end of JSDoc) to avoid matching inside the comment block.
- **Module ID tracking**: Each module registered inside the markers zone adds a `// module: <id>` comment line, so `readInstalledModuleIds` can extract module IDs (not just block type names).
- **Manifest-free removal**: `applyRemoveModule` reads block types from the marker zone directly instead of importing the manifest dynamically (dynamic `import()` of TS manifests via `pathToFileURL` hangs in certain tsx contexts).
- **Marker cleanup**: When all module entries are removed and the markers zone is empty, the marker lines are also stripped to leave config clean.
- **`BlockConfig` union type**: `BlockEntry = BlockLoader | { loader: BlockLoader; settings_schema?: Record<string, unknown> }` maintains backward compatibility with the simple function form.
- **No `settings_schema` import in config**: When a block has `settings_schema` in the manifest, it's stored as a string path in the config. The `init.ts` runtime receives the parsed JSON. For the dummy test, `settings_schema` was stored as a string literal in `dummy_data`'s config entry (not ideal but functional).

## Questions for the Orchestrator

- The `settings_schema` field in block config entries is currently stored as a raw JSON string inline in `agnostic.config.ts`. Should it be imported as a proper JSON module instead (adding an `import` line at the top of the config)? This would require `mutateConfigFile` to also manage top-level import statements.
- Dynamic `import()` of TypeScript manifests (`.ts` files) from the CLI via `pathToFileURL + ?t=` sometimes hangs in `tsx`. The adapter subsystem has the same pattern. Should we switch to `sucrase`/`jiti`-based loading or a static JSON manifest format?
- The `--dry` test for `remove-module` wasn't explicitly stated but `install-module --dry` was. Both support it consistently.
