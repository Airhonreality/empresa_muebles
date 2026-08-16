# Plan: el detalle público de portafolio genera metadata SEO/OG real en servidor

**ID de tarea**: t-134
**Zona**: sitio público (`app/(publico)/portafolio/[slug]/`) + lectura server-only en `lib/data/actions/portafolio.ts`
**Tipo**: UI / visual (conversión de patrón de renderizado, sin lógica de negocio nueva)
**Riesgo**: bajo — no toca schema ni contratos, solo mueve dónde corre la lectura existente

## Objetivo

`/portafolio/[slug]` genera `<title>`, `<meta description>` y `og:image`/`og:title`/`og:description` reales por proyecto (server-side, vía `generateMetadata()`), para que compartir el enlace en WhatsApp/Facebook/etc. muestre la foto y el título del proyecto en vez de los meta tags genéricos del sitio.

## Contexto

Hallazgo real de auditoría (2026-08-15): la página era `'use client'`, y Next.js no permite `generateMetadata()` en un Client Component — los bots de redes sociales no ejecutan JS, así que nunca veían el contenido dinámico. Se resuelve convirtiendo la página en Server Component y extrayendo toda la interactividad (lightbox, filmstrip, teclado) a un Client Component hijo que recibe el proyecto ya resuelto como prop — sin cambiar el diseño ni el comportamiento visual existente.

La lectura server-side necesita funcionar para ambos valores de `DATA_IMPL` (mock y drizzle) porque un Server Component corre fuera de `<DataStoreProvider>` (no hay `useDataStore()` ahí). Se replica el patrón ya establecido en `lib/auth/session.ts` (única precedencia en el repo de lectura dual mock/drizzle fuera de React): `DATA_IMPL=drizzle` consulta Drizzle directo; `DATA_IMPL=mock` usa `getDataStore()` (el singleton server-only, no el hook de React).

## Archivos afectados

- `app/(publico)/portafolio/[slug]/page.tsx` (reescribir): pasa a ser Server Component async con `generateMetadata()` y `export const dynamic = 'force-dynamic'` (evita que `next build` intente resolver datos reales en tiempo de build, mismo problema ya documentado en `AGENTS.md` para `/colecciones` y `/portafolio`).
- `app/(publico)/portafolio/[slug]/PortafolioDetalleClient.tsx` (crear): Client Component con el hero, filmstrip, lightbox/overlay y el JSON-LD existente — recibe `proyecto: Portafolio` ya resuelto, sin `useParams()`/`useDataStore()` propios.
- `lib/data/actions/portafolio.ts` (modificar): agrega `obtenerPortafolioPorSlugAction(slug)`, lectura dual `DATA_IMPL` (drizzle/mock) reutilizable desde cualquier Server Component o Server Action.

## Criterios de aceptación

1. `generateMetadata()` de `/portafolio/[slug]` devuelve `title`, `description` y `openGraph.images` con los datos reales del proyecto cuando el slug existe.
2. Un slug inexistente devuelve metadata de fallback ("Proyecto no encontrado") y la página renderiza el estado "no encontrado" existente, sin lanzar error.
3. El comportamiento visual/interactivo (hero, filmstrip, lightbox con teclado, JSON-LD `CreativeWork`) es idéntico al de antes de la conversión.
4. `obtenerPortafolioPorSlugAction` funciona tanto con `DATA_IMPL=mock` como con `DATA_IMPL=drizzle` (verificado por lectura de código — mismo patrón exacto de `lib/auth/session.ts:77-89`; no hay entorno con Neon real en esta sesión para probar la rama drizzle en vivo).
5. `npx tsc --noEmit` sale sin errores.
6. `npx eslint .` no agrega errores nuevos.
7. `DATA_IMPL=mock npx next build` compila las 31 rutas sin error nuevo, y `/portafolio/[slug]` aparece como ruta dinámica (`ƒ`), no estática.

## Verificación

- `npx tsc --noEmit`: criterios 1, 4, 5.
- `npx eslint "app/(publico)/portafolio/**/*.tsx" "lib/data/actions/portafolio.ts"`: criterio 6.
- `DATA_IMPL=mock npx next build`: criterios 2, 7.
- Inspección directa del diff contra el archivo original (criterio 3): mismo JSX, mismos hooks, mismas clases, único cambio es de dónde vienen los datos y el split de archivo.

## Notas

- No se pudo levantar `npm run dev` de forma estable en este sandbox para un smoke test de navegador real (el proceso no queda accesible por `curl` tras backgrounding) — pendiente que el Supervisor confirme visualmente con `npm run dev` (o el preview de Vercel una vez cortado `DATA_IMPL=drizzle`). Mismo tipo de límite que quedó documentado en t-132 (`no_verificado`, verificación de dos pestañas de navegador reales).
- Ejecutado en la misma sesión que t-133 por instrucción explícita del Supervisor (2026-08-15).
- Sienta un patrón reutilizable (Server Component + Client Component hijo + lectura dual `DATA_IMPL` vía Server Action) para el mismo problema de SEO en otras páginas públicas de detalle (`colecciones/[id]`, `bitacora/[slug]`) — no se tocaron en esta tarea, quedan fuera de alcance.
