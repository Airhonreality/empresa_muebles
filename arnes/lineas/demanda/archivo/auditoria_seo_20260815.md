# Auditoría pre-lanzamiento — Sitio público (SEO técnico, JSON-LD, robots, llms.txt)

**Fecha:** 2026-08-15 · **Autor:** sesión agente (Claude Code), a pedido directo de Javier · **Alcance:** capa técnica del sitio web público (`app/(publico)/`), verificación mecánica contra `arnes/lineas/demanda/plan_seo_2026.md`. **No cubre** el estado de migración de datos/infraestructura (ver `arnes/estado.md` — F10 en curso, Fase 2/3 de migración sin ejecutar, nada mergeado a `main`); ese es un bloqueante de lanzamiento separado y anterior a este.

**Método:** lectura directa de cada `page.tsx` público + `layout.tsx` + `middleware.ts` + `next.config.ts` + inventario de `public/`, contrastado contra los requisitos de `plan_seo_2026.md`. Cada hallazgo cita `archivo:línea`.

**Veredicto: 🔴 NO LISTO PARA LANZAMIENTO.** Hay un hallazgo crítico de fuga de datos (P0) independiente del SEO, y la capa SEO técnica está en un estado muy temprano (infraestructura básica — robots/sitemap — inexistente).

---

## Matriz de ponderación

Puntaje 0-10 por categoría (10 = cumple completamente el plan aprobado). Peso refleja impacto en riesgo de lanzamiento (seguridad/datos pesa más que pulido de metadata).

| Categoría | Peso | Puntaje | Ponderado | Estado |
|---|---:|---:|---:|---|
| A. Seguridad de datos / fugas (PII, rutas PoC públicas) | 25% | 2/10 | 0.50 | 🔴 Crítico |
| B. Infraestructura SEO (robots.txt, sitemap.xml, llms.txt, canonical, redirects) | 20% | 1/10 | 0.20 | 🔴 Crítico |
| C. JSON-LD / datos estructurados | 15% | 2/10 | 0.30 | 🔴 Crítico |
| D. Metadata on-page (title/description/OG/Twitter) | 15% | 4/10 | 0.60 | 🟠 Insuficiente |
| E. Imágenes (alt, formato, roturas) | 10% | 5/10 | 0.50 | 🟠 Insuficiente |
| F. Core Web Vitals / técnica (headers, iconos, manifest) | 8% | 5/10 | 0.40 | 🟡 Parcial |
| G. Arquitectura de enlaces / dominio | 7% | 3/10 | 0.21 | 🟠 Insuficiente |
| **Total** | **100%** | — | **2.71/10 (~27%)** | 🔴 **NO-GO** |

**Umbral de lanzamiento sugerido:** ≥7.5/10 con cero hallazgos P0. Hoy: 2.71/10 con 1 P0 abierto.

---

## P0 — Bloqueantes, no se lanza con esto abierto

### P0-1. Fuga de datos de cliente sin autenticación — `/propuesta/[proyectoId]`
`app/(publico)/propuesta/[proyectoId]/page.tsx:1` es `'use client'` **sin ningún guard de sesión** (no llama `requireSesionCliente` ni equivalente). `middleware.ts:47` solo cubre `/erp/:path*` — esta ruta queda totalmente abierta.

Con solo conocer o adivinar un `proyectoId`, cualquiera (incluido Google, porque no hay `noindex`) puede ver:
- Dirección real de la obra del cliente: `direccionObra` renderizado en texto plano (`page.tsx:332`).
- Montos financieros completos del proyecto: materiales, mano de obra, descuentos, IVA, total (`page.tsx:509-524, 552-567`).
- Nombre del proyecto y del cliente (`page.tsx:313, 329-330`).

Esto es el mismo tipo de hallazgo que ya se corrigió una vez en el portafolio público (D-01, ronda 4, `estado.md` línea 25) — reapareció en una ruta distinta que nunca se auditó con ese criterio. **Comparar con el patrón correcto:** `app/(publico)/cuenta/proyectos/[proyectoId]/page.tsx:14-23` sí hace el guard + verificación de ownership; `/propuesta/[proyectoId]` no lo replica.

**Acción:** exigir sesión de cliente + verificación de ownership (mismo patrón que `/cuenta/proyectos/[proyectoId]`), o mover el flujo de "propuesta pública" a un token de acceso firmado si el caso de uso es compartir sin cuenta (aclarar con Javier cuál es el uso previsto antes de tocar código — es zona `lib/auth`/`lib/data`, riesgo alto).

### P0-2. Rutas de PoC/ERP servidas como páginas públicas indexables
`app/(publico)/cotizador/page.tsx` y `app/(publico)/cronograma/page.tsx` son kanbans/tableros internos marcados en su propio comentario como "PoC D4" (`cotizador/page.tsx:11-12`, `cronograma/page.tsx:6-8`), con nombres de clientes ficticios pero creíbles ("Casa Río", "Cocina Márquez", etc., `cotizador/page.tsx:30-45`) y nombres de empleados (`cronograma/page.tsx:29,35,49`). Son `'use client'`, sin `metadata`, sin `noindex`, sin auth — quedan en el árbol de rutas públicas (`app/(publico)/`) e indexables por defecto.

**Acción:** o se mueven fuera de `(publico)` (a `/erp/` donde ya hay gate), o se borran si eran solo demos del Diamante 4, o se les pone `noindex` + auth explícita antes del corte. No deberían convivir con contenido de marketing real bajo el mismo layout público.

---

## P1 — Antes de lanzar (bloquea el checklist de `plan_seo_2026.md`, no bloquea funcionalmente)

### P1-1. No existe infraestructura SEO básica
Confirmado por ausencia total en el filesystem:
- No hay `app/robots.ts` ni `public/robots.txt` → sin ese archivo, la mayoría de crawlers asumen rastreo libre por defecto, pero **no hay control explícito** (no se puede permitir bots de IA a propósito, no se puede bloquear `/cuenta`, `/cotizador`, `/cronograma` como pide P0-2).
- No hay `app/sitemap.ts` ni `public/sitemap.xml`.
- No hay `public/llms.txt`.
- No hay `lib/seo/jsonld.ts` (el JSON-LD vive inline en 2 páginas, no centralizado — ver C).

`plan_seo_2026.md` (líneas 5, 116-119) afirma que estos archivos ya existen ("el único artefacto SEO vivo... es `lib/seo/jsonld.ts`... y `app/robots.ts`/`app/sitemap.ts`") — **ese texto está desactualizado respecto al código real**, hay que corregirlo o fue escrito prospectivamente y nunca se ejecutó.

### P1-2. Cero páginas tienen `<link rel="canonical">` / `alternates.canonical`
Verificado en las 11 páginas públicas revisadas — ninguna define canonical. Sin sitemap ni canonical, Google decide por su cuenta qué versión de cada URL indexar (riesgo real con query params o trailing slashes).

### P1-3. Home (`/`, la página más importante del sitio) no puede tener metadata propia
`app/(publico)/page.tsx:1` es `'use client'` → Next.js prohíbe `export const metadata`/`generateMetadata` en Client Components. Hoy hereda el `title`/`description` genérico del root layout (`app/layout.tsx:42-46`), que además es el mismo `title`/`description` que heredan TODAS las páginas sin metadata propia (colecciones, portafolio-listado, cronograma, cotizador, propuesta) — **múltiples URLs distintas compitiendo con el mismo title/description**, señal de contenido duplicado para Google.

**Acción:** partir Home en un Server Component wrapper con `metadata` + un Client Component interno para la interactividad (mismo patrón que ya usan `portafolio/[slug]/page.tsx` y `bitacora/[slug]/page.tsx`, que sí resolvieron esto).

### P1-4. JSON-LD del home tiene 3 defectos que fallarían el validador de Google
`app/(publico)/page.tsx:143-211`:
- `logo: 'https://vetadorada.co/logo.png'` (línea 181) — ese archivo **no existe** en `public/` (solo hay `logo-veta-negative.svg`/`logo-veta-positive.svg`). URL rota en un campo que Google sí valida.
- `potentialAction.SearchAction` con `urlTemplate: 'https://vetadorada.co/buscar?q={search_term_string}'` (línea 205) — la ruta `/buscar` **no existe** en el proyecto (verificado, sin resultados). Es una `SearchAction` que no funciona; el validador de Rich Results la marcará como inválida.
- `foundingDate: '1995'` (línea 192) en el bloque `Organization` — contradice la decisión ya documentada en el propio `plan_seo_2026.md:43`: *"El dato estructurado usa 2014 por ser la entidad legal verificable por Google"* (1995 es la narrativa de marca, no el dato para JSON-LD). Usar una fecha no verificable en un campo que Google puede auditar es exactamente el riesgo que el plan (línea 3) advierte: *"los datos estructurados mal aplicados pueden acarrear acción manual de Google"*.
- `sameAs: ['https://www.google.com/maps/place/Veta+Dorada']` (línea 184) — URL de búsqueda genérica, no un Place ID verificado. El plan (línea 60) exige `sameAs` *"solo con URLs verificadas — no inventar perfiles"*.
- Dirección (`address`, líneas 185-190) sin `streetAddress` ni `postalCode` — el NAP completo que pide el plan (línea 40-41: `Cra. 72a #71A 57, Bogotá, 111061`) no está en el código, solo ciudad/país genéricos.

### P1-5. JSON-LD casi no existe fuera del home
Solo `page.tsx` (home) y `espacios/page.tsx` tienen `<script type="application/ld+json">`. El plan (`plan_seo_2026.md` §2, tabla completa) pide JSON-LD específico en Tienda (`Product`/`ItemList`), Portafolio (`CreativeWork`/`ItemList`), Bitácora (`Article`/`Blog`), y todas las landings futuras. Hoy:
- `colecciones/[id]/page.tsx:74-92` **construye** `productJsonLd` con `@type: 'Product'` pero **nunca lo inyecta en un `<script>`** — código muerto, cero efecto real.
- `portafolio/[slug]/page.tsx` no tiene ningún JSON-LD pese a ser contenido de "caso" ideal para `CreativeWork`.
- `bitacora/[slug]/page.tsx` no tiene `Article`/`BlogPosting` pese a ser el único contenido tipo blog del sitio.

### P1-6. Imágenes rotas en una página ya publicada en el árbol de rutas
`app/(publico)/espacios/pisos-de-madera/page.tsx:15,89,93` referencia 3 imágenes bajo `/images/portafolio/reales/*.png` que **no existen** en `public/` (verificado — `public/images/` solo tiene el subdirectorio `home/` con `.webp`). Esta página se rompe visualmente (hero + antes/después vacíos) para cualquier visitante o crawler que la abra hoy.

### P1-7. Enlace interno roto: `/asesoria`
Referenciado en `espacios/pisos-de-madera/page.tsx:31,118` y `bitacora/[slug]/page.tsx:138`, pero no existe ninguna ruta `app/(publico)/asesoria/**`. Cada clic termina en 404 — esto también es la ruta que `plan_seo_2026.md` llama F-12 "Agenda tu Asesoría", ya identificada como pantalla sin diseñar (ver `estado.md`, DP-04, CTA "Agenda tu Asesoría" diferido explícitamente).

---

## P2 — Antes del corte a producción, no bloquea preview

- **Sin Open Graph/Twitter cards** en Home, Colecciones, Portafolio-listado, Bitácora-listado, Cronograma, Cotizador, Propuesta. Solo `portafolio/[slug]` (parcial, sin `twitter`) y `bitacora/[slug]` (solo `openGraph.images`, sin `title`/`description` explícitos) tienen algo.
- **Sin redirects 301 desde el sitio legacy** (`vetadeoro.co` → dominio nuevo) — `next.config.ts` no tiene `redirects()` (confirmado, archivo de 13 líneas solo con `images.remotePatterns`).
- **Sin `headers()`** en `next.config.ts` — sin cabeceras de seguridad/cache explícitas.
- **Sin `apple-touch-icon` ni `manifest.json`/`manifest.ts`** — hay `app/favicon.ico` y `app/icon.svg`, pero falta soporte PWA/iOS básico.
- **Dominio sin decidir, pero ya hardcodeado.** El JSON-LD asume `https://vetadorada.co` en 6+ lugares (`page.tsx:148,152,178,180,181,196,197,205`), pero `plan_seo_2026.md:147` dice explícitamente que la migración de dominio *"es del Supervisor"* y sigue sin decidirse. Si el dominio final es otro, hay que revisar/actualizar todo el bloque JSON-LD, no solo el DNS.
- **Inconsistencia `<img>` crudo vs `next/image`.** Home/Espacios/Portafolio-listado/Bitácora usan `next/image`; Colecciones (listado y detalle) y Propuesta usan `<img>` crudo sin `next/image` — pierden optimización automática (formato, `sizes`, lazy loading nativo) que el resto del sitio sí tiene.
- **Alt text genérico o vacío en varios puntos:** `colecciones/page.tsx:29` cae a `'Producto'` si falta descripción; `propuesta/[proyectoId]/page.tsx:90` tiene `alt=""` en una miniatura.
- **`ratingValue: '5'` fijo para las 4 reseñas** (`page.tsx:161`) — no es `aggregateRating` fabricado (la regla explícita que el plan prohíbe), pero 4 reseñas reales con el mismo rating perfecto sin variación es una señal que vale la pena confirmar contra el Google Business Profile real antes de publicar, para no quedar expuesto si alguna reseña real no era 5 estrellas.

---

## ✅ Lo que sí está bien encaminado

- **Middleware de `/erp/**` funciona correctamente** (`middleware.ts`) — gatea todo el ERP, con fallo seguro (bloquea si falta `SESSION_SECRET`, no abre por accidente).
- **Portal cliente (`/cuenta/**`) tiene guard de sesión + ownership** en las 3 páginas que lo necesitan (`cuenta/page.tsx`, `cuenta/garantia/page.tsx`, `cuenta/proyectos/[proyectoId]/page.tsx`) — este es el patrón correcto que falta replicar en P0-1.
- **`portafolio/[slug]/page.tsx` y `bitacora/[slug]/page.tsx`** ya resolvieron correctamente el problema de "Client Component no puede tener metadata": son Server Components con `generateMetadata()` + Open Graph parcial. Es el patrón a copiar para Home (P1-3).
- **Imágenes del home** (`lib/seo/home-images.ts`) tienen alt descriptivo real (no genérico), formato `.webp`, y usan `next/image` — el nivel de calidad que pide `plan_seo_2026.md` §3, aplicado consistentemente ahí.
- **`espacios/page.tsx` tiene `BreadcrumbList` + `ItemList` en JSON-LD** (líneas 97-128) — es el único ejemplo de JSON-LD "secundario" bien implementado del sitio, sin PII ni datos fabricados.
- **`SESSION_SECRET` en Preview** — corregido en esta misma sesión (ver más abajo): faltaba en el entorno Preview de Vercel, causaba fallo de build en `/cuenta/garantia` y cualquier ruta que toque sesión. Ya está agregado con un valor propio (distinto al de Production).

---

## Corrección aplicada durante esta auditoría (no relacionada con SEO, pero bloqueaba el build de Preview)

Javier reportó en vivo un error de build (`SESSION_SECRET no definida en el entorno`, fallando en `/cuenta/garantia`). Se verificó con `vercel env ls`: `SESSION_SECRET` solo estaba configurada para **Production**, no para **Preview** (a diferencia de `DATABASE_URL`/`CF_R2_*`, que sí cubren ambos entornos). Se generó un valor aleatorio nuevo (`openssl rand -base64 32`) y se agregó vía `vercel env add SESSION_SECRET preview` — **valor distinto al de Production**, para que las sesiones de Preview no sean decodificables con la clave real. No se tocó ni se leyó el valor de Production. El próximo deploy de `dev` a Preview debería pasar ese punto del build.

---

## Checklist mecánico — estado contra `plan_seo_2026.md` §6 (V1-V10)

| # | Criterio | Resultado |
|---|---|---|
| V1 | NAP completo en JSON-LD (dirección, teléfono, `openingDate` 2014) | 🔴 Falla — sin `streetAddress`/`postalCode`, `foundingDate` usa 1995 no 2014 |
| V2 | Sin `aggregateRating` hardcodeado falso | 🟡 Pasa en sentido estricto (no hay `aggregateRating`), pero `ratingValue` fijo en cada `Review` amerita confirmación |
| V3 | Sin `FAQPage` | ✅ Pasa (no se encontró) |
| V4 | Sin `GeoCircle` | ✅ Pasa (no se encontró) |
| V5 | `robots.ts` permite bots de IA | 🔴 Falla — no existe `robots.ts` |
| V6 | `sitemap.ts` incluye rutas F-09/F-14/F-15/F-18/F-19 | 🔴 Falla — no existe `sitemap.ts` |
| V7 | Imágenes de landing no son 404 | 🔴 Falla — 3 imágenes rotas en `pisos-de-madera` |
| V8 | `tsc --noEmit` sin errores en `lib/seo/` | 🟡 No aplica todavía — `lib/seo/` solo tiene `home-images.ts`/`portafolio-images.ts`, no `jsonld.ts` |
| V9 | Validación de datos estructurados (Rich Results Test) | 🔴 Falla previsible — `logo.png` roto y `SearchAction` a ruta inexistente invalidarían el test |
| V10 | Lighthouse LCP/CLS | ⚪ No verificable en este entorno (requiere sitio desplegado) |

**2/10 verificables pasan limpio.**

---

## Próximo paso sugerido (para decisión de Javier, no ejecutado en esta sesión)

1. **P0-1 y P0-2 primero** — son fuga de datos y contenido de PoC público, no SEO. Bloquean lanzamiento independientemente de todo lo demás.
2. Crear `app/robots.ts` + `app/sitemap.ts` + centralizar JSON-LD en `lib/seo/jsonld.ts` (le da un solo lugar para corregir NAP/foundingDate/sameAs/logo de una vez, en vez de 2 páginas con JSON-LD inline divergente).
3. Corregir Home a Server Component + `generateMetadata` (P1-3) — desbloquea metadata única para la página más importante del sitio.
4. `llms.txt` queda para el final a propósito (así lo pide el propio plan, línea 28: después de que el contenido esté cerrado) — no es bloqueante hoy.
5. Confirmar dominio final con el Supervisor antes de commitear el JSON-LD reescrito — hoy todo apunta a `vetadorada.co` sin decisión registrada.

Esto es un plan de código (toca `app/`, posiblemente `lib/seo/` nuevo) — por `AGENTS.md`, requiere que el Iniciador escriba un plan aprobado antes de tocar código, no se ejecuta directo desde esta auditoría.
