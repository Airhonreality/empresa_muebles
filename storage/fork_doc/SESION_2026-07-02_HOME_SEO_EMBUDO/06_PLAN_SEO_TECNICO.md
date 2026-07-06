# 06 — SEO Técnico y JSON-LD

Fuentes: `plan_json_ld_dinamico.md` (arquitectura de grafo ya diseñada, no reabrir sus decisiones §1-§4), `INS_Mejores Prácticas de JSON-LD y SEO Técnico para 2026-2027.md`, `INVS_SEO_empresas mobiliario.md`. Precondición: `03_CONTRATO_SCHEMAS_ZAPS.md` ejecutado (NAP real en `configuracion_comercial`, `testimonios` existe).

## 1. Reconciliación obligatoria: `FAQPage` está deprecado

`INVS_SEO_empresas mobiliario.md` (research más antiguo, enfocado en Bogotá) propone un bloque `FAQPage` en el JSON-LD del home. `INS_Mejores Prácticas de JSON-LD...` (research 2026-2027, más reciente) es explícito: **Google retiró el soporte de rich results para `FAQPage` el 7 de mayo de 2026**, incluyendo los filtros de Search Console y la API asociada.

**Regla para el ejecutor:** no incluir `FAQPage` en el `@graph` de JSON-LD. En su lugar, usar el formato "Respuesta Atómica" (`INS_Mejores Prácticas...` §2.1): preguntas de cola larga como encabezados `<h2>` visibles en el DOM (no solo en JSON-LD), seguidas de una respuesta de 40-60 palabras en el párrafo inmediato siguiente. Este formato ya está parcialmente aplicado en el patrón de "respuesta atómica de 46 palabras" del Hero (ver `04_PLAN_HOME_BIOFILIA.md` §3.1) — extender el mismo patrón a cualquier sección de preguntas frecuentes que se agregue al Home o a silos futuros.

## 2. `src/lib/agnostic/seo/schemaGenerator.ts` (nuevo)

Ubicación: dentro de `src/lib/agnostic/` — **importante decisión de capa**: aunque `src/lib/agnostic/` está listado como directorio de motor en `CLAUDE.md` ("Engine | packages/, src/components/agnostic/, src/lib/agnostic/, src/app/api/ | Seed"), un generador de JSON-LD que lee **datos de negocio del fork** (`configuracion_comercial`, `testimonios`) no es lógica agnóstica de dominio — es lógica de negocio del fork. **Ubicarlo en `src/lib/veta/seo/schemaGenerator.ts`** (fork-owned, junto al `useGclidCapture` de `05_PLAN_EMBUDO_ARQUITECTURA.md`), no dentro de `src/lib/agnostic/`, para no violar la regla de capas de `Interfaces Custom.md` ("Un componente del engine no [puede conocer el dominio del fork]"). Si el ejecutor decide que existe ya una convención de carpeta `src/lib/veta/` o similar para código fork-owned fuera de `specialized/`, seguirla; si no existe, crearla ahí.

Forma del helper (server-side, se invoca desde `layout.tsx`/`page.tsx`, nunca desde cliente):

```ts
export function buildOrganizationSchema(config: Record<string,string>) { /* @id: #organization */ }
export function buildLocalBusinessSchema(config: Record<string,string>) { /* FurnitureStore, parentOrganization -> #organization */ }
export function buildServiceSchema(config: Record<string,string>, service: {...}) { /* provider -> #organization */ }
export function buildProductSchema(producto: AgnosticDataItem) { /* brand -> #organization, priceCurrency fijo "COP" */ }
export function buildAggregateRatingSchema(testimonios: AgnosticDataItem[]) {
  // retorna null si testimonios.length === 0 — nunca inventar rating
}
```

## 3. Capa fundacional — `src/app/layout.tsx`

Inyectar **un solo** bloque `Organization` con `@id: "https://vetadeoro.co/#organization"` (verificar el dominio real de producción con el usuario antes de fijarlo — no asumir `.co` sin confirmar). Contenido: `logo` (URL absoluta, nunca SVG inline), `contactPoint` con `+57` y `contactType: "customer service"`, `sameAs` con perfiles reales (Instagram/TikTok ya están en `configuracion_comercial`; agregar Google Business Profile si existe el enlace real — si no existe, omitir el array antes que inventar una URL).

`layout.tsx` ya carga `getVaultData([...])` con namespaces del sistema (línea 36) — extender esa llamada para incluir `configuracion_comercial` si no viene ya incluida via `SYSTEM_NS`, y pasar los valores al `schemaGenerator`. Revisar si `configuracion_comercial` es un namespace de negocio (no aparece en `SYSTEM_NS` actual) — si el patrón de carga de `layout.tsx` no soporta namespaces de negocio directamente, resolver el dato de NAP desde el propio `page.tsx` del Home en vez de `layout.tsx`, y dejar en `layout.tsx` solo lo que no depende de storage de negocio (branding estático). Documentar la decisión tomada en `07_PROGRESO_Y_CIERRE.md`.

## 4. Capa de autoridad local — Home (`page.tsx` de `/`)

Esquema `LocalBusiness`/`FurnitureStore`, **siguiendo `plan_json_ld_dinamico.md` §3.B al pie de la letra**:
- NAP desde `configuracion_comercial` (dirección real: Carrera 72A # 71A-57, Bogotá D.C.).
- `areaServed`: **sin `GeoCircle`** (decisión ya tomada en `plan_json_ld_dinamico.md` §1, ratificada por el usuario en esta sesión: "solo Bogotá, sectores de investigación"). Usar `AdministrativeArea`/`containsPlace` con los sectores confirmados por el research: Usaquén, Rosales, Chicó, Chapinero, Quinta Camacho, Teusaquillo, Cedritos, Suba norte. No agregar Chía ni municipios de sabana — el usuario fue explícito en limitar a Bogotá.
- `geo`: solo incluir si `geo_latitud`/`geo_longitud` fueron verificados (ver advertencia en `03_CONTRATO_SCHEMAS_ZAPS.md` §3) — si siguen siendo el valor referencial, **omitir el bloque `geo` del JSON-LD** en vez de publicar coordenadas sin verificar (mejor ausente que incorrecto para un dato geoespacial que Google usa para indexación S2).
- `openingHoursSpecification` desde `horario_semana`/`horario_sabado`.
- `parentOrganization` → `@id` `#organization`.
- `aggregateRating`: solo si `buildAggregateRatingSchema(testimonios)` retorna no-null (es decir, si hay registros reales en el schema `testimonios` creado en `03_CONTRATO_SCHEMAS_ZAPS.md`).

## 5. Capas futuras (no construir ahora, dejar documentado)

`plan_json_ld_dinamico.md` §3.C-D ya especifica las capas de `/diseno-de-interiores-bogota`, `/fabricacion-muebles-a-medida` y `/colecciones/[slug]` — esas rutas **no existen todavía** en `page_routes.json` (solo existen `/`, `/agendar`, `/colecciones`, `/espacios-a-medida`). Crear esas landing pages de silo es un trabajo de arquitectura de sitio mayor (research `INVS_SEO_empresas mobiliario.md` §"Arquitectura de la Información y Silos de Navegación") que excede "construir el home" — queda fuera de esta sesión. Si se aborda después, siempre debe seguir `plan_json_ld_dinamico.md` como fuente de verdad ya validada, no reabrir esas decisiones de diseño de JSON-LD.

## 6. Checklist técnico complementario

- `robots.txt`: permitir explícitamente `ChatGPT-User`, `GPTBot`, `PerplexityBot`, `ClaudeBot` (no hay razón de negocio para bloquearlos, el research los recomienda habilitar).
- `llms.txt` en la raíz del dominio: Markdown breve con servicios, materiales, cobertura (solo Bogotá) y forma de contacto — generarlo una vez el contenido del Home esté finalizado, no antes (para no quedar desactualizado).
- Core Web Vitals objetivo: LCP < 2.5s, INP < 200ms, CLS < 0.1 — verificar con Lighthouse/PageSpeed tras el rediseño, no asumir que se cumplen solo por seguir las reglas de `aspect-ratio`/`fetchpriority` de `04_PLAN_HOME_BIOFILIA.md`.
- Imágenes de portafolio: `<figcaption>` visible con material + ubicación (ej. "Cocina integral en Cedritos, melamina RH 18mm") — mayor peso SEO que el `alt` según el research, y ya es coherente con la regla de mostrar datos reales, no genéricos.
