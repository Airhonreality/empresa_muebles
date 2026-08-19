# Checklist de pendientes — auditoría SEO/pre-lanzamiento

**Fecha:** 2026-08-16 (actualizado el mismo día tras recibir `arnes/parameros de branding y data  veta dorada.txt`) · **Deriva de:** `auditoria_prelanzamiento_seo_20260815.md` + la ejecución posterior (commits `085f39d`, `9afd482`, y el commit de esta actualización en `dev`). Este documento reemplaza a esa auditoría como fuente de "qué falta" — la auditoría original queda como el registro histórico de hallazgos, este archivo es la lista de trabajo viva.

**Cómo leer la columna Dueño:** **Código** = se ejecuta con un plan aprobado, no requiere que decidas nada de negocio primero. **Javier** = requiere una decisión o dato que solo vos podés dar (dirección real, dominio, criterio de negocio) — el código no puede avanzar sin eso. **Verificación** = no es código nuevo, es correr algo contra el sitio ya desplegado (Lighthouse, validador de Google) y no se puede hacer desde este entorno.

---

## ✅ Ya resuelto (referencia — no repetir)

Fuga de snapshot completo del ERP en páginas públicas (P0), rutas PoC públicas eliminadas, `robots.txt`, `sitemap.xml`, `llms.txt`, JSON-LD del Home corregido (logo/SearchAction/foundingDate), canonical en todas las páginas públicas, JSON-LD `Product` de Colecciones conectado, imágenes rotas de pisos de madera, enlaces rotos a `/asesoria`, crash de `/cuenta/proyectos/[id]` bajo `DATA_IMPL=drizzle`.

**Resuelto 2026-08-16 (con `arnes/parameros de branding y data  veta dorada.txt`):**
- **Dominio real** (`www.vetadeoro.co`) — `SITE_URL` en `lib/seo/jsonld.ts` actualizado (propaga solo con cambiar esa constante a `robots.ts`/`sitemap.ts`/`llms.txt`/todos los `canonical`). Se corrigieron además 3 URLs hardcodeadas en `espacios/page.tsx` que seguían apuntando al dominio inventado anterior.
- **NAP completo** (`streetAddress`/`postalCode`) agregado tanto a `HomeAndConstructionBusiness` como a `Organization` en el JSON-LD del Home.
- **`legalName`/`taxID`** agregados a `Organization` (Hermanos Garcia Gonzalez SAS / NIT 901421357-9), consistente con la fórmula legal ya aprobada del footer.
- **Confirmado, sin cambios de código:** el nombre de marca ("Veta Dorada") y el eslogan ("Diseña tu espacio. Habita el bienestar.") del archivo de branding son datos legales/legacy — `plan_demanda.md` documenta ambos como decisiones de diseño ya cerradas y confirmadas por el Supervisor (renombre de marca DD-08, eslogan D1 resuelta 2026-08-09). No se tocaron.

**Resuelto 2026-08-19 (decisión de Javier en sesión):**
- **#3 CERRADO** — el Perfil de Empresa en Google ya está renombrado a "Veta Dorada". `sameAs` actualizado al link real en `lib/seo/jsonld.ts` (`https://share.google/C4ERFWARygKWHkNGO`).
- **#4 CERRADO** — Javier confirmó que las 4 reseñas reales del Google Business Profile son 5/5. El `ratingValue` 5 de los `Review` es correcto. **El Home YA es data-driven (Lote B, 2026-08-19):** lee `listarTestimoniosPublicadosAction()` y el rating sale del registro; los 4 testimonios reales están sembrados en la BD (ver `estado.md`).

---

## 🔴 Bloquea decisiones de negocio — requiere a Javier antes de que el código avance

| # | Pendiente | Por qué lo bloquea Javier | Impacto de no resolverlo |
|---|---|---|---|
| 5 | **Recuperar fotos reales de `/espacios/pisos-de-madera`** (I-016) | Las 3 imágenes originales (hero + antes/después) nunca se migraron del sitio Wix legacy. Hoy el hero usa un placeholder temporal y la sección antes/después está oculta. Necesito que me pases las fotos reales o el acceso al hosting de Wix para recuperarlas. | La landing de pisos de madera pierde su prueba visual más fuerte (antes/después) hasta que existan fotos reales — no es invisible para SEO, pero sí para conversión. |
| 16 | **`encabezado_general_veta_oro.html`** (referenciado en el archivo de branding, `ENCABEZADO_GENERAL_V1`) | El archivo no existe en el repo — no lo tengo. Si es un asset del sitio Wix legacy (header/logo viejo), probablemente no aplica al sistema de diseño D4 ya construido (`AppShell`); si es otra cosa, necesito que me lo pases. | Ninguno mientras no se confirme qué es — no bloquea nada del sitio actual, solo queda sin resolver. |
| 17 | **Datos del representante legal** (Airhon García Rozo, ID 1233506023, del mismo archivo) | Capturados pero sin uso todavía — la página F-18 "Conócenos" (que llevaría `Person` schema para los fundadores) no está construida. Se documenta acá para no perder el dato cuando se construya F-18. | Ninguno hoy — es solo un recordatorio para cuando exista esa pantalla. |

---

## 🟡 Código puede ejecutar directo — solo falta que lo pidas

| # | Pendiente | Detalle | Prioridad |
|---|---|---|---|
| 6 | **JSON-LD `Article`/`BlogPosting` en Bitácora** | `bitacora/[slug]/page.tsx` no tiene datos estructurados pese a ser el único contenido tipo blog del sitio (`datePublished`, `dateModified`, `author`, `image`). Patrón ya establecido en `lib/seo/jsonld.ts` — extenderlo es mecánico. | Media |
| 7 | **JSON-LD `CreativeWork` en Portafolio-detalle** | `portafolio/[slug]/page.tsx` no tiene JSON-LD pese a ser contenido ideal para `CreativeWork`/`ImageObject` (plan original lo pedía). | Media |
| 8 | **Open Graph / Twitter cards faltantes** | Hoy solo Portafolio-detalle tiene OG completo. Faltan en: Home, Colecciones (listado + detalle), Portafolio-listado, Bitácora-listado. Bitácora-detalle tiene OG parcial (solo imagen, sin title/description explícitos). | Media |
| 9 | **`headers()` en `next.config.ts`** | No hay cabeceras de seguridad (`X-Content-Type-Options`, `Referrer-Policy`, etc.) ni de cache explícitas para assets estáticos. | Baja |
| 10 | **`manifest.json`/`manifest.ts` + `apple-touch-icon`** | Hay `favicon.ico`/`icon.svg` pero falta soporte PWA/iOS básico (ícono al agregar a pantalla de inicio, `theme_color`). | Baja |
| 11 | **Inconsistencia `<img>` crudo vs `next/image`** | `Colecciones` (listado + detalle) y `Propuesta pública` usan `<img>` sin optimizar; el resto del sitio usa `next/image`. Pierden formato automático/lazy loading nativo. | Baja |
| 12 | **Redirects 301 desde el sitio legacy (Wix)** | No implementado — requiere primero el mapa de URLs del sitio actual (`vetadeoro.co/cocinas` → ruta nueva equivalente), que a su vez depende de que el dominio final (#1) esté decidido. | Bloqueada por #1 |

---

## ⚪ No ejecutable desde este entorno — requiere el sitio desplegado

| # | Pendiente | Cómo se verifica | Prioridad |
|---|---|---|---|
| 13 | **Core Web Vitals (LCP/INP/CLS)** | `npx lighthouse https://<preview-url> --view` contra el preview real de Vercel — el objetivo ya está documentado (`plan_seo_2026.md` §4: LCP <2.5s, INP <200ms, CLS <0.1). | Media |
| 14 | **Validador de datos estructurados de Google** | Google Rich Results Test / Schema Markup Validator sobre Home + 1 landing + 1 producto + 1 artículo, una vez el dominio (#1) esté decidido y el sitio esté en producción real. | Media |
| 15 | **Confirmar bots de IA no bloqueados en producción** | `curl -I https://vetadorada.co/robots.txt` una vez desplegado, y opcionalmente probar que ChatGPT/Perplexity efectivamente citan el sitio tras la propagación del `llms.txt`. | Baja |

---

## Próximo paso sugerido

Los ítems #6-#11 (tabla 🟡) los puedo ejecutar ya si me das luz verde — son mecánicos, mismo patrón que lo ya hecho, sin decisiones de negocio pendientes. Los de la tabla 🔴 necesitan un dato tuyo cada uno (no son trabajo de código, son información que no existe todavía en el repo). Los de la tabla ⚪ quedan para cuando haya una URL de preview real desplegada.
