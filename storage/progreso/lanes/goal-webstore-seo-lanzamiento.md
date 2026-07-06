# Contrato de lane: goal/webstore-seo-lanzamiento

> Capa SEO de lanzamiento: abrir el sitio a crawlers (hoy `robots.txt` bloquea TODO),
> sitemap, JSON-LD de producto/portafolio sobre los helpers Veta existentes, llms.txt
> actualizado y metadata por ruta. Objetivo de negocio: rankear "mobiliario, diseño y
> carpintería Bogotá" (zonas: Usaquén, Chicó, Rosales, Quinta Camacho, Teusaquillo).

<!-- lane-surface: public/** | src/app/sitemap.ts | src/app/robots.ts | src/lib/veta/** | src/components/specialized/tienda/** | src/components/specialized/portfolio/** | storage/db/** | storage/progreso/lanes/goal-webstore-seo-lanzamiento.md -->

## Identidad
- **Rama:** `goal/webstore-seo-lanzamiento`
- **Worktree:** `git worktree add ../wt-webstore-seo -b goal/webstore-seo-lanzamiento`
- **Rol/modelo:** worker de código (liviano).
- **Estado:** plan_aprobado (mandato del usuario 2026-07-05, ronda web-store)

## Goal (teleología)
El sitio queda técnicamente listo para indexación: robots abierto, sitemap completo,
JSON-LD válido en home/tienda/portafolio, llms.txt al día y metadata única por ruta
pública.

## Verdad de terreno (no re-investigar — la investigación YA está hecha)
- `public/robots.txt` HOY bloquea todo (`Disallow: /`). `public/llms.txt` existe y está
  poblado (identidad, zonas, comparativas). NO existe sitemap.
- Helpers JSON-LD fork: `src/lib/veta/seo/schemaGenerator.ts` —
  `buildOrganizationSchema()`, `buildWebsiteSchema()`, `buildLocalBusinessSchema()`,
  `buildAggregateRatingSchema()` (SOLO con testimonios reales — no inventar ratings),
  `absoluteUrl()`. El layout ya emite `Organization`; el Home `LocalBusiness`/`WebSite`.
- Decisiones de investigación VINCULANTES:
  - `storage/fork_doc/SESION_2026-07-02_HOME_SEO_EMBUDO/06_PLAN_SEO_TECNICO.md`: NO usar
    `FAQPage` (deprecado por Google 2026); usar "Respuesta Atómica" (H2 + párrafo de
    40-60 palabras).
  - `storage/progreso/plan_json_ld_dinamico.md`: arquitectura de Knowledge Graph; evitar
    `GeoCircle` amplio (canibalización en estratos no objetivo) — declarar `areaServed`
    con los barrios objetivo nominales.
  - Research de mercado en `storage/fork_doc/DOCS VETA DORADA/COMERCIAL WEB/Analiticas y
    SEO/` (leer solo si necesitas keywords).
- NAP real en `configuracion_comercial` (dirección, geo lat/lon, horarios) — leer de ahí,
  no hardcodear.
- Rutas públicas al cierre de las lanes previas: `/`, `/colecciones`, `/agendar`,
  `/portafolio`, `/tienda`, `/tienda/:slug`, `/cuenta`.
- `src/app/` (fuera de `api/`) es superficie de fork permitida (sitemap.ts/robots.ts).

## Superficie (y SOLO esta)
- `public/**` (robots.txt/llms.txt; si migras robots a `src/app/robots.ts`, elimina el
  estático para no duplicar)
- `src/app/sitemap.ts`, `src/app/robots.ts` (nuevos)
- `src/lib/veta/**` (extender schemaGenerator: Product, BreadcrumbList, portfolio)
- `src/components/specialized/tienda/**` y `portfolio/**` (SOLO inyectar JSON-LD +
  bloques "Respuesta Atómica" de contenido)
- `storage/db/**` (records de metadata/config si hacen falta)

## Fuera de alcance
- NO tocar lógica de negocio de tienda/portfolio/checkout.
- NO tocar `src/lib/agnostic/seo/` (generador del engine).
- NO inventar reviews/ratings ni contenido de keywords engañoso.

## Depende de / bloquea a
- Depende de: tienda-ui, portfolio-publico, clientes (rutas existentes en dev).
- Última lane de la ronda.

## DAG de tareas (cada una con DoD ejecutable)
1. **`src/app/robots.ts`**: permitir todo salvo `/app/` (ERP) y `/api/`; referencia al
   sitemap. Eliminar `public/robots.txt` estático. IMPORTANTE: dejar nota en el contrato
   de que la apertura real a crawlers ocurre al deployar `main` — coordinar con el humano.
   DoD: curl `localhost:3000/robots.txt` muestra Allow + Sitemap y Disallow /app/.
2. **`src/app/sitemap.ts`**: rutas públicas estáticas + dinámicas desde storage
   (`/tienda/:slug` de publicados, `/portafolio` — si el detalle de portfolio es overlay,
   solo la ruta base). Usar `absoluteUrl()`/dominio de `configuracion_comercial`.
   DoD: curl `localhost:3000/sitemap.xml` incluye `/tienda/<slug-mock>`.
3. **Extender `src/lib/veta/seo/schemaGenerator.ts`**: `buildProductSchema(record)`
   (Product + Offer con precio COP, availability, imagen, brand Veta Dorada),
   `buildBreadcrumbSchema(items)`, `buildPortfolioItemSchema(record)` (CreativeWork con
   `locationCreated` = barrio, Bogotá). `areaServed` nominal (barrios objetivo) en
   LocalBusiness si no está.
   DoD: test unitario ligero o node -e que serialice cada builder y valide JSON parseable
   con `@type` correcto.
4. **Inyectar JSON-LD**: Product en `/tienda/:slug`, ItemList en `/tienda`, CreativeWork
   en tarjetas/overlay de `/portafolio`, BreadcrumbList en tienda. Server-render (no solo
   client) — seguir el patrón que ya usa el Home.
   DoD: `curl -s localhost:3000/tienda/<slug> | grep 'application/ld+json'` contiene
   `"@type":"Product"`.
5. **Respuesta Atómica**: en `/tienda` y `/portafolio`, un bloque H2 + párrafo 40-60
   palabras respondiendo la intención de búsqueda ("muebles a medida en Bogotá",
   "carpintería y diseño Bogotá norte") con texto real de marca (tomar tono de llms.txt).
   DoD: HTML contiene los H2 y párrafos (grep documentado).
6. **Actualizar `public/llms.txt`**: añadir sección de tienda y portafolio con enlaces
   canónicos nuevos. Mantener el contenido existente.
   DoD: diff muestra solo adiciones; encoding verde.
7. **Metadata por ruta**: title/description únicos para `/tienda`, `/tienda/:slug`
   (nombre producto + precio + Bogotá), `/portafolio`, `/cuenta` (noindex en `/cuenta`).
   Seguir el mecanismo de metadata que use el resolver/layout actual (investigar SOLO ese
   mecanismo; si las rutas schema-driven no soportan metadata dinámica, documentar la
   limitación en vez de hackear el engine).
   DoD: curl de cada ruta muestra `<title>` único; `/cuenta` con noindex.

## DoD de cierre
- [ ] commit(s) en `goal/webstore-seo-lanzamiento` sin `--no-verify`
- [ ] `npm run validate:storage` + `npm run validate:encoding` + `npx tsc --noEmit` verdes
- [ ] `node scripts/lane-qa.mjs goal/webstore-seo-lanzamiento --contract storage/progreso/lanes/goal-webstore-seo-lanzamiento.md` → PASS
- [ ] Matriz completa

## Matriz de verificación
| # | Check | Comando | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | robots abierto + ERP cerrado | curl /robots.txt | Allow + Disallow /app/ | | |
| V2 | sitemap con productos | curl /sitemap.xml | slug mock presente | | |
| V3 | Product JSON-LD | curl /tienda/<slug> | @type Product | | |
| V4 | respuesta atómica | grep H2+párrafo | presente | | |
| V5 | titles únicos + noindex cuenta | curl rutas | correcto | | |
| V6 | en superficie | lane-qa.mjs | PASS | | |
| V7 | gates | validate + tsc | verdes | | |

## Handoff
Al cerrar, el Orquestador audita, integra a `dev` con `--no-ff` y prepara el cierre de
ronda (dev → main tras build verde).
