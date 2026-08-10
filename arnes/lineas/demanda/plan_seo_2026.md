# Plan SEO 2026 — Indexación total + mejores prácticas

**Fecha:** 2026-08-08 · **Estado:** propuesta · **Tipo:** síntesis (no schema, no código) · **Riesgo:** medio (decisiones de SEO afectan visibilidad orgánica; los datos estructurados mal aplicados pueden acarrear acción manual de Google)

**Regla de sucesión (C3, `diagnostico_de_proceso.md` §6):** el único artefacto SEO vivo en el repo nuevo es `lib/seo/jsonld.ts` (LocalBusiness con NAP incompleto a propósito) y `app/robots.ts`/`app/sitemap.ts`. El plan de julio (`06_PLAN_SEO_TECNICO.md` en `DOCS VETA DORADA/SESION_2026-07-02/`) fue escrito para el motor Agnostic y **nunca se ejecutó**. Este documento no lo reemplaza sino que **porta sus decisiones vigentes al repo nuevo**, filtrando lo obsoleto (zaps, esquemas Agnostic) y rescatando el contenido (JSON-LD, Respuesta Atómica, reglas anti-invención, tokens). Tampoco reemplaza `plan_diseno_web_publica.md` — ese cubre las pantallas; este cubre la capa transversal de SEO.

**Alcance:** indexación total de todas las páginas públicas del sitio nuevo (F-00..F-19 de `plan_diseno_web_publica.md`) + mejores prácticas 2026 verificables mecánicamente.

**Reglas duras anti-invención (I-020, I-040, plan de julio §1):**
1. **Nunca inventar `aggregateRating`.** Si `testimonios` está vacío, no se renderiza la sección — nunca placeholder ni datos de ejemplo hardcodeados.
2. **Nunca publicar coordenadas sin verificar.** Si `geo` no está confirmado, se omite el bloque — mejor ausente que incorrecto.
3. **`FAQPage` está deprecado por Google** (retiro de rich results, confirmado en el plan de julio). En su lugar: **Respuesta Atómica** — pregunta de cola larga como `<h2>` visible en el DOM, seguida de 40-60 palabras de respuesta, indexable como contenido normal.
4. **Sin `GeoCircle`.** Decisión ratificada por el Supervisor (julio 2026): usar `AdministrativeArea`/`containsPlace`, solo Bogotá (D5 extiende a Chía/Cajicá/Cota con viáticos, pero el `areaServed` estructurado se limita a Bogotá).
5. **Sin páginas locales artificiales** (I-049). La geografía la decide el portafolio real: se gana Chicó habiendo hecho una cocina en Chicó, no escribiendo una página sobre Chicó.

---

## 1. Indexación total — checklist por página

**Objetivo:** toda página pública del sitio retorna 200, es rastreable, está en el sitemap si es canónica, y no tiene barreras de indexación.

| # | Requisito | Aplica a | Verificación |
|---|---|---|---|
| 1 | **Sin `noindex` en páginas públicas.** Solo `noindex` en `/cuenta` (portal cliente) y rutas de ERP (`/(erp)/`). | Todas las F-XX | `curl -I https://... | grep -i x-robots-tag` — sin `noindex` en F-00..F-19 |
| 2 | **Canonical explícito en cada página.** `<link rel="canonical">` apuntando a la URL canónica (sin query params, sin trailing slash duplicado). | F-01..F-16 | `grep -r "canonical" app/` ≥ número de páginas públicas |
| 3 | **Sitemap.xml dinámico** incluyendo todas las rutas públicas + `<image:image>` por cada imagen de landing/portafolio/caso. | F-01..F-16 | `GET /sitemap.xml` → 200, contiene `<url>` por cada ruta pública |
| 4 | **Robots.txt** permitiendo rastreo completo de rutas públicas + bots de IA (`ChatGPT-User`, `GPTBot`, `PerplexityBot`, `ClaudeBot`). | Todo el sitio | `GET /robots.txt` → contiene `Allow: /` y los 4 user-agents de IA |
| 5 | **`llms.txt`** en la raíz generado **después** de finalizar el contenido (I-038), no antes. Lista las URLs clave con descripción. | Raíz | `GET /llms.txt` → 200, lista al menos F-01..F-16 |
| 6 | **Sin páginas huérfanas.** Cada página está enlazada desde al menos otra (nav, footer, sitemap HTML, o breadcrumb). | F-09..F-19 | Auditoría manual o crawler |
| 7 | **Redirecciones 301 desde el Wix legacy.** Mapa de URLs del sitio actual (`vetadeoro.co/cocinas`, `vetadeoro.co/*`) → rutas equivalentes del sitio nuevo. | Corte a producción | Archivo de redirecciones en Vercel/Next.js |
| 8 | **Sin contenido duplicado entre páginas.** Cada landing SEO (F-09) tiene contenido único, no un template genérico con la misma prosa. | F-09 ×6 | Comparación manual de bloques de texto |
| 9 | **BreadcrumbList JSON-LD** en páginas con jerarquía (F-09 → F-10, F-15 artículo → F-15 portada). | F-09, F-10, F-15 | Validador de datos estructurados |

---

## 2. JSON-LD por tipo de página

**NAP canónico** (fuente única, I-019 confirmado por Supervisor 2026-08-03):
- Nombre: **Veta Dorada** (marca comercial). En `LocalBusiness` → `name: "Veta Dorada"`
- Dirección: **Cra. 72a #71A 57, Bogotá, 111061, CO**
- Teléfono: **+57 302 5922101**
- Horario: **Lu-Sá 08:00-18:00**
- `openingDate`: **2014** (constitución legal HERMANOS GARCIA GONZALEZ S.A.S., NIT 901421357-9). La línea de tiempo canónica (DC-4 cerrada 2026-08-08): 1995 (tradición familiar en la construcción) → 2014 (SAS) → 2019 (fundación estudio Veta Dorada). El 1995 vive en el relato de marca; el 2019 es la fundación del estudio. El dato estructurado usa 2014 por ser la entidad legal verificable por Google.
- `priceRange`: `$$` (dos signos de dólar, proyecto de carpintería arquitectónica)
- Marca legal debajo en footer: _"Veta Dorada es una marca comercial registrada. Facturación, contratos, recaudos y garantías operados por HERMANOS GARCIA GONZALEZ SAS, NIT 901421357-9."_ (I-039)

| Página | Tipo JSON-LD primario | Tipos secundarios | Notas |
|---|---|---|---|
| **F-01 Home** | `HomeAndConstructionBusiness` + `Organization` | `WebSite` (SearchAction) | NAP completo. `areaServed`: `AdministrativeArea` → `Bogotá`. Sin `aggregateRating`. Si hay testimonios → `Review` embebido (solo con datos reales). |
| **F-02 Tienda** | `ItemList` (listado) / `Product` (detalle) | `Offer` (si tiene precio), `BreadcrumbList` | `Product` con `sku`, `image`, `description`. Precio solo si `visible_en_tienda = true`. |
| **F-03 Portafolio** | `ItemList` (listado) / `CreativeWork` (detalle) | `ImageObject` ×N, `BreadcrumbList` | Sin precios exactos (`price` no se incluye — es `precio_referencial`). `about` con ubicación del proyecto real. |
| **F-09 Landings SEO** | `Service` + `ImageObject` ×N | `BreadcrumbList`, `FAQPage` **NO** (usar Respuesta Atómica) | `Service` con `areaServed`, `provider` → Veta Dorada. Sin `aggregateRating` falso. |
| **F-11 Cómo Trabajamos** | `Service` | `HowTo` (pasos del proceso) si aplica | `HowTo` con `step` ×4 (visita → diseño → producción → entrega). |
| **F-12 Agenda tu Asesoría** | `Service` | `Offer` (dos tiers: gratuito + 3D), `Organization` (contactPoint) | `offers` con `price` solo en el tier pago ($130.000 desde parámetro ERP). `ContactPoint` con `telephone` y `contactType: "Sales"`. |
| **F-14 Pisos** | `Service` | `ImageObject` (antes/después) | Mismo patrón que F-09. |
| **F-15 Bitácora de Diseño** | `Article` o `BlogPosting` (detalle) / `Blog` (portada) | `ImageObject`, `author` → `Organization` | `datePublished`, `dateModified`, `image`. Sin `aggregateRating` falso. |
| **F-17 Cotiza tu Espacio** | `Service` | `Offer` (rangos orientativos) | Solo cuando se active (bloqueado por parámetros ERP). Sin precio exacto. |
| **F-18 Conócenos** | `Organization` + `Person` ×2 (Hugo García, Airhon J. García) | `founder`, `foundingDate: "2019"`, `foundingLocation: Bogotá` | `Person` con `jobTitle`, `description`. `foundingDate` = 2019 (fundación estudio). `Organization` con `name: "Veta Dorada"`. |
| **F-19 Para Arquitectos** | `ProfessionalService` | `ContactPoint`, `areaServed` | Sin precios visibles. `contactType: "Sales"` para prescriptores. |
| **Todas** | `Organization` (en footer/shell) + `BreadcrumbList` donde aplique | `sameAs`: Perfil de Empresa en Google, Instagram (si existe) | `sameAs` solo con URLs verificadas — no inventar perfiles. |

**Nota sobre `FurnitureStore` vs `HomeAndConstructionBusiness`:** I-020/I-036. El repo ya usa `HomeAndConstructionBusiness` en `lib/seo/jsonld.ts`. `INVS_SEO_empresas mobiliario.md` propuso `FurnitureStore`. La decisión del plan de julio fue mantener `HomeAndConstructionBusiness` (más amplio, cubre fabricación + instalación + diseño). No se cambia sin evidencia de que `FurnitureStore` tenga mejor rendimiento en las SERP colombianas.

---

## 3. Imágenes — SEO de 5 niveles

Fuente: `GUIA_SEO_IMAGENES_ESPACIOS.md` + I-032/I-038. **Los archivos de las 6 landings siguen esta convención y están rotos (I-016) — recuperar del sitio actual, no producir nuevos.**

| Nivel | Metadato | Especificación |
|---|---|---|
| 1 | **Nombre de archivo** | `{espacio}-{tipo}-{ubicacion}-{numero}.jpg` (ej. `cocinas-cocina-de-superficies-continuas-bogota-1.jpg`) |
| 2 | **Alt text** | 125-150 caracteres. Descriptivo, incluye material y contexto: _"Cocina integral en melamina RH 18mm con mesón de cuarzo, instalada en apartamento de Cedritos, Bogotá"_ |
| 3 | **Title** | Corto, complementario al alt: _"Cocina moderna en Cedritos — Veta Dorada"_ |
| 4 | **Keywords (meta)** | 3-5 términos relevantes separados por coma |
| 5 | **Caption visible (`<figcaption>`)** | 60-120 caracteres. Material + ubicación: _"Cocina integral en Cedritos, melamina RH 18mm, mesón de cuarzo Calacatta"_ |

**Especificaciones técnicas por imagen:**
- Formato: **WebP** (primario) + **JPEG** (fallback, calidad 87-90%)
- Tamaño máximo: **<500 KB** por imagen
- Dimensiones mínimas: **4000×2400 px** (para retina/zoom)
- **`aspect-ratio` explícito en CSS** en todo `<img>` — evita CLS (I-038)
- Hero con `fetchpriority="high"` + `decoding="async"` en imágenes below-the-fold
- `ImageObject` JSON-LD por cada imagen de landing/portafolio (no por cada thumbnail de tienda)

**Convención de recuperación (I-016):** los archivos del sitio legacy siguen esta convención (`vetadeoro-cocinas-*.jpg`, etc.). El plan es **recuperarlos del hosting actual de Wix** (`vetadeoro.co`) antes del corte. Si no se recuperan, se producen nuevos con fotos reales — nunca con imágenes de stock genéricas.

---

## 4. Core Web Vitals + UX técnica

Fuente: I-038, `Practicas de codigo UX y responsive.md` (sesión julio 2026). Reglas agnósticas de arquitectura, portables tal cual.

| Métrica | Objetivo | Verificación |
|---|---|---|
| **LCP** (Largest Contentful Paint) | **< 2,5 s** | Lighthouse / PageSpeed Insights |
| **INP** (Interaction to Next Paint) | **< 200 ms** | Chrome User Experience Report |
| **CLS** (Cumulative Layout Shift) | **< 0,1** | Lighthouse |

**Reglas de implementación:**
- **Tipografía fluida** con `clamp()`, no tamaños por breakpoint. Ya definido en `globals.css`: `--text-hero: clamp(2rem, calc(1.5rem + 1.8vw), 3.5rem)`.
- **Ninguna imagen sin `aspect-ratio` explícito.** Hero con `aspect-ratio` + `fetchpriority="high"`.
- **Grids responsivos sin media queries:** `repeat(auto-fill, minmax(min(100%, 320px), 1fr))`.
- **CTAs mínimo 48px de alto**, 8px de separación, en zona cómoda del pulgar — no en esquina superior.
- **`:hover` encapsulado** en `@media not all and (hover: none)`.
- **`<figcaption>` visible** con material + ubicación en toda imagen de portafolio/landing.
- **`<Suspense>` alrededor de `useSearchParams()`** y componentes que lean query params (ya verificado — `AGENTS.md` comandos).
- **`next/image`** con `priority` en hero, `loading="lazy"` en below-the-fold, `sizes` explícito.

---

## 5. Estructura de archivos afectados

| Archivo | Acción | Prioridad |
|---|---|---|
| `lib/seo/jsonld.ts` | Completar NAP real, `areaServed: AdministrativeArea → Bogotá`, sin `aggregateRating` sin datos reales | **Alta** — Bloque C |
| `app/robots.ts` | Agregar `Allow: /` para rutas públicas + user-agents de IA | **Media** — antes del corte |
| `app/sitemap.ts` | Agregar `<image:image>` a entradas de landing/portafolio, rutas F-09..F-19 | **Media** — antes del corte |
| `app/llms.txt` o `public/llms.txt` | Crear DESPUÉS del contenido final | **Baja** — post-corte |
| `next.config` o middleware | Mapa de 301 desde URLs del Wix legacy | **Alta** — en el corte |
| `app/layout.tsx` (público) | Inyectar JSON-LD `Organization` + `WebSite` en `<head>`. Breadcrumb por ruta. | **Alta** — Bloque C |
| `app/globals.css` | Ya contiene tokens D4 (Luz & Biofilia), tipografía fluida, motion. Sin cambios necesarios. | — ya está |

---

## 6. Verificación mecánica (checklist para QA)

| # | Criterio | Comando / verificación |
|---|---|---|
| V1 | `jsonld.ts` tiene NAP completo (Cra. 72a #71A 57, 302 5922101, 2014) | `grep "72a\|5922101\|openingDate.*2014" lib/seo/jsonld.ts` ≥ 3 |
| V2 | Sin `aggregateRating` hardcodeado con valor falso | `grep -r "aggregateRating\|reviewCount.*185\|ratingValue.*4.9" lib/ app/` = 0 |
| V3 | Sin `FAQPage` en JSON-LD (deprecado) | `grep -r "FAQPage" lib/ app/` = 0 |
| V4 | Sin `GeoCircle` (decisión ratificada) | `grep -r "GeoCircle" lib/ app/` = 0 |
| V5 | `robots.ts` permite bots de IA | `grep "ChatGPT-User\|GPTBot\|PerplexityBot\|ClaudeBot" app/robots.ts` ≥ 4 |
| V6 | `sitemap.ts` incluye rutas F-09 (6 landings) + F-14 + F-15 + F-18 + F-19 (y F-17 cuando se active) | `grep -c "espacios\|bitacora\|como-trabajamos\|agenda-tu-asesoria\|conocenos\|para-arquitectos" app/sitemap.ts` ≥ 6 |
| V7 | Imágenes de landing (F-09) no son 404 | `curl -I https://.../espacios/cocinas-integrales-bogota` → html contiene `<img` sin 404 en consola |
| V8 | `npx tsc --noEmit` sin errores en archivos SEO | `tsc --noEmit` sobre `lib/seo/` |
| V9 | Validación de datos estructurados | Google Rich Results Test / Schema Markup Validator sobre home, landing y producto |
| V10 | Lighthouse LCP < 2,5s, CLS < 0,1 en home + 1 landing | `npx lighthouse https://... --view` |

---

## 7. Qué NO hace este documento

- No implementa código. Las acciones de la tabla §5 son para el agente Código cuando el bucle F7 de la línea técnica llegue a las pantallas públicas.
- No reemplaza `plan_diseno_web_publica.md` — ese cubre estructura y contenido por pantalla; este cubre la capa transversal de SEO.
- No decide la migración de dominio (`vetadeoro.co` → dominio nuevo) — eso es del Supervisor y está documentado en `destilacion_docs_veta.md` §9 (secuenciar, esperar 4-8 semanas de métricas estables).
- No crea contenido. El contenido real (copy, imágenes, testimonios) es prerrequisito de las pantallas F-09..F-19.
- No toca `nucleo/` ni schema.
- **Criterio de "hecho" (C2):** el validador de datos estructurados de Google pasa sin errores ni advertencias en home + 1 landing + 1 producto + 1 artículo, y el sitemap lista todas las rutas públicas con 200. Hasta entonces, este documento es un plan, no un cierre.

---

*Fuentes: `destilacion_docs_veta.md` (pases 1-6, I-005..I-042, I-044, I-049), `plan_estructura_sitio_publico.md` (F-00..F-13), `plan_diseno_web_publica.md` (F-00..F-19, v3 2026-08-08), `plan_demanda.md` (Bloques A-F, D1-D5), `log_insights_fase2.md` (I-001..I-054), `app/globals.css` (tokens D4), `GUIA_SEO_IMAGENES_ESPACIOS.md` (5 niveles de metadatos).*
