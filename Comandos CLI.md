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
validate --zaps                  valida invariantes y referencias de zaps
validate:zaps                    valida namespaces referenciados por zaps
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
validate:zaps                       analiza api.query/saveItem/removeItem
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

## Refactor Semantico

Los cambios de nombre de namespaces deben hacerse con plan previo. No uses reemplazo global manual.

```text
refactor-schema plan <old_name> <new_name>
refactor-schema apply <old_name> <new_name>
```

`plan` muestra los cambios detectados sin escribir archivos.

`apply` ejecuta solo transformaciones conservadoras:

- `schema_definitions.json`: `data.name`, `data.slug` y `context` cuando coinciden exactamente.
- `page_routes.json`: strings exactos en contexts/configs.
- `app_navbars.json`: strings exactos cuando el archivo existe.
- `scripts.json`: literales exactos usados en `api.query`, `api.saveItem`, `api.removeItem` y `api.dispatchEvent`.
- `storage/db/{old_name}.json`: renombra el archivo si `{new_name}.json` no existe.

No renombra fields ni relaciones como `cotizacion_id -> proyecto_id`; eso requiere un refactor de field explicito.

## Documentacion Agentiva

Estos comandos generan indices versionables en `storage/progreso/`. No reemplazan la fuente canonica en `storage/db/`; solo crean contexto compacto para agentes IA y revisiones humanas.

```text
docs schemas             genera storage/progreso/arbol_de_schemas.md
docs zaps                genera storage/progreso/arbol_de_zaps.md
docs routes              genera storage/progreso/arbol_de_rutas.md
docs modules             genera storage/progreso/arbol_de_modulos.md
docs all                 genera todos los arboles y resumen_agentivo.md
```

Uso recomendado despues de cambios estructurales:

```bash
npx tsx scripts/agno.ts docs all
```

Los documentos generados deben mantenerse pequenos:

- schemas: nombre del schema y field keys.
- zaps: indice, namespaces detectados y eventos dispatch.
- routes: path, rol requerido y arbol de bloques.
- modules: archivos TS/TSX especializados, exports, imports y namespaces detectables.

## Bootstrap Produccion

Primera fase del instalador secuencial. Estos comandos son no destructivos y preparan el flujo para desplegar una app gobernable sin crear usuarios fantasma.

```text
bootstrap install        inicia .agno/bootstrap-state.json local
bootstrap resume         continua el instalador
bootstrap status         muestra el estado local del instalador
bootstrap doctor         diagnostico no destructivo
bootstrap verify         doctor local + health remoto si PRODUCTION_URL/Netlify estan cargados
```

El estado local vive en `.agno/bootstrap-state.json` y no se versiona. No debe guardar secretos.

Orden objetivo del instalador:

```text
preflight local
github push
netlify site/env/deploy
neon DATABASE_URL pooled/serverless
cloudflare r2
SESSION_SECRET + API_SECRET_KEY
migracion storage/db -> postgres
primer admin en /login
verify final
```

El primer usuario admin solo debe habilitarse cuando produccion ya usa la persistencia final. En produccion, `/api/auth/bootstrap` rechaza la creacion del admin si la estrategia activa no es `postgres` o si falta `SESSION_SECRET`.

Las contrasenas de usuarios se guardan como `password_hash` con algoritmo `scrypt`. El login aun acepta registros legacy con `password` en texto plano y los reescribe como hash despues de un login correcto.

Fases siguientes previstas:

```text
bootstrap admin          abrir /login y esperar creacion del primer admin
bootstrap dev-db         crear rama dev de Neon desde produccion
bootstrap migrate        migrar storage/db a Postgres desde CLI
```

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
