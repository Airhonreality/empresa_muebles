# F-15 — Bitácora de Diseño (Blog / Sistema de Proyectos)

**Fecha:** 2026-08-10 · **Estado:** ejecutado 2026-08-11 · **Fase:** F7 · **Rutas:** `/bitacora`, `/bitacora/[slug]` · **Roles:** público

**Ejecutado:** entidad `bitacoraArticulos` en `lib/data/` (4 archivos), rutas `app/(publico)/bitacora/page.tsx` y `[slug]/page.tsx`, link "Bitácora" en nav pública. Semilla real: "Tipos de materiales para muebles a la medida en Bogotá" (copy de `contenido_F15_bitacora.md`, sin fabricar). Caso Jose Talero sigue bloqueado (t-113). Verificado: `tsc`/`eslint` 0, 73/73 tests.

---

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`).*

| Entidad | § REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| `bitacora_articulos` | (nueva, F-15) | id, slug, titulo, extracto, contenido_largo, categoria, imagen_portada, fecha_publicacion, autor_id, proyecto_relacionado_id | Artículos/casos de estudio publicados |
| `proyectos` | §3 | id, nombre_proyecto, direccion_obra, estado | Proyecto relacionado (si existe) para enlace a F-03 |
| `clientes` | §3 | id, nombre | Testimonio del cliente (si el caso lo incluye) |
| `modulos_artefactos` | §8 | id, tipo('imagen'), url | Imágenes intercaladas en artículos (máx. 10 por artículo) |

**Nota:** `bitacora_articulos` es tabla nueva, a crear durante implementación. El schema se define en `lib/db/schema.ts` (no dentro de este documento — ver PLANTILLA §1).

---

## 2. Estados que transiciona

*Sin estados transicionales — solo lectura pública. Campo `bitacora_articulos.publicado` controla visibilidad.*

| Estado | Uso |
|---|---|
| `publicado = true` | Artículo visible en portada y buscable por SEO |
| `publicado = false` | Borrador, solo visible en admin |

---

## 3. Vocabulario H07 (labels visibles)

| Label natural | Código interno | Entidad |
|---|---|---|
| "Bitácora de Diseño" | — | página portada |
| "Casos de Estudio" | `casos_estudio` | `bitacora_articulos.categoria` |
| "Materiales y Técnica" | `materiales_tecnica` | `bitacora_articulos.categoria` |
| "Diseño y Arquitectura" | `diseno_arquitectura` | `bitacora_articulos.categoria` |
| "Mantenimiento" | `mantenimiento` | `bitacora_articulos.categoria` |
| "¿Quiere un proyecto así?" | — | CTA final en artículos |
| "Agende su asesoría de diseño" | — | CTA botón principal → F-12 |
| "Escríbenos por WhatsApp" | — | CTA botón secundario → F-00 |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Solo `publicado=true` visibles en portada | Server: `WHERE publicado = true AND fecha_publicacion <= NOW()` | Test: `GET /api/publico/bitacora` responde solo artículos con `publicado=true` |
| R2 | Regla dura: cada artículo deriva de un proyecto real entregado (I-049) | Verificación manual en checkpoint: ¿existe caso real documentado, o es contenido genérico? | Supervisor: revisar fuente de cada artículo en `proyecto_relacionado_id` |
| R3 | Categorías preexisten y son enumeradas (no user-generated) | Server: `WHERE categoria IN ('casos_estudio', 'materiales_tecnica', 'diseno_arquitectura', 'mantenimiento')` | Test: POST artículo con categoría no permitida → 422 |
| R4 | JSON-LD `Article` o `BlogPosting` válido para cada artículo | Server: genera dinamicamente `datePublished`, `author`, `image` | Validación SEO: Schema.org validator |
| R5 | Sin `aggregateRating` falso (no "4.8 ⭐" inventado) | Server: `aggregateRating` = null en respuesta JSON-LD | Test: `grep "aggregateRating" /api/publico/bitacora/[slug]` = 0 |
| R6 | Imágenes en artículos: solo tipo='imagen', no planos de armado | Server: `WHERE tipo = 'imagen'` en `modulos_artefactos` enlazados | Test: plano_armado no debe aparecer nunca |
| R7 | Portada sin paginación infinita — links indexables a todos los artículos | Server: render completo del grid sin lazy-load (indexable por buscador) | Test: `GET /bitacora` responde 200 con todos los artículos en `<a>` tags |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `BitacoraPortada` | Server + Client | `articulos: Articulo[]` | `bitacora_articulos` | Grid `repeat(auto-fill, minmax(min(100%, 320px), 1fr))`, `aspect-ratio: 3/2` por tarjeta |
| `BitacoraCard` | Client | `articulo: Articulo, onCategoryFilter` | `bitacora_articulos` | Imagen `object-cover`, título `--font-display`, extracto `--font-sans`, fecha + categoría `--text-sm --color-text-muted` |
| `BitacoraArticulo` | Server + Client | `slug: string, articulo: Articulo` | `bitacora_articulos` | H1 `--font-display`, Respuesta Atómica `<h2>` visible, imágenes intercaladas `ImageObject` JSON-LD |
| `BitacoraHero` | Server | Ninguno (props hardcoded) | — | Título, párrafo descriptor, CTA dual |
| `TestimonioEmbebido` | Client | `testimonio: string, cliente: string` | `clientes` + testimonio en `bitacora_articulos` | Blockquote styling, `--color-bg-alt` fondo |
| `RespuestaAtomica` | Client | `pregunta: string, respuesta: string` | Contenido inline en artículo | `<h2>` visible, `--text-sm` contenido, sem.HTML |
| `BitacoraFigCaption` | Client | `ubicacion: string, fecha: string, material?: string` | Metadata de imagen | `--text-sm`, `--color-text-muted`, `--font-sans` |
| `BitacoraCTA` | Client | `href: string, variant: 'primary'\|'secondary'` | Links a F-12 / F-00 | Botones D4 existentes |

**Patrones M-06 L1 usados:** `useSearchParams` (filtro por categoría), `Suspense` (imágenes), `ImageObject` JSON-LD por imagen.

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace |
|---|---|---|---|---|---|
| 1 | Cargar portada | `/bitacora` mount | `GET /api/publico/bitacora?status=published` | — | — |
| 2 | Filtrar por categoría | Click categoría badge | `GET /api/publico/bitacora?categoria=casos_estudio` | Re-render grid | `analytics: category_filter` |
| 3 | Ver artículo | Click tarjeta | Navigate a `/bitacora/[slug]` | — | — |
| 4 | Cargar artículo | `/bitacora/[slug]` mount | `GET /api/publico/bitacora/[slug]` | Render H1 + Respuesta Atómica + imágenes + testimonio si existe | — |
| 5 | CTA "Agendar asesoría" | Click botón en artículo | Navigate a `/agenda-tu-asesoria` o abre modal | — | `cta_agendar` |
| 6 | CTA "WhatsApp" | Click botón | Open WhatsApp web (`https://wa.me/57...`) | — | `cta_whatsapp` |

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 errores en archivos de bitácora | `tsc --noEmit` |
| CA-2 | `npx eslint app/(publico)/bitacora/` = 0 errores | `npx eslint app/(publico)/bitacora/` |
| CA-3 | Solo `publicado=true` visibles en `/bitacora` | Test: `GET /api/publico/bitacora` — count respuesta = count `WHERE publicado=true` |
| CA-4 | JSON-LD `Article` válido en `/bitacora/[slug]` | `curl https://.../bitacora/[slug] \| grep "application/ld+json"` + Schema.org validator |
| CA-5 | Sin `aggregateRating` en JSON-LD (no ratings falsos) | Test: `grep "aggregateRating" /api/publico/bitacora/[slug]` = 0 |
| CA-6 | Imágenes de artículos solo tipo='imagen' (no planos) | Test: response no contiene ninguna imagen con `tipo='plano_armado'` |
| CA-7 | Portada indexable (sin paginación infinita) | Playwright: `GET /bitacora` responde con `<a href="/bitacora/[slug]">` para cada artículo |
| CA-8 | Categoria filter funciona con query param | Playwright: click categoría → URL includes `?categoria=casos_estudio`, grid re-filtra |
| CA-9 | Breadcrumb visible en artículo: "Inicio > Bitácora > [Título]" | Playwright: `/bitacora/[slug]` muestra breadcrumb con 3 niveles |
| CA-10 | Responsive: layout grid en mobile (1 col), tablet (2 cols), desktop (3+ cols) | Playwright multi-viewport test (375px, 768px, 1200px) |
| CA-11 | Al menos 1 artículo real publicado (Jose Talero u otro caso) | Query: `SELECT COUNT(*) FROM bitacora_articulos WHERE publicado=true` ≥ 1 |
| CA-12 | Copy CTA y labels sin strings sueltos — todos de H07 | `grep -r "'[A-Z]" app/(publico)/bitacora/` = 0 resultados |

---

## 8. Arquitectura de secciones por ruta

### 8.1 — Portada `/bitacora` (Index)

**Secciones esperadas en `BitacoraPortada`:**

| # | Bloque | Contenido | Justificación |
|---|---|---|---|
| 1 | Hero | H1 "Bitácora de Diseño" + párrafo descriptor + CTA dual | Declara qué es la bitácora: cuaderno de obra real, no blog genérico |
| 2 | Grid de artículos | Tarjetas con imagen, título, extracto, fecha, categoría | Descubrimiento indexable, cada card → artículo individual |
| 3 | Filtro de categorías | Botones/badges para Casos de Estudio, Materiales, Diseño, Mantenimiento | Organiza autoridad por tema |
| 4 | CTA final | "¿Quiere un proyecto así? Agende su asesoría" + WhatsApp | Aspiracional: visitante conecta historia con su propio proyecto |

**Copy exacto (verificado en `contenido_F15_bitacora.md`):**

| Elemento | Copy | Estado |
|---|---|---|
| H1 | Bitácora de Diseño | Verificado |
| Párrafo descriptor | El cuaderno de obra de Veta Dorada: proyectos reales, materiales y decisiones de diseño. Historias de espacios que se fabricaron, no imágenes de catálogo. | Verificado |
| CTA primario | Agendar asesoría de diseño | → F-12 |
| CTA secundario | Hablamos por WhatsApp | → F-00 |
| Categoría 1 | Casos de Estudio | Slug: `casos_estudio` |
| Categoría 2 | Materiales y Técnica | Slug: `materiales_tecnica` |
| Categoría 3 | Diseño y Arquitectura | Slug: `diseno_arquitectura` |
| Categoría 4 | Mantenimiento | Slug: `mantenimiento` |

**Layout visual:**

```
┌──────────────────────────────────────┐
│ Hero (BitacoraHero)                  │
│ Bitácora de Diseño                   │
│ El cuaderno de obra de Veta Dorada...│
│ [Botón: Agendar asesoría]            │
└──────────────────────────────────────┘

┌─ Categorías (Filter) ─────────────────┐
│ [Casos de Estudio] [Materiales] ...   │
└───────────────────────────────────────┘

┌─ Grid de artículos ─────────────────┐
│ [Tarjeta 1]   [Tarjeta 2]            │
│ Fecha        Fecha                   │
│ Categoría    Categoría               │
│                                      │
│ [Tarjeta 3]   [Tarjeta 4]            │
└────────────────────────────────────────┘

┌─ CTA Final ─────────────────────────┐
│ ¿Quiere un proyecto así?            │
│ Agende su asesoría + WhatsApp       │
└──────────────────────────────────────┘
```

### 8.2 — Artículo `/bitacora/[slug]` (Detail)

**Secciones esperadas en `BitacoraArticulo`:**

| # | Bloque | Contenido | Justificación |
|---|---|---|---|
| 1 | Breadcrumb | "Inicio > Bitácora > [Título Artículo]" | Contexto navegacional SEO-friendly |
| 2 | Metadata | Fecha, categoría, autor (Veta Dorada) | Credibilidad, contexto temporal |
| 3 | H1 + Respuesta Atómica | Pregunta visible como `<h2>`, respuesta 40-60 palabras | Indexable por Google, responde objeción inmediata |
| 4 | Cuerpo de contenido | Prosa 800-1500 palabras, imágenes intercaladas con `figcaption`, bloques de énfasis | Contenido de autoridad, narrativa visual |
| 5 | Testimonio embebido (si existe) | Blockquote con cliente, foto, frase clave | Prueba social real (dependiente de DC-1) |
| 6 | Galerías de imágenes | 3-10 imágenes con `figcaption` (ubicación, año, material) | Documentación visual de oficio |
| 7 | CTA final | "¿Quiere un proyecto así?" + botones F-12/F-00 | Cierre aspiracional |
| 8 | JSON-LD | `Article` o `BlogPosting` con todos los metadatos | SEO estructurado |

**Entradas programadas (semilla):**

| Entrada | Slug | Categoría | Contenido mínimo | Estado | Fuente |
|---|---|---|---|---|---|
| Caso de estudio Jose Talero | `jose-talero-proyecto` | Casos de Estudio | Proyecto real, proceso documentado, testimonio del cliente | Pendiente recuperar datos (t-113) | I-050, `contenido_F15_bitacora.md` §5 |
| Tipos de materiales para muebles a la medida en Bogotá | `tipos-de-materiales` | Materiales y Técnica | Maderas (roble, cedro, melamina RH), barnices, acabados, herrajes. 1200+ palabras. Respuesta Atómica. | Permanente de referencia (SEO cola larga) | `plan_diseno_web_publica.md` §2.2 v3 |
| Primer proyecto real Bloque D | `[slug-dinámico]` | Casos de Estudio | Proyecto documentado post-corte de V3 | Pendiente — post-corte | `plan_demanda.md` Bloque D |

---

## 9. Respuestas Atómicas indexables (por artículo)

*Cada artículo lleva una Respuesta Atómica canónica como `<h2>` visible. Ejemplos de semillas:*

| Artículo | Pregunta (H2 visible) | Respuesta (40-60 palabras) | Fuente |
|---|---|---|---|
| Tipos de materiales | ¿Qué madera es mejor para un mueble a la medida en Bogotá? | Depende del uso: roble y cedro para piezas de alto tráfico y acabados nobles, melamina RH para cocinas y closets por durabilidad a humedad. Acabado (barniz al agua o laca) protege la madera y define resultado. En asesoría te guiamos según tu espacio. | `contenido_F15_bitacora.md` RA-1 |
| Caso Jose Talero | ¿Cómo se restaura un piso de madera en Bogotá? | (Pendiente recuperar pregunta específica del proyecto) | I-050 / t-113 |

---

## 10. Testimonios embebidos

*En artículos de Casos de Estudio, si el proyecto tiene testimonio real, se embebe. Gate: `flags_testimonios_seo.md` §1.*

| # | Cliente | Proyecto | Testimonio (copy exacto) | Estado | Fuente |
|---|---|---|---|---|---|
| 1 | Jose Talero | Caso de estudio Jose Talero | Pendiente recuperar texto real del testimonio | Bloqueado — t-113 | I-050, `contenido_F13_testimonios.md` §3.2 |

---

## 11. Directorio de imágenes (Semilla José Talero)

| # | Descripción | Tipo | Origen | Alt text propuesto | Caption |
|---|---|---|---|---|---|
| 1-3 | Detalles de taller o proceso (si existen) | Artículo | Documentación I-050 | Proceso de fabricación — Veta Dorada | Proceso en taller |
| 4-8 | Fotos del proyecto (mín. 4 después del proyecto terminado) | Artículo | Documentación proyectos | [Espacio] a la medida en [barrio], Bogotá | [Espacio] terminado |
| 9-13 | Detalles de acabados/herrajes si existen | Artículo | Documentación proyectos | Detalle de [materiales] en [espacio] | Detalle de acabados |

**Total: ≥10 imágenes por artículo, recuperables de documentación de proyecto. Ninguna nueva se produce (I-016).**

---

## 12. SEO narrativo

| Elemento | Valor / Directiva | Fuente |
|---|---|---|
| `<title>` (portada) | Bitácora de Diseño — Veta Dorada | `plan_seo_2026.md` §2 |
| Meta description (portada) (150-160 chars) | Casos de estudio reales, materiales y técnica de carpintería arquitectónica a la medida en Bogotá. El cuaderno de obra de Veta Dorada. | `plan_seo_2026.md` §2 |
| JSON-LD portada | `{ "@type": "Blog", "name": "Bitácora de Diseño", ... }` | `plan_seo_2026.md` §2 |
| JSON-LD artículo | `{ "@type": "Article", "datePublished": "...", "author": { "@type": "Organization", "name": "Veta Dorada" }, ... }` | `plan_seo_2026.md` §2 |
| Tipos secundarios (artículo) | `ImageObject` por imagen, `author` → `Organization` | `plan_seo_2026.md` §2 |
| Campos requeridos (artículo) | `datePublished`, `dateModified`, `image`, `headline`, `description` — SIN `aggregateRating` | `plan_seo_2026.md` §2 |
| Slug canónico | `/bitacora`, `/bitacora/[slug]` | `plan_diseno_web_publica.md` §2.2 |
| Breadcrumb JSON-LD | `{ "@type": "BreadcrumbList", "itemListElement": [{ "name": "Inicio", ... }, { "name": "Bitácora", ... }, { "name": "[Artículo]", ... }] }` | `plan_seo_2026.md` §2 |
| `robots.txt` | Permitir indexación: `Allow: /bitacora` | `plan_seo_2026.md` §1 |
| `sitemap.xml` | Incluir `/bitacora` y `/bitacora/[slug]` para todos los artículos publicados | `plan_seo_2026.md` §1 |

---

## 13. Criterios de aceptación adicionales (verificables mecánicamente)

| # | Criterio | Verificación |
|---|---|---|
| CA-13 | Schema.org `Blog` portada válido | Schema.org validator: https://schema.org/Blog |
| CA-14 | Schema.org `Article` cada artículo válido (sin `aggregateRating` falso) | Schema.org validator por URL |
| CA-15 | Sitemap contiene `/bitacora*` | `grep -c "/bitacora" sitemap.xml` ≥ 1 + count(artículos) |
| CA-16 | Cada imagen tiene `<figcaption>` con contexto (no vacía) | `grep -c "<figcaption>" app/(publico)/bitacora/\[slug\]/page.tsx` ≥ count(imágenes) |
| CA-17 | Articulos tienen `datePublished` en formato ISO 8601 | Test: `GET /api/publico/bitacora/[slug]` → `datePublished` matches `^\d{4}-\d{2}-\d{2}T` |
| CA-18 | Testimonio (si existe) no es fake — existe en `clientes` + `contenido_F13_testimonios.md` | Supervisor: verificar que cliente_id existe y testimonio es textualmente idéntico |

---

## 14. Verificación de integridad (pre-entrega)

**Checklist antes de marcar "aprobado":**

- [ ] Toda entidad en §1 existe en REGISTRO_DE_ENTIDADES (o es tabla nueva explícitamente definida para F-15).
- [ ] Todo estado en §2 mapeado a campo `publicado` (booleano, no enum multiestado).
- [ ] Todo label en §3 existe en `contenido_F15_bitacora.md` §3.2 (Categorías) y no está inventado.
- [ ] Toda regla en §4 tiene verificación mecánica ejecutable (no "se ve bien").
- [ ] Todo componente en §5 usa tokens D4 de `app/globals.css` y patrones M-06 L1 (Suspense, SearchParams, etc.).
- [ ] Comportamiento en §6 traza a eventos E-XX o generales (analytics).
- [ ] Criterios de aceptación (§7, §13) son automatizables (tsc, eslint, Playwright, Schema.org validator, grep).
- [ ] Copy exacto en §8.1 y §9 es idéntico al de `contenido_F15_bitacora.md` — sin cambios sin checkpoint.
- [ ] Testimonio en §10 está marcado como bloqueado (`[SOLO_HUMANO]` t-113) si no existe aún.
- [ ] Imágenes en §11 son todas recuperables, ninguna requiere shoot/producción nueva.
- [ ] SEO narrativo en §12 cita fuentes (plan_seo_2026.md, plan_demanda.md) sin innovación sin aprobación.
- [ ] El doble diamante de esta PANTALLA es completo en el documento maestro de esta línea (ver § siguiente).

---

## 15. Doble Diamante — Metodología de diseño (Sección Especial)

**Nota:** F-15 Bitácora requiere Doble Diamante completo porque su estructura visual no existía en F0-F7. Las decisiones de layout y narrativa están en el documento base `plan_diseno_web_publica.md` §2.2. Este documento de diseño de PANTALLA consolida el resultado del diamante ya ejecutado.

**Fases del Diamante (síntesis — ver fuente para detalles completos):**

### 15.1 — Diverger (Descubrir — §2.2 plan_diseno_web_publica.md)

**Insights de necesidad:**
- I-037 (Luz & Biofilia): fotografía es protagonista en web editorial.
- I-049: contenido real de proyectos entregados, no genérico de IA.
- I-050: case José Talero como primer semilla documentado.
- Destilación §6.5: sitio actual no tiene canal de contenido orgánico.
- Bloques D/E plan_demanda: Sistema de Proyectos (1 proyecto → 10 fotos → 1 artículo SEO).

**Pregunta:** ¿cómo comunicar autoridad de oficio sin pretensión?
**Respuesta esperada:** Bitácora — cuaderno de obra, casos reales, contenido ligado a entregas.

### 15.2 — Converger (Definir — §2.2 convergencia)

**Reglas de juego:**
- Contenido de proyectos reales entregados, nunca genérico.
- Categorías cerradas (4 predefinidas, no user-generadas).
- Metadata editorial (fecha, categoría, ubicación) sin "badge de inventario".
- Testimonio real solo si existe (no fake).
- SEO prioritario: URL indexables, no infinite scroll.

### 15.3 — Diverger (Explorar — §2.2 aproximación de detalle)

**3 estructuras exploradas:**
1. **Blog tradicional:** list de posts, sidebar de categorías. Rechazada: demasiado genérica.
2. **Grid masonry:** todas las imágenes en galería central. Rechazada: no narrativo.
3. **Secuencia editorial (ganadora):** portada con grid de tarjetas + artículos largos con imágenes intercaladas + CTA. Elegida: narrativo, indexable, autoridad.

### 15.4 — Converger (Entregar — §8.1, §8.2 de este documento)

**Componentes + layout:** Bitácora portada grid (§8.1), Artículo H1 + RA + imágenes + CTA (§8.2).
**Tokens D4:** grid responsivo, tipografía editorial, sin badges de dashboard.
**Verificación:** criterios CA-1..CA-18 ejecutables.

---

## 16. Entrega a Agente Código

**Instrucciones concisas:**

1. Crear tabla `bitacora_articulos` en `lib/db/schema.ts` con campos: `id, slug, titulo, extracto, contenido_largo, categoria, imagen_portada, fecha_publicacion, autor_id, proyecto_relacionado_id, publicado, createdAt, updatedAt`.
2. Implementar componentes: `BitacoraPortada`, `BitacoraCard`, `BitacoraArticulo`, `BitacoraHero`, `TestimonioEmbebido`, `RespuestaAtomica`.
3. Rutas Next.js: `app/(publico)/bitacora/page.tsx` (portada), `app/(publico)/bitacora/[slug]/page.tsx` (detalle).
4. Server queries: `GET /api/publico/bitacora` (lista), `GET /api/publico/bitacora/[slug]` (detalle).
5. Insertar semilla: artículo "Tipos de materiales para muebles a la medida en Bogotá" (permanente de referencia). Otro artículo pendiente: caso Jose Talero (bloqueado t-113).
6. JSON-LD: `Blog` portada, `Article` cada artículo, `BreadcrumbList` en detalle.
7. Verificar: todos los CA-1..CA-18 antes de marcar "aprobado".

**Blockers conocidos:**
- t-113: Recuperar datos reales de proyecto Jose Talero (proceso + testimonio).
- D-parametro: Validar que CTA links a F-12 (`/agenda-tu-asesoria`) y WhatsApp (`https://wa.me/57...`) apuntan a URLs reales.

