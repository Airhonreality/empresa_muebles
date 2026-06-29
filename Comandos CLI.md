# Comandos CLI

Manual operativo minimo para trabajar con `storage/` usando `agno`.

## Regla Principal

No edites `storage/**/*.json` a mano. Usa `agno`, MCP semantic tools o APIs del engine.

Por que: el engine depende de invariantes estrictos. Un JSON valido pero incoherente puede hacer que el renderer no muestre nada.

## Contexto Minimo

Antes de mutar storage, lee:

1. `AGENTS.md`
2. `storage/AGENTS.md`
3. `storage/progreso/current_state.md`
4. este documento

Lee otros documentos solo si `storage/progreso/INDEX.md` los marca como activos o si la tarea los pide.

## Invocacion

```bash
npx tsx scripts/agno.ts context
npx tsx scripts/agno.ts validate
npx tsx scripts/agno.ts create-schema proveedores field:nombre:text field:nit:text
npx tsx scripts/agno.ts
```

Con `.env.local`:

```bash
npx tsx --env-file=.env.local scripts/agno.ts context
```

Si `DATABASE_URL` no esta cargada, el sistema usa `LocalStrategy` y lee `storage/db/*.json`.

## Lectura

```text
context                          snapshot completo
diff-env                         compara local vs nube
block-types                      tipos de bloque disponibles
block-schema <type>              parametros de un bloque
list-navs                        navbars registradas
ls                               resumen schemas/routes/scripts
schema <name>                    campos de un schema
schema id <name>                 id del schema
route <path>                     bloques de una ruta
ui <path>                        arbol visual completo
records <schema> [limit=5]       registros con preview
script <name>                    codigo de un script
validate                         valida invariantes
```

## Bloques Y Rutas

```text
create-route <path> <titulo>
create-page <path> <titulo> [template:blank|landing|data-<schema>]
scaffold <schema> [route:/path]
add-block <ruta> <type> [context:<s>] [visual:key=val] [config:key=val]
add-child <ruta> <parentId> <type> [visual:key=val]
update-block <ruta> <blockId> <prop> <valor>
set-visual <ruta> <blockId> <key> <valor>
get-block <ruta> <blockId>
list-children <ruta> <blockId>
remove-block <ruta> <blockId>
remove-child <ruta> <parentId> <childId>
patch-blocks <key> <valor> [--type=frame] [--route=/inicio] [--dry]
```

## Schemas

```text
create-schema <name> [field:key:type:label ...]
add-field <schema> <key> <type> [label:<l>] [required] [options:a,b,c] [entity:<schema>]
remove-field <schema> <key>
delete-schema <name>
set <schema>.<field>.<prop> <valor>
```

Despues de cambiar schemas:

```bash
npm run agnostic:compile
```

## Datos

```text
create-record <schema> [key=val ...]
update-record <schema> <id> [key=val ...]
delete-record <schema> <id>
delete-route <path>
```

## Scripts Zap

Los scripts viven como registros en `storage/db/scripts.json`. No existen archivos `.js` sueltos bajo `storage/`.

```text
script <name>                       ver codigo
script write <name> --file ruta.js  importar desde archivo
script export <name> --file ruta.js exportar para editar en IDE
```

API disponible dentro de un Zap:

```javascript
const records = await api.query('namespace')

await api.saveItem('namespace', {
  id: 'existing-id',
  data: { campo: 'valor' }
})

api.notify.success('Operacion completada')
api.notify.error('Algo fallo')

api.dispatchEvent('print_pdf', { html })
api.dispatchEvent('download_pdf', { template, inputs, filename })
api.dispatchEvent('download_file', { content, filename, mimeType })
api.dispatchEvent('redirect', { path: '/ruta' })
api.dispatchEvent('open_url', { url, target })
api.dispatchEvent('clipboard', { text })
```

Limites del sandbox: timeout 5 segundos, sin `fetch`, `fs`, `process` ni binarios nativos.

## Produccion

No conectes `localhost` a una base productiva con permisos de escritura.

Patrones seguros:

- Database branching: usa una rama dev de Neon/Postgres.
- Offline JSON: sin `DATABASE_URL`, trabaja contra `storage/db/*.json`.

Para subir un registro especifico a produccion:

```bash
npm run push-data scripts mi_zap_nombre
npm run push-data templates mi_plantilla_nombre
```

Requiere `PRODUCTION_URL` y `API_SECRET_KEY`.
