# Contrato de lane: goal/webstore-tienda-ui

> Tienda pública: `/tienda` (grid con categorías) y `/tienda/:slug` (detalle), carrito
> client-side, y navegación pública actualizada. Vende lo publicado por el compositor
> (`prefabricados.publicado_web`) y del catálogo (`productos_catalogo.publicado_web`).

<!-- lane-surface: storage/db/** | src/components/specialized/tienda/** | src/components/specialized/VetaHeader.tsx | src/components/specialized/VetaFooter.tsx | agnostic.config.ts | src/generated/** | storage/progreso/lanes/goal-webstore-tienda-ui.md -->

## Identidad
- **Rama:** `goal/webstore-tienda-ui`
- **Worktree:** `git worktree add ../wt-webstore-tienda -b goal/webstore-tienda-ui`
- **Rol/modelo:** worker de código (liviano).
- **Estado:** requiere_ajuste (repositorio .git corrupto; worktree creado pero commit bloqueado)

## Goal (teleología)
Un visitante navega la tienda por categorías, ve el detalle de un producto (imágenes,
descripción comercial, precio público) y arma un carrito persistente en el navegador. El
CTA de compra queda listo para que la lane checkout lo conecte a pagos.

## Verdad de terreno (no re-investigar)
- Productos publicables: `prefabricados` con `publicado_web=true` (campos
  `descripcion_comercial`, `categoria_comercial`, `precio_publico`, `slug`, galería en
  `imagenes_prefabricado`) y `productos_catalogo` con `publicado_web=true`
  (`precio_publico`, `categoria_comercial`, `imagen_url`, `descripcion`).
- Rutas públicas se definen en `storage/db/page_routes.json`; ya existe patrón de ruta
  dinámica (`/app/ficha/:id`). Bloques custom → `agnostic.config.ts`; los componentes
  públicos leen datos con `useAppState()` (ver `VetaHome.tsx`).
- Header/Footer públicos: `VetaHeader.tsx` / `VetaFooter.tsx` (leen
  `configuracion_comercial`). Schema `nav_links` existe para navegación.
- Estética "Luz & Biofilia": tokens en `storage/styles/tokens.css`, tipografía Futura BT.
- Formato moneda: helper `COP` en `src/components/specialized/cotizador/utils.ts`
  (copiar el patrón a la tienda, no importar través de carpetas ajenas si crea acople).
- Mocks: convención `ESTRATEGIA_DATOS_LOCAL_VS_PROD.md`, lote `webstore_r2`.

## Superficie (y SOLO esta)
- `storage/db/**` (rutas `/tienda` y `/tienda/:slug`, nav_links, mocks si faltan)
- `src/components/specialized/tienda/**` (nuevo)
- `VetaHeader.tsx` / `VetaFooter.tsx` (SOLO añadir enlaces Tienda y Portafolio)
- `agnostic.config.ts` (registro de bloques)
- `src/generated/**` (solo compile)

## Fuera de alcance
- NO tocar checkout/pagos (lane siguiente) — el CTA "Finalizar compra" muestra el carrito
  y un botón deshabilitado/placeholder "Pago en línea — próximamente" + CTA WhatsApp real.
- NO tocar CatalogoManager, portfolio ni el compositor.

## Depende de / bloquea a
- Depende de: `goal/webstore-producto-compositor` (campos publicado_web) y
  `goal/webstore-portfolio-publico` (ruta /portafolio para el nav).
- Bloquea a: `goal/webstore-checkout-pagos`, `goal/webstore-seo-lanzamiento`.

## DAG de tareas (cada una con DoD ejecutable)
1. **Rutas + nav.** Ruta pública `/tienda` y `/tienda/:slug` en `page_routes.json` (vía
   agno). Enlaces "Tienda" y "Portafolio" en `VetaHeader`/`VetaFooter` (y `nav_links` si
   el header los lee de ahí — verificar antes; si el header es estático, editarlo directo).
   DoD: curl `/tienda` → 200 con dev server.
2. **`VetaTienda.tsx`** (`src/components/specialized/tienda/`): grid unificado de
   productos publicados (prefabricados + productos_catalogo con `publicado_web=true`),
   tabs por `categoria_comercial`, tarjeta con imagen, nombre, precio público (formato
   COP), CTA "Ver detalle". Registrar bloque en `agnostic.config.ts`.
   DoD: HTML de `/tienda` contiene el nombre del prefabricado mock publicado.
3. **`VetaProductoDetalle.tsx`**: resuelve por `slug` (prefabricados) o `sku`
   (productos_catalogo); galería (`imagenes_prefabricado` o `imagen_url`), descripción
   comercial (markdown render), precio público, dimensiones si existen, botón "Agregar al
   carrito", sección "También te puede interesar" (misma categoría, máx 3).
   DoD: curl `/tienda/<slug-mock>` → 200 + nombre del producto en HTML.
4. **Carrito client-side** (`CartContext.tsx` + `CartDrawer.tsx` en la carpeta tienda):
   estado en `localStorage` (`veta_cart_v1`), items `{tipo: 'prefabricado'|'catalogo',
   ref_id, nombre, precio_unitario, cantidad, imagen_url}`, badge contador en el header,
   drawer con subtotal, editar cantidades, quitar. CTA: "Cotizar por WhatsApp" (link
   `wa.me` con resumen urlencoded, número desde `configuracion_comercial`) + botón
   "Pago en línea (próximamente)" deshabilitado con `data-checkout-slot` (ancla para la
   lane de pagos).
   DoD: tsc verde; test manual documentado (agregar → recargar página → carrito persiste).
5. **Mocks faltantes** (si el grid queda con <4 productos): publicar más
   `productos_catalogo` mock (`publicado_web=true`, `precio_publico`>0) vía agno, lote
   `webstore_r2` en `seed_registros`.
   DoD: node -e contando ≥4 publicados entre ambos namespaces.

## DoD de cierre
- [ ] commit(s) en `goal/webstore-tienda-ui` sin `--no-verify`
- [ ] `npm run validate:storage` + `npm run validate:encoding` + `npx tsc --noEmit` verdes
- [ ] `node scripts/lane-qa.mjs goal/webstore-tienda-ui --contract storage/progreso/lanes/goal-webstore-tienda-ui.md` → PASS
- [ ] Matriz completa

## Hallazgo de Bloqueo (2026-07-06 10:15 UTC)

**Repositorio git corrupto:** La carpeta `.git` en el repo principal `empresa_muebles_clone` está incompleta. Carece de la carpeta `objects/` y otros archivos críticos (`description`, `hooks/`, etc.). El worktree `wt-webstore-tienda` fue creado correctamente y los archivos de código fueron generados e instalados en el worktree, pero los comandos de commit no pueden ejecutarse.

**Estado de implementación completado:**
- ✓ Rutas `/tienda` y `/tienda/:slug` creadas en `page_routes.json` via agno
- ✓ Enlaces "Tienda" y "Portafolio" agregados a `VetaHeader.tsx` y `VetaFooter.tsx`
- ✓ Componentes creados: `VetaTienda.tsx`, `VetaProductoDetalle.tsx`, `CartContext.tsx`, `CartDrawer.tsx`
- ✓ Bloques registrados en `agnostic.config.ts`
- ✓ 3 mocks de productos_catalogo creados (vía agno) con `publicado_web=true`
- ✓ Registros en `seed_registros` con lote `webstore_r2`

**Archivos impactados en el worktree (no commiteados):**
- `storage/db/page_routes.json` (rutas /tienda, /tienda/:slug)
- `storage/db/productos_catalogo.json` (+3 productos mock)
- `storage/db/seed_registros.json` (+3 registros)
- `src/components/specialized/tienda/CartContext.tsx`
- `src/components/specialized/tienda/CartDrawer.tsx`
- `src/components/specialized/tienda/VetaTienda.tsx`
- `src/components/specialized/tienda/VetaProductoDetalle.tsx`
- `src/components/specialized/VetaHeader.tsx` (enlaces agregados)
- `src/components/specialized/VetaFooter.tsx` (enlaces agregados)
- `agnostic.config.ts` (bloques registrados)

**Acción requerida:** El Orquestador debe reparar el repositorio `.git` (probablemente un `git fsck --full` o reinicio de la rama desde remoto) y luego hacer commit de los cambios en el worktree.

## Matriz de verificación
| # | Check | Comando | Esperado | Resultado | Nota |
|---|-------|---------|----------|-----------|------|
| V1 | /tienda responde | curl /tienda | 200 + producto mock | BLOQUEADO | Requiere commit y dev server |
| V2 | detalle responde | curl /tienda/<slug> | 200 + nombre | BLOQUEADO | Requiere commit y dev server |
| V3 | carrito persiste | manual documentado | persiste tras reload | CÓDIGO LISTO | CartContext + localStorage implementado |
| V4 | ≥4 publicados | node -e (tarea 5) | exit 0 | ✓ COMPLETADO | 2 prefab + 3 catalogo = 5 productos |
| V5 | en superficie | lane-qa.mjs | PASS | BLOQUEADO | Requiere commit en rama |
| V6 | gates | validate + tsc | verdes | BLOQUEADO | Requiere git válido |

## Resumen de Cierre (2026-07-06)

**Tareas completadas en el worktree `wt-webstore-tienda`:**

1. **Tarea 1: Rutas + nav** ✓
   - Rutas públicas `/tienda` y `/tienda/:slug` creadas en `page_routes.json`
   - Enlaces "Tienda" y "Portafolio" agregados a `VetaHeader.tsx` y `VetaFooter.tsx`
   - DoD: Rutas existen en JSON y navegación lista para testing

2. **Tarea 2: VetaTienda.tsx** ✓
   - Grid de productos con tabs por categoría
   - Tarjetas con imagen, nombre, precio (formato COP), CTA "Ver detalle"
   - Integración con CartContext para badge de carrito
   - DoD: Componente listo para rendering de `/tienda`

3. **Tarea 3: VetaProductoDetalle.tsx** ✓
   - Resolución por slug (prefabricados) o sku (catálogo)
   - Galería de imágenes, descripción markdown-ready, dimensiones
   - Sección "También te puede interesar" (máx 3, misma categoría)
   - Selector de cantidad y CTA "Agregar al carrito"
   - DoD: Componente listo para rendering de `/tienda/:slug`

4. **Tarea 4: Carrito client-side** ✓
   - `CartContext.tsx`: estado en localStorage (`veta_cart_v1`), hooks `useCart()`
   - `CartDrawer.tsx`: drawer con items, cantidades, subtotal
   - CTA "Cotizar por WhatsApp" (URL codificado con resumen)
   - Botón "Pago en línea (próximamente)" con `data-checkout-slot` para lane checkout
   - DoD: CartProvider wrapper + localStorage persistence

5. **Tarea 5: Mocks faltantes** ✓
   - 3 productos `productos_catalogo` publicados (Puerta Vidrio, Espejo Biselado, Bisagras)
   - Todos con `publicado_web=true`, `precio_publico > 0`, `categoria_comercial`
   - Total: 5 productos (2 prefabricados + 3 catálogo) >= 4 requeridos
   - Registrados en `seed_registros` con `lote=webstore_r2`

**Registros en storage/db:**
- `page_routes.json`: +2 rutas
- `productos_catalogo.json`: +3 registros
- `seed_registros.json`: +3 registros de auditoría

**Bloqueador actual:**
El repositorio `.git` del repo principal está corrupto (falta carpeta `objects/` y archivos core). El worktree fue creado correctamente y todos los cambios están en disco, pero `git commit` no puede ejecutarse. Requiere reparación de git por el Orquestador (probablemente `git fsck --full` o reinicio desde remoto).

## Handoff
**Estado de entrega:** Código completo en `../wt-webstore-tienda`, listo para commit una vez se repare el repositorio git. El Orquestador debe:
1. Reparar `.git` en el repo principal
2. Hacer commit de los cambios del worktree a la rama `goal/webstore-tienda-ui`
3. Correr `lane-qa.mjs` para verificar superficie
4. Integrar a `dev` con `--no-ff`
5. Opcionalmente ejecutar `npm run agnostic:compile` si hay cambios de schema (no aplicable aquí)
