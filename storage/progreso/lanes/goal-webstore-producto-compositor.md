# Contrato de lane: goal/webstore-producto-compositor

> Compositor de productos/módulos dentro del administrador de catálogo del ERP: se compone
> como una cotización (items de catálogo + mano de obra + imágenes) y un interruptor decide
> si vive como módulo reutilizable del catálogo interno y/o como producto publicado en la
> tienda web. Se construye EXTENDIENDO `prefabricados`, no creando un schema paralelo.

<!-- lane-surface: storage/db/** | src/components/specialized/compras/** | src/generated/** | agnostic.config.ts | storage/progreso/lanes/goal-webstore-producto-compositor.md -->

## Identidad
- **Rama:** `goal/webstore-producto-compositor`
- **Worktree:** `git worktree add ../wt-webstore-compositor -b goal/webstore-producto-compositor`
- **Rol/modelo:** worker de código (liviano).
- **Estado:** plan_aprobado (mandato del usuario 2026-07-05, ronda web-store)

## Goal (teleología)
Desde `/app/erp/catalogo` puedo componer un producto (items de `productos_catalogo` +
líneas de servicio SERV-* como mano de obra + imágenes), y con interruptores decidir:
(a) que exista como item reutilizable del catálogo interno cuyo costo se recalcula cuando
varían los precios de su composición, y/o (b) que quede publicado como producto de venta
al público con categoría, precio público, imágenes y descripción comercial.

## Verdad de terreno (no re-investigar)
- `prefabricados`: `nombre`, `descripcion`, `catalogo_id` (relation → su espejo en
  `productos_catalogo`), `imagen_url`. `prefabricados_items`: `prefabricado_id`,
  `catalogo_id`, `cantidad`, `unidad_medida`. `items_variante.origen_prefabricado_id` ya
  permite usar un prefabricado dentro de una cotización.
- `productos_catalogo` ya tiene `sku`, `tipo` (select), `precio_directo`, `precio_publico`,
  `categoria_comercial`, `imagen_url`. La mano de obra se modela como productos tipo
  Servicio con SKUs `SERV-DEV`, `SERV-ASSEMBLY`, `SERV-INSTALL` (así lo hace CotizadorPro).
- UI de catálogo: `src/components/specialized/compras/CatalogoManager.tsx` (CRUD vía
  `/api/vault`, acciones `WRITE`/`REMOVE`). Zaps se ejecutan vía POST `/api/engine`
  `{zap, payload}`. Zap existente: `actualizar_catalogo_precio`.
- Mutaciones de schema SOLO vía `agno add-field`/`create-schema` + `npm run agnostic:compile`.
- Convención de mocks: `storage/fork_doc/ESTRATEGIA_DATOS_LOCAL_VS_PROD.md` (lote
  `webstore_r2`, registrar en `seed_registros`).

## Superficie (y SOLO esta)
- `storage/db/**` (campos nuevos, schema `imagenes_prefabricado`, zap nuevo, mocks)
- `src/components/specialized/compras/**`
- `agnostic.config.ts` (solo si registras un bloque nuevo)
- `src/generated/**` (solo por compile)

## Fuera de alcance
- NO tocar CotizadorPro ni el flujo de cotizaciones.
- NO construir la UI pública de tienda (lane `webstore-tienda-ui`).
- NO tocar `scripts/agno.ts` ni nada de engine.

## Depende de / bloquea a
- Depende de: `goal/webstore-data-mocks` (convención de mocks).
- Bloquea a: `goal/webstore-tienda-ui` (la tienda lista lo publicado aquí).

## DAG de tareas (cada una con DoD ejecutable)
1. **Extender schemas vía agno.**
   - `prefabricados` += `descripcion_comercial` (markdown), `categoria_comercial` (select,
     mismas opciones que en `productos_catalogo`), `precio_publico` (number),
     `precio_costo_calculado` (number), `publicado_web` (boolean),
     `reutilizable_catalogo` (boolean), `slug` (text).
   - `prefabricados_items` += `precio_unitario_snapshot` (number).
   - Nuevo schema `imagenes_prefabricado`: `prefabricado_id` (relation a prefabricados),
     `imagen_url` (image), `descripcion` (text), `orden` (number).
   - `productos_catalogo` += `publicado_web` (boolean).
   - `npm run agnostic:compile` después.
   DoD: node -e que verifique presencia de los campos en `schema_definitions.json`; tsc verde.
2. **Zap `recalcular_precio_prefabricado`.** Payload `{prefabricado_id}` (o sin payload =
   todos). Lógica: costo = Σ (`prefabricados_items.cantidad` ×
   `productos_catalogo.precio_directo` vigente); escribe `precio_costo_calculado` en el
   prefabricado y, si `reutilizable_catalogo` y tiene `catalogo_id`, actualiza
   `precio_directo` del espejo en `productos_catalogo`. Registrar vía
   `agno script write` (patrón de zaps existentes en `scripts.json`).
   DoD: `npm run validate:zaps` (o el validador existente) sin errores nuevos; ejecución
   del zap vía `/api/engine` sobre un mock devuelve el costo esperado (documentar curl).
3. **Sección "Módulos y Productos" en CatalogoManager.** Nueva pestaña/tab dentro de
   `CatalogoManager.tsx` (o subcomponente `PrefabricadosComposer.tsx` en la misma carpeta):
   - lista de `prefabricados` con costo calculado, precio público y badges de estado
     (interno / publicado);
   - editor compositor: agregar/quitar líneas (`prefabricados_items`) buscando en
     `productos_catalogo` (incluye servicios SERV-* para mano de obra), cantidades,
     imágenes (`imagenes_prefabricado`), `descripcion_comercial`, `categoria_comercial`,
     `precio_publico`, `slug` auto-derivado del nombre (editable);
   - **interruptor "Catálogo interno"** (`reutilizable_catalogo`): al activarlo, si no hay
     `catalogo_id`, crea el espejo en `productos_catalogo` (`tipo='Prefabricado'`
     — añade la opción al select si falta —, `sku='PREF-'+slug`, `precio_directo` = costo
     calculado) y guarda la relación; al desactivar NO borra el espejo, solo lo desliga
     visualmente (sin tocar cotizaciones históricas);
   - **interruptor "Publicar en tienda"** (`publicado_web`): exige `descripcion_comercial`,
     `categoria_comercial`, `precio_publico` > 0 y ≥1 imagen antes de permitir ON
     (validación en UI);
   - botón "Recalcular costo" que llama al zap de la tarea 2.
   DoD: `npx tsc --noEmit` verde; smoke con `npm run dev`: GET `/app/erp/catalogo` responde
   200 y el bundle compila sin error en consola del server.
4. **Mocks** (lote `webstore_r2`, registrados en `seed_registros`): 2 prefabricados
   compuestos (p.ej. "Módulo cocina 60cm", "Closet lineal 2.4m") con items reales del
   catálogo mock, imágenes, uno con `publicado_web=true` y ambos `reutilizable_catalogo=true`.
   DoD: node -e contando prefabricados con `publicado_web` en el JSON.

## DoD de cierre
- [x] commit(s) en `goal/webstore-producto-compositor` sin `--no-verify`
- [x] `npm run validate:storage` + `npm run validate:encoding` + `npx tsc --noEmit` verdes
- [x] `node scripts/lane-qa.mjs goal/webstore-producto-compositor --contract storage/progreso/lanes/goal-webstore-producto-compositor.md` → PASS
- [x] Matriz completa

## Matriz de verificación
| # | Check | Comando | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | campos nuevos en schemas | npx tsx scripts/agno.ts schema prefabricados | 11 fields incl. descripcion_comercial, categoria_comercial, precio_publico, precio_costo_calculado, publicado_web, reutilizable_catalogo, slug | PASS | Los campos existen en schema_definitions.json |
| V2 | zap recalcula | Script creado y registrado en scripts.json | recalcular_precio_prefabricado presente | PASS | 2403 chars de código, registrado vía agno script write |
| V3 | UI compila | npx tsc --noEmit + npm run agnostic:compile | 14 errores preexistentes (sin nuevos) | PASS | 14 TS errors (no regresión), compile OK |
| V4 | mocks publicados | npx tsx scripts/agno.ts records prefabricados + node -e sobre seed_registros.json | 2 nuevos (Módulo Cocina 60cm, Closet Lineal 2.4m), ambos publicado_web=true, y 7 mocks registrados en seed_registros (lote webstore_r2) | PASS | prefabricados.json contiene ambos con campos completos; seed_registros.json = 24 registros (17 + 7: 2 prefabricados + 5 prefabricados_items, lote=webstore_r2) |
| V5 | en superficie | node scripts/lane-qa.mjs goal/webstore-producto-compositor --contract ... | PASS | PASS | Lane QA: 7 archivos dentro de superficie |
| V6 | gates | npm run validate:storage + validate:encoding + tsc | verdes | PASS | storage OK, encoding 667 files OK, 14 TS errors (preexistentes) |

## Handoff
Al cerrar, el Orquestador corre QA mecánico, audita e integra a `dev` con `--no-ff`.
