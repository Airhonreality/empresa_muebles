# Empresa Muebles — Agnostic App

Custom ERP for furniture quotation and project management.
Forked from [Airhonreality/Agnostic_System_Seed](https://github.com/Airhonreality/Agnostic_System_Seed).

## Quick Start

```bash
npm install
npm run agnostic:compile
npm run dev
# → http://localhost:3000
# → Config Manager at http://localhost:3000/_agnostic
```

## Project structure

```
src/components/specialized/      ← Custom UI blocks for this project
  CotizadorPro.tsx               ← Full ERP quotation builder ("Veta de Oro")
  DataBrowser.tsx                ← Universal schema CRUD explorer
storage/empresa-2/               ← All business data and schemas
  db/
    schema_definitions.json      → all entity schemas and field definitions
    page_routes.json             → URL → block composition map
    cotizaciones.json
    espacio_variantes.json
    items_variante.json
    productos_catalogo.json
    clientes.json
    scripts.json
    ...
agnostic.config.ts               ← Registers cotizador_pro + data_browser blocks
```

## Custom blocks

| Block type | Component | Route |
|-----------|-----------|-------|
| `cotizador_pro` | CotizadorPro.tsx | `/cotizador` |
| `data_browser` | DataBrowser.tsx | `/_data/[schema]` |

## Receiving engine updates from seed

```bash
git fetch upstream
git merge upstream/main
# Safe — seed never touches storage/ or src/components/specialized/
npm install   # if package.json changed
```

## Sending engine improvements back to seed

```bash
# Only commit engine-layer files:
# packages/, src/components/agnostic/, src/lib/agnostic/, src/app/api/
git checkout -b seed/your-fix
# Make your changes, then:
git push origin seed/your-fix
# Open PR to: Airhonreality/Agnostic_System_Seed  target: main
```

## Remotes

```
origin    → https://github.com/Airhonreality/empresa_muebles      (this project)
upstream  → https://github.com/Airhonreality/Agnostic_System_Seed (seed engine)
```
