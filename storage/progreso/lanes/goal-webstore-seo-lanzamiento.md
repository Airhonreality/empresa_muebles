# Contrato de lane: goal/webstore-seo-lanzamiento

> Capa SEO de lanzamiento + saneamiento estructural de la webstore.
> Abrir el sitio a crawlers (hoy `robots.txt` bloquea TODO), sitemap, JSON-LD de
> producto/portafolio, llms.txt actualizado, metadata por ruta. Y de paso: eliminar
> la duplicación `/tienda` ↔ `/colecciones`, integrar carrito en colecciones, y
> reparar bugs que bloquean la navegación (VetaPortfolio) y el checkout (Wompi).
> Objetivo de negocio: rankear "mobiliario, diseño y carpintería Bogotá" y tener
> una webstore coherente para lanzamiento.

<!-- lane-surface: public/** | src/app/sitemap.ts | src/app/robots.ts | src/app/\[...slug\]/page.tsx | src/lib/veta/** | src/components/specialized/tienda/** | src/components/specialized/portfolio/** | src/components/specialized/cart/** | src/components/specialized/VetaCatalog.tsx | src/components/specialized/VetaHeader.tsx | src/components/specialized/VetaFooter.tsx | src/app/api/integrations/wompi/checkout/route.ts | storage/db/page_routes.json | storage/db/app_navbars.json | storage/progreso/lanes/goal-webstore-seo-lanzamiento.md -->

## Identidad
- **Rama:** `goal/webstore-seo-lanzamiento`
- **Worktree:** `git worktree add ../wt-webstore-seo -b goal/webstore-seo-lanzamiento`
- **Rol/modelo:** worker de código (liviano).
- **Estado:** plan_aprobado (mandato del usuario 2026-07-07, ronda web-store)

## Goal (teleología)
El sitio queda listo para lanzamiento: sin duplicación de rutas de catálogo,
con carrito funcional en la ruta canónica `/colecciones`, sin errores en
`/portafolio`, con robots/sitemap/JSON-LD/llms.txt/metadata operativos.

## Verdad de terreno (no re-investigar — la investigación YA está hecha)
- `public/robots.txt` HOY bloquea todo (`Disallow: /`). `public/llms.txt` existe y está
  poblado pero referencia `/colecciones` como catálogo, no `/tienda`.
- Helpers JSON-LD fork: `src/lib/veta/seo/schemaGenerator.ts` —
  `buildOrganizationSchema()`, `buildWebsiteSchema()`, `buildLocalBusinessSchema()`,
  `buildAggregateRatingSchema()`, `absoluteUrl()`. Layout ya emite `Organization`;
  Home emite `LocalBusiness`/`WebSite`. **Nunca se invoca desde generateMetadata.**
- Decisiones de investigación VINCULANTES:
  - NO usar `FAQPage` (deprecado por Google 2026); usar "Respuesta Atómica".
  - NO usar `GeoCircle` amplio (canibalización); usar `areaServed` nominal con barrios.
  - Research de mercado en `storage/fork_doc/DOCS VETA DORADA/COMERCIAL WEB/Analiticas y SEO/`.
- NAP real en `configuracion_comercial` — leer de ahí, no hardcodear.
- **Ruta corrupta detectada:** `page_routes.json` línea 372-382 tiene una entrada
  con path `"C:/Program Files/Git/tienda"` (ruta absoluta Windows). Hay que eliminarla.
- **Duplicación catálogo:** `/colecciones` (VetaCatalog.tsx) y `/tienda` (VetaTienda.tsx)
  leen del mismo `productos_catalogo`. Productos con `tipo: 'Mueble Terminado'` +
  `publicado_web: true` aparecen en ambos. Decisión del usuario: **eliminar `/tienda`**,
  dejar `/colecciones` como ruta canónica de catálogo.
- **Carrito:** `/tienda` tiene CartContext + CartDrawer + CheckoutForm + Wompi.
  `/colecciones` NO tiene carrito — su "Comprar" lleva a `/agendar` (lead gen).
  Al eliminar `/tienda` hay que trasplantar el carrito a `/colecciones`.
- **VetaPortfolio.tsx error:** `readRecords()` hace `POST /api/vault` con
  `action: 'READ'`, pero `vault/route.ts` solo acepta `WRITE`/`REMOVE` en POST.
  Las lecturas van por `GET /api/vault?namespace=...`.
- **Wompi checkout bug:** `checkout/route.ts:71` solo valida items contra
  `productos_catalogo`, pero el carrito acepta `prefabricados`. Prefabricados en
  checkout → 400 error.
- **Navbar inconsistente:** `VetaHeader.tsx` hardcodea 5 links incluyendo Tienda.
  `app_navbars.json:public_main` solo tiene 3 (sin Tienda ni Portafolio).
- **schemaGenerator.ts** existe completo pero **nunca se llama desde metadata** de páginas.
- Rutas públicas al cierre de lanes previas: `/`, `/colecciones`, `/agendar`,
  `/portafolio`, `/tienda` (se elimina), `/tienda/:slug` (se elimina), `/cuenta`.
- `src/app/` (fuera de `api/`) es superficie de fork permitida.

## Superficie (y SOLO esta)
- `public/**` (robots.txt → eliminar; llms.txt actualizar)
- `src/app/sitemap.ts`, `src/app/robots.ts` (nuevos)
- `src/lib/veta/**` (extender schemaGenerator + si hace falta helper nuevo)
- `src/components/specialized/tienda/**` (TODO: eliminar tras migrar carrito a colecciones)
- `src/components/specialized/portfolio/VetaPortfolio.tsx` (fix readRecords)
- `src/components/specialized/VetaCatalog.tsx` (integrar carrito, cambiar CTA "Comprar")
- `src/components/specialized/VetaHeader.tsx` (quitar link a /tienda)
- `src/components/specialized/VetaFooter.tsx` (quitar link a /tienda)
- `src/app/api/integrations/wompi/checkout/route.ts` (fix validación prefabricados)
- `storage/db/page_routes.json` (eliminar ruta /tienda, /tienda/:slug, entrada corrupta)
- `storage/db/app_navbars.json` (sincronizar con header)
- `storage/progreso/lanes/goal-webstore-seo-lanzamiento.md`

## Fuera de alcance
- NO tocar `src/lib/agnostic/` (generador del engine).
- NO tocar lógica de ERP, clientes, ni `/app/` routes.
- NO tocar `public/robots.txt` más que para eliminarlo (la nueva fuente es `src/app/robots.ts`).
- NO inventar reviews/ratings ni contenido de keywords engañoso.
- NO crear silos SEO nuevos (`/diseno-de-interiores-bogota`, etc.) — eso es otra lane.

## Depende de / bloquea a
- Depende de: tienda-ui ✅, portfolio-publico ✅, clientes (ruta `/cuenta` existe en dev).
- Es la última lane de la ronda 2. Tras su cierre: merge `dev` → `main` y deploy.

## DAG de tareas (cada una con DoD ejecutable, orden recomendado)

### Bloque A — Saneamiento estructural (hacer primero, desbloquea el resto)
1. **Eliminar entrada corrupta en `page_routes.json`**: borrar el objeto con
   path `"C:/Program Files/Git/tienda"`. DoD: `npx tsx scripts/agno.ts docs routes`
   no muestra rutas con `C:/Program Files/`.
2. **Fix `VetaPortfolio.tsx` — `readRecords()`**: cambiar `POST /api/vault` con
   `{ action: 'READ' }` a `GET /api/vault?namespace=${encodeURIComponent(namespace)}`.
   DoD: navegar a `/portafolio` sin error en consola.
3. **Fix Wompi checkout — validar también `prefabricados`**: en
   `checkout/route.ts:63-71`, si el item no se encuentra en `productos_catalogo`,
   buscarlo en `prefabricados`. DoD: carrito con ítem prefabricado → checkout 200.

### Bloque B — Eliminar `/tienda`, consolidar en `/colecciones`
4. **Migrar carrito de `/tienda` a `/colecciones`**: extraer `CartContext.tsx`,
   `CartDrawer.tsx`, `CheckoutForm.tsx` del directorio `tienda/` e integrarlos en
   `VetaCatalog.tsx`. El CTA "Comprar" debe abrir el carrito, no ir a `/agendar`.
   Mantener funcional: el CTA de "Cotizar por WhatsApp" para proyectos a medida.
   DoD: en `/colecciones`, click "Comprar" → drawer con item + monto + opciones
   de pago (Wompi/WhatsApp).
5. **Eliminar rutas `/tienda` y `/tienda/:slug` de `page_routes.json`**: remover
   ambos objetos. DoD: `npx tsx scripts/agno.ts docs routes` no contiene `/tienda`.
6. **Eliminar `src/components/specialized/tienda/`**: borrar todo el directorio.
   DoD: `Test-Path src/components/specialized/tienda` → False.
7. **Actualizar `VetaHeader.tsx`**: quitar link "Tienda" del nav. DoD: nav muestra
   4 links (Espacios, Colecciones, Portafolio, Agendar).
8. **Actualizar `VetaFooter.tsx`**: quitar link "Tienda". DoD: footer sin /tienda.
9. **Sincronizar `storage/db/app_navbars.json`**: añadir "Portafolio" a `public_main`.
   DoD: navbar data-driven coincide con header.

### Bloque C — SEO (tareas 1-7 del plan original, adaptadas a `/colecciones`)
10. **`src/app/robots.ts`**: permitir todo salvo `/app/` y `/api/`; referencia al
    sitemap. Eliminar `public/robots.txt` estático.
    DoD: `curl localhost:3000/robots.txt` → Allow + Sitemap + Disallow /app/.
11. **`src/app/sitemap.ts`**: rutas estáticas (`/`, `/colecciones`, `/portafolio`,
    `/agendar`) + dinámicas desde storage. Usar `absoluteUrl()`.
    DoD: `curl localhost:3000/sitemap.xml` incluye `/colecciones`.
12. **Extender `src/lib/veta/seo/schemaGenerator.ts`**: añadir
    `buildProductSchema(record)`, `buildBreadcrumbSchema(items)`,
    `buildPortfolioItemSchema(record)`. `areaServed` nominal en LocalBusiness.
    DoD: `node -e` que serialice cada builder → JSON parseable con `@type` correcto.
13. **Inyectar JSON-LD en páginas**: Product en detalle de colecciones, ItemList en
    `/colecciones`, CreativeWork en `/portafolio`, BreadcrumbList. Server-render.
    Usar `generateMetadata` o patrón que ya usa el Home.
    DoD: `curl -s localhost:3000/colecciones/<slug> | grep 'application/ld+json'`
    contiene `"@type":"Product"`.
14. **Respuesta Atómica**: en `/colecciones` y `/portafolio`, bloque H2 + párrafo
    40-60 palabras con intención de búsqueda ("muebles a medida en Bogotá").
    DoD: HTML contiene los H2 y párrafos (grep).
15. **Actualizar `public/llms.txt`**: sección de colecciones + portafolio con
    enlaces canónicos. Reemplazar refs a `/tienda` por `/colecciones`.
    DoD: diff muestra solo adiciones; encoding verde.
16. **Metadata por ruta**: title/description únicos para `/colecciones`,
    `/colecciones/:slug` (nombre + precio + Bogotá), `/portafolio`,
    `/cuenta` (noindex). Seguir mecanismo de metadata del resolver actual.
    DoD: `curl` cada ruta → `<title>` único; `/cuenta` con `<meta name="robots" content="noindex">`.

## DoD de cierre
- [ ] commit(s) en `goal/webstore-seo-lanzamiento` sin `--no-verify`
- [ ] `npm run validate:storage` + `npm run validate:encoding` + `npx tsc --noEmit` verdes
- [ ] `node scripts/lane-qa.mjs goal/webstore-seo-lanzamiento --contract storage/progreso/lanes/goal-webstore-seo-lanzamiento.md` → PASS
- [ ] Smoke 4/4: `/` 200, `/colecciones` 200, `/portafolio` 200, `/colecciones/<slug>` 200
- [ ] Sin errores de consola en `/portafolio`
- [ ] Matriz completa abajo

## Matriz de verificación
| # | Check | Comando | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | ruta corrupta eliminada | `npx tsx scripts/agno.ts docs routes` | sin `C:/Program` | | |
| V2 | portafolio sin error | navegar /portafolio | 0 errores consola | | |
| V3 | Wompi acepta prefabricados | carrito con prefab → checkout | 200 | | |
| V4 | /tienda eliminada | curl /tienda | 404 | | |
| V5 | carrito en colecciones | click Comprar | drawer con items | | |
| V6 | nav sin tienda | inspeccionar header | 4 links | | |
| V7 | navbar data-driven ok | consultar app_navbars.json | incluye Portafolio | | |
| V8 | robots abierto | curl /robots.txt | Allow + /app/ disallow | | |
| V9 | sitemap | curl /sitemap.xml | /colecciones presente | | |
| V10 | Product JSON-LD | curl /colecciones/<slug> | @type Product | | |
| V11 | respuesta atómica | grep H2+párrafo colecciones | presente | | |
| V12 | titles únicos | curl cada ruta | distintos | | |
| V13 | /cuenta noindex | curl /cuenta | noindex presente | | |
| V14 | en superficie | lane-qa.mjs | PASS | | |
| V15 | gates | validate + encoding + tsc | verdes | | |

## Handoff
Al cerrar, el Orquestador audita, integra a `dev` con `--no-ff` y si la ronda
completa está verde, mergea `dev` → `main` para deploy. La lane `webstore-clientes`
(EN_PROGRESO externo) se audita aparte antes del merge final.
