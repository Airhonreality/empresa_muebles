# Diagnóstico + plan — imágenes del ERP que "se caen" (blob/hotlinks en DB viva) + ley R2 con clonado automático

- **Fecha:** 2026-09-07
- **Autor:** auditoría agéntica (asistente), para revisión de auditores externos y del Supervisor (Javier)
- **Estado:** PLAN APROBADO por Javier (2026-09-07). **EJECUCIÓN DE CÓDIGO COMPLETADA (2026-09-07): F1 y F2 implementadas** (`lib/r2/sanitize.ts` + `clonarUrlAR2` + ImagePicker auto-clona + sanitización en las 11 Server Actions), test F4 escrito (`lib/r2/sanitize.test.ts`). **Pendiente:** F4 verificación mecánica (tsc/eslint/test, requiere Node — entorno de Javier) y F3 saneamiento de datos (requiere Node + credenciales R2 `[SOLO_HUMANO]`).
- **Rama:** `dev` (V3 "Veta Dorada Real", ERP nuevo). DB viva: Neon **`v3-preview`** (`ep-muddy-cherry-at5j2mz7`).
- **Relacionado:** `arnes/estado.md` entrada 2026-09-05 (diagnóstico blob original, commit `30e0fcd`).

---

## 1. Síntoma (reportado por Javier)

Imágenes subidas al ERP nuevo ("ERP nuevo en dev") funcionaban unas horas y luego morían, repetidamente. Diagnóstico anterior (2026-09-05) atribuyó la causa a URLs `blob:` persistidas en la DB y se hizo un fix (`30e0fcd`): `ImagePicker` default `uploadToR2=true` + bloqueo de `blob:` en la UI + `sanitizarUrlsFotos()` en el cotizador. **El bug volvió / nunca se cerró del todo:** Jesús verificó que el problema aparece en el ERP nuevo (`dev`).

## 2. Diagnóstico mecánico (lectura directa de la DB viva V3_PREVIEW, 2026-09-07)

Conteo de URLs por columna de imagen en `v3-preview` (PostgreSQL 18.6, 58+ tablas):

| Tabla.columna | total | `blob:` | r2.dev | `/api/assets` | http externo |
|---|---|---|---|---|---|
| `espacio_variantes.fotosDisenio` | 7 | **7** | 0 | 0 | 0 |
| `espacio_variantes.fotosEspacio` | 85 | 0 | 78 | **7** | 0 |
| `espacio_variantes.fotosReferencia` | 0 | 0 | 0 | 0 | 0 |
| `productos_catalogo.imagen_url` | 78 | **2** | 46 | **8** | **22** |
| `portafolio.galeria_portafolio_url` | 114 | **4** | 110 | 0 | 0 |
| `portafolio.imagen_portafolio_url` | 4 | 0 | 4 | 0 | 0 |
| `renders_conceptuales.imagen_url` | 1 | **1** | 0 | 0 | 0 |
| `atributos_tecnicos.imagen_url` | 0 | — | — | — | — |
| `retomas.fotos` / `actas_entrega.fotos` / `casos_garantia.fotos` / `documentos_proyecto.url` / `productos_tienda.imagen_principal_url` | 0 | — | — | — | — |

Los 22 http externos del catálogo incluyen: Notion S3 (`prod-files-secure.s3.us-west-2.amazonaws.com`), **Vercel-preview** (`empresa-muebles-vl37-...vercel.app`), `challengerco.vteximg.com.br`, `madecentro.com`, `ventremaderas.com`, `http2.mlstatic.com`, `snoopy.archdaily.com`, `vetadeoro.co` (URLs sueltas). Los de Notion/Vercel-preview **expiran** (hotlinks a ambientes efímeros) — mismo efecto "se caen solas" que las `blob:`.

Las `blob:` **no son recuperables**: nunca existieron en R2 (URLs de memoria del navegador).

## 3. Causa raíz (código de `dev`)

La sanitización es **por-pantalla, no centralizada**. Solo el cotizador (`lib/data/actions/core.ts`, `crear/actualizarEspacioAction`) filtra `blob:`. El resto de las Server Actions de escritura de imágenes **no sanitiza nada**:

- `lib/data/actions/renders.ts:14,26` — `imagenUrl`
- `lib/data/actions/portafolio.ts:49-50,65` — `imagenPortafolioUrl`, `galeriaPortafolioUrl`; `:122` — `imagenPortada` (bitácora)
- `lib/data/actions/atributos-tecnicos.ts:17,26` — `imagenUrl`
- `lib/data/actions/f5.ts:126` (`fotos` acta entrega), `f5.ts:162` (`fotos` caso garantía)
- `lib/data/actions/f3.ts:219,224` — `fotos` retoma
- `lib/data/actions/core.ts:537-543` (`crearProductoCatalogoAction`) y `:566` (`actualizarProductoCatalogoAction`) — `imagenUrl`, `galeriaImagenesUrl`
- `lib/data/actions/f7-tienda.ts:79,86` — `imagenPrincipalUrl`
- `components/veta/reportar-garantia-modal.tsx:121` — guarda `fotosUrls: []` siempre (P-20 queda sin fotos; TODO conocido, fuera del alcance imagen-URL)

Además el `ImagePicker` tiene una **caja de URL** que acepta cualquier `https://` (solo bloquea `blob:`), por lo que pegar una URL de Vercel-preview/Notion persiste una URL efímera.

**Cada fix previo fue parcial** (`649d6da` blob default → `c952c00` R2 por pantalla → `30e0fcd` default R2 + sanitizar solo cotizador), de ahí que "vuelva a dañarse".

## 4. Hallazgo clave — el "clonado automático a R2" solo existió en legacy, nunca en V3

El supuesto "las URLs de imágenes de sitios externos pasaban por un proceso automático de clonado a R2, por eso la whitelist de fondo era estricta" fue verificado: **VERDADERO en `main` (legacy Agnostic), FALSO en `dev` (V3).**

- **En `main` sí existe:** `src/components/ui/SmartImageInput.tsx` (prop `rehostUrls ?? true`) + `src/app/api/upload/route.ts` (`persistAsset()` hace `fetch(sourceUrl, { headers de navegador })` y sube a R2; commits `e00b498`, `b023aa7`, `9654ff2`, `0ffa3f5`, `a1ed1e5`).
- **En `dev` no existe:** búsqueda en `app/ components/ lib/` → 0 matches de `SmartImageInput`, `rehostUrls`, `persistAsset`. `lib/r2/upload.ts` solo admite un `File` local; la caja "+ URL" guarda la URL tal cual.
- **Prueba en datos:** catálogo contiene hotlinks a Notion/Vercel-preview/vteximg que nunca fueron clonados. Si el clonado hubiera corrido, serían `pub-...r2.dev`.

## 5. Decisión de política (Javier, 2026-09-07)

1. **Whitelist = ley real:** desde hoy **TODA** URL que no viva en nuestro R2 (o dominio aprobado) pasa por **clonado automático a R2** antes de persistirse. El resultado final en DB es siempre `pub-...r2.dev`.
2. **Rechazo mínimo = fallback temporal:** si el clonado no es posible (URL muerta, no-imagen, error), la URL **no se guarda** y se muestra error claro al usuario. El filtro por-rechazo (`blob:`, `/api/assets`, efímeros) queda como red de seguridad transitoria mientras el clonado se vuelve la norma, para no romper el pegado de URLs legítimas que el clonado aún no cubre.
3. El clonado se implementa portando a V3 el mecanismo legacy (`persistAsset`) pero **sin el límite SSRF de legacy** (misma validación: solo `http(s)`).

## 6. Plan de ejecución

### F1 — Sanitización centralizada (código)
- Nuevo `lib/r2/sanitize.ts`: `esUrlR2(url)`, `esUrlEfimera(url)`, `sanitizarUrlsFotos(urls?, { modo })` reutilizable. Política: rechaza `blob:`, `/api/assets`, vacíos y hosts efímeros (fallback temporal); el modo estricto (whitelist) se activará al cierre del clonado.
- Aplicarla en las 11 Server Actions de escritura listadas en §3.

### F2 — Clonado automático URL→R2 (código)
- `lib/r2/upload.ts`: nueva Server Action `clonarUrlAR2(url, prefix)`: `fetch(url, { headers de navegador })` → valida contenido imagen → `optimizeImage` (sharp) → `PutObject` en R2 → devuelve `pub-...r2.dev/...`. **Devuelve `CloneResult` (`{ok,url}|{ok:false,error}`) — NUNCA lanza**: en producción Next.js reemplaza cualquier mensaje de un throw en una Server Action por el texto opaco "An error occurred in the Server Components render", ocultando la causa real (verificado 2026-09-07).
- `components/veta/image-picker.tsx`: en `agregar(url)` — si `esUrlR2(url)` se añade directo; si es URL http externa se **clona a R2** en segundo plano (estado "Clonando a R2...") y se añade la URL resultante; si falla → error + no se guarda (rechazo mínimo).

### F3 — Saneamiento de la DB viva (v3-preview) — requiere Node + credenciales R2 `[SOLO_HUMANO]`
- `blob:` → irrecuperables: limpiar/vaciar (solo registro documentado).
- `/api/assets/...` → recuperable si el archivo aún existe en legacy `storage/assets/`; re-subir a R2.
- Hotlinks Notion/Vercel-preview → clonar a R2; externos de catálogo con fetch vivo → clonar a R2.
- Scripts patrón: `scripts/fix-urls.ts`, `scripts/seed-notion.ts`, `notion-query.js`.

### F4 — Verificación y prevención
- Test `lib/r2/sanitize.test.ts` (patrón `node:assert`, sin framework).
- `npx tsc --noEmit`, `npx eslint .`, tests del módulo, `scripts/fix-urls.ts` como comprobación complementaria.
- Script reutilizable de escaneo SQL (cero blob, cero `/api/assets`) y registro del cierre en `arnes/estado.md`.

## 7. Criterios de aceptación

1. Ninguna Server Action de escritura persiste `blob:`, `/api/assets` ni URLs efímeras (Vercel-preview, Notion S3).
2. Pegar una URL externa válida en el ImagePicker la clona a R2 y guarda `pub-...r2.dev`.
3. Pegar una URL muerta/no-imagen muestra error claro y NO guarda nada.
4. DB viva (v3-preview) escaneada: 0 `blob:` + 0 `/api/assets` (tras F3).
5. `tsc --noEmit` y `eslint .` limpios.

## 8. Bloqueantes / riesgos

- **Node.js no está instalado en el entorno** (solo Python) → F1/F2/F4 se escriben pero la verificación mecánica (`tsc`/`eslint`/tests) y F3 (scripts Drizzle + credenciales R2 `[SOLO_HUMANO]`) requieren el entorno de Javier.
- El clonado en el navegador depende de la Server Action en runtime de Vercel: requiere `CF_R2_*` presentes en Production (verificadas en `.env.local` y documentadas; el `getR2Context()` lanza error claro si faltan).
- No sobrescribir decisión ARCH-012 (portafolio desacoplado de `EspacioVariante`); el clonado es por-entidad, no toca la fuente de datos.