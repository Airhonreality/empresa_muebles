# F-01 — Home / Landing Principal

**Fecha:** 2026-08-12 · **Estado:** aprobado-retroactivo (checkpoint 2026-08-12) · **Fase:** F7 / bucle F-web · **Ruta:** `/` (`app/(publico)/page.tsx`) · **Roles:** público · **Arquetipo:** Creador Experto (D2)

**Retroactividad (contrato inverso, 2026-08-12):** esta pantalla se **codificó sin `disenio_FXX.md` previo** — desvío de proceso detectado en el cierre de la web pública. `app/(publico)/page.tsx` se construyó en el ciclo D-10 (2026-08-10) directo desde `contenido_F01_home.md` (copy aprobado 2026-08-09), y se re-auditó en D-17. Este documento formaliza el diseño **ya ejecutado**, traza cada sección contra el código real (cita archivo:línea) y lista en §13 **las desviaciones que deben corregirse** — ninguna se acepta como decisión.

**Ejecutado:** `app/(publico)/page.tsx` (395 líneas, `'use client'`), JSON-LD in-page `HomeAndConstructionBusiness` + `Organization` + `WebSite`, CTAs a WhatsApp (sustituto temporal), placeholders de imagen (pendiente I-016). Verificación del cierre: `tsc`/`eslint` 0, D-17 resuelto (verificado 2026-08-12).

---

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`). No redefinas schemas aquí.*

| Entidad | § del REGISTRO | Método / campo usado | Uso en esta pantalla |
|---|---|---|---|
| `portafolio` | §10 · publicaciones | `store.portafolio.publicados()` → `Portafolio` (`lib/data/contracts.ts:1171`) | Sección "Proyectos realizados" — teaser de 3 (`page.tsx:130`, `301-326`) |
| `proyectos` | §3 Comercial | `Portafolio.proyectoId` (origen) | No se consulta directo; el portafolio ya viene expandido |

**Nota:** la Home es página estática + `useDataStore()` para los proyectos destacados. No consume `parametros`, `testimonios` ni `bitacora_articulos` todavía.

---

## 2. Estados que transiciona

*Sin estados transicionales — solo lectura pública, `'use client'` sin mutación.*

| Estado | Uso |
|---|---|
| `portafolio.publicados() = true` | Solo proyectos publicados entran al teaser (`page.tsx:130`) |
| `destacado`/`orden` | Orden del teaser: destacado → orden (R1/R4 del store) |

---

## 3. Vocabulario H07 (labels visibles)

*Cita del `glosario_h07.md` / `contenido_F01_home.md` §3. Todo copy es textual del doc de contenido aprobado.*

| Label natural | Código interno | Fuente |
|---|---|---|
| "Carpintería arquitectónica. Diseñamos, fabricamos, instalamos." | H1 hero | `contenido_F01_home.md` §3.1 |
| "Diseña tu espacio. Habita el bienestar." | Eslogan (D1) | `plan_demanda.md` §1, aprobado 2026-08-09 |
| "Agenda tu asesoría gratuita" / "Hablamos por WhatsApp" | CTA hero dual | `contenido_F01_home.md` §3.1 |
| "Disminuye la incertidumbre" / "Punto de Fábrica Directo" / "Asesoría con diseñadores" | 3 cards Validación | `contenido_F01_home.md` §3.3 |
| "Conocemos la arquitectura de Bogotá." | H2 Conocemos Bogotá | §3.4 (copy textual) |
| "Espacios que creamos" | H2 grid | §3.5 |
| "Cómo trabajamos" | H2 4 pasos | §3.6 |
| "Proyectos que hablan por nosotros" | H2 teaser proyectos | §3.7 |
| "Tres generaciones construyendo. Un estudio diseñando." | H2 Conócenos teaser | §3.8 |
| "¿Cuánto cuesta un mueble a la medida en Bogotá?" | RA-2 (precio) | §3.9 |
| "Lo que dicen nuestros clientes" | H2 testimonios | §3.10 |
| "¿Hablamos de tu espacio?" | H2 CTA final | §3.11 |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Copy textual de `contenido_F01_home.md` — no inventar (anti-invención I-049) | Comparación manual por sección | `grep` por label en fuente vs `page.tsx` |
| R2 | Ningún `<Link>` apunta a ruta inexistente (ningún 404) | Solo existe `/portafolio`, `/colecciones`, `/bitacora`, `/cuenta` en el prototipo | Recorrer `href` de `page.tsx` contra rutas reales (`app/(publico)/`) |
| R3 | Sin `aggregateRating` fabricado en JSON-LD (anti-invención #1) | `page.tsx:134-202` no incluye `aggregateRating` | `grep -c aggregateRating app\(publico)/page.tsx` = 0 |
| R4 | Los `review` del JSON-LD son testimonios reales de GBP (I-019), textuales | Curados vs `contenido_F13_testimonios.md` | Comparar `TESTIMONIOS` (`page.tsx:115-126`) contra fuente |
| R5 | Proyectos del teaser vienen de `portafolio.publicados()`, no codificados a mano | `page.tsx:130` | Leer fuente |
| R6 | Sin precios en el teaser de portafolio (decisión D-14/F-03) | Portafolio.Ficha no expone `precioReferencial` en la Home | `grep -c precioReferencial app\(publico)/page.tsx` = 0 |
| R7 | Los CTA de contacto convergen a WhatsApp (único canal real hoy), con URL aprobada | `page.tsx:16-17` = `wa.me/573025922101` | Leer `WHATSAPP_URL` |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `Home` (default export) | Client | `useDataStore()` | `portafolio` | `page.tsx:128` |
| `CtaPrimary` / `CtaSecondary` | Server-less helper | `href: string, children` | — | `gold-600/700`, `gold-400` (`page.tsx:19-53`) |
| `ImagenPlaceholder` | Helper | `inicial: string, className?` | — | `bg-bg-alt`, `font-display`, `gold-300/40` (`page.tsx:55-61`) |
| JSON-LD in-page | `<script ld+json>` | `@graph` 3 tipos | — | — (`page.tsx:388-392`) |

**Patrones M-06 L1 usados:** `useDataStore()` (reactividad), `Link` de `next/link`, `a` externo con `target=_blank rel=noopener` para WhatsApp.

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace |
|---|---|---|---|---|---|
| 1 | Cargar Home | `/` mount | `store.portafolio.publicados().slice(0,3)` | Render 10 secciones | — |
| 2 | CTA hero / CTA final | Click | Abre WhatsApp (`a externa`) | — | `cta_whatsapp` |
| 3 | Card "Espacios que creamos" | Click | Abre WhatsApp (sustituto — **desviación**, ver §13) | — | `cta_espacio` |
| 4 | Teaser proyecto | Click | Navigate a `/portafolio/[slug]` | — | `cta_proyecto` |
| 5 | "Ver portafolio completo" / "Ver todos los espacios" | Click | Navigate a `/portafolio` | — | `cta_portafolio` |

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 errores | `tsc --noEmit` |
| CA-2 | `eslint` = 0 en la pantalla | `npx eslint "app/(publico)/page.tsx"` |
| CA-3 | Ningún `href` apunta a ruta 404 del prototipo | Recorrer hrefs contra `app/(publico)/` |
| CA-4 | JSON-LD in-page presente y sin `aggregateRating` | `grep -c "ld+json"` ≥ 1 y `grep -c aggregateRating` = 0 |
| CA-5 | Las 10 secciones del contenido presentes en orden | Recorrer `page.tsx` vs `contenido_F01_home.md` §2 |
| CA-6 | Teaser usa `publicados()` real (no codificado) | Leer `page.tsx:130` |
| CA-7 | Copy de H1/eslogan textual del doc aprobado | Diff textual |
| CA-8 | Metadata de `app/layout.tsx` coincide con §12 (D-17 resuelto) | Leer `layout.tsx:30-34` |

---

## 8. Arquitectura de secciones por ruta

**Única ruta:** `/`. Las 10 secciones implementadas en `page.tsx` (orden verificado en D-17, coincide con `contenido_F01_home.md` §2):

| # | Bloque | `page.tsx` | Contenido |
|---|---|---|---|
| 1 | Hero | `206-232` | H1 + eslogan + descriptor + CTA dual + RA-1 ("¿Qué es Veta Dorada?" al pie del hero) |
| 2 | Validación Técnica | `234-245` | 3 cards con íconos `lucide` |
| 3 | Conocemos Bogotá | `247-261` | H2 textual + CTA "Agendar una visita a mi espacio" → WhatsApp |
| 4 | Espacios que creamos | `263-283` | Grid 7 categorías (cada card → WhatsApp, **desviación**); CTA "Ver todos los espacios" → `/portafolio` |
| 5 | Cómo trabajamos | `285-299` | 4 pasos numerados. **Sin CTA "Conoce el proceso completo" (desviación)** |
| 6 | Proyectos realizados | `301-326` | Teaser `publicados()[0..2]` → `/portafolio/[slug]`; CTA → `/portafolio` |
| 7 | Conócenos (teaser) | `328-340` | H2 + párrafo. **Sin CTA "Conoce nuestra historia" (desviación)** |
| 8 | RA-2 (precio) | `342-355` | "¿Cuánto cuesta un mueble a la medida en Bogotá?" + CTA → WhatsApp |
| 9 | Testimonios | `357-373` | 4 reseñas GBP reales, nombre + texto + "Reseña en Google" |
| 10 | CTA final | `375-386` | H2 + CTA dual → WhatsApp (primario debería ir a F-12, **desviación**) |

---

## 9. Respuestas Atómicas indexables

| # | Pregunta (H2 visible) | Respuesta (resumen) | Estado | Fuente |
|---|---|---|---|---|
| RA-1 | ¿Qué es Veta Dorada? | Estudio de carpintería arquitectónica en Bogotá. Diseño + fabricación + instalación sin intermediarios (~46 palabras). | Verificado — implementada como `<h2>` al pie del hero (`page.tsx:222-230`) | `contenido_F01_home.md` §3.2 |
| RA-2 | ¿Cuánto cuesta un mueble a la medida en Bogotá? | Depende del espacio, materiales y diseño; la respuesta honesta deriva a visita sin costo (~50 palabras). | Verificado — sección 8 (`page.tsx:342-355`) | `contenido_F01_home.md` §3.9 |

---

## 10. Testimonios embebidos

*Testimonios reales curados (I-019, reseñas de Google Business Profile), copy textual de `contenido_F01_home.md` §5 y `contenido_F13_testimonios.md`. Sin `aggregateRating`. DC-1 resuelta 2026-08-09.*

| # | Cliente | Testimonio (copy exacto) | Estado | Fuente |
|---|---|---|---|---|
| 1 | Glenda Danuro | "Cumplieron muy buen trabajo." | Implementado (`page.tsx:116`) | I-019 GBP |
| 2 | Daniela Barón Esparza | "Muy cumplidos y dedicados. El modelo de mi cocina quedó tal cual como lo pedí. La calidad de su trabajo es excelente." | Implementado (`page.tsx:118-120`) | I-019 GBP |
| 3 | Juan Spiro | "Excelente trabajo muy recomendados" | Implementado (`page.tsx:121`) | I-019 GBP |
| 4 | Madeline Attara | "Agradecida con los trabajos obtenidos. Muy buen servicio pre y post venta. Super recomendado." | Implementado (`page.tsx:123-125`) | I-019 GBP |
| — | Jose Talero | Pendiente de recuperar texto (t-113) | **No implementado** — bloqueado | I-050 |

**Desviación (§13):** el diseño pide nombre + **barrio + tipo de proyecto** (protocolo I-013); la implementación muestra solo nombre + texto + "Reseña en Google".

---

## 11. Directorio de imágenes

*Ninguna fotografía real disponible en el entorno del prototipo — se usa `ImagenPlaceholder` (inicial sobre `bg-bg-alt`), mismo patrón que `PortafolioCard` (D-01). Sin fotos fabricadas (I-049).*

| # | Descripción | Tipo | Origen | Estado |
|---|---|---|---|---|
| 1 | Hero — foto de espacio terminado con luz natural | Hero | Recuperar (I-016) del sitio actual | **Pendiente** — hoy sin imagen (bg alt) |
| 2 | 7 categorías de espacios (`page.tsx:84-92`) | Grid cards | Recuperar 6 landings (I-016); F-14 requiere antes/después | **Pendiente** — `ImagenPlaceholder` |
| 3 | 3 proyectos del teaser | Portafolio 16:9 | Documentación de proyectos reales | **Pendiente** — `ImagenPlaceholder` (`page.tsx:314`) |

---

## 12. SEO narrativo

*Cross-reference con `plan_seo_2026.md` §2 (tabla F-01).*

| Elemento | Valor / Directiva | Fuente |
|---|---|---|
| `<title>` | "Veta Dorada — Carpintería arquitectónica en Bogotá" | `app/layout.tsx:31` — **D-17 resuelto** (antes sin "Bogotá") |
| Meta description | "Estudio de carpintería arquitectónica en Bogotá. Diseñamos, fabricamos e instalamos cocinas, closets, centros de entretenimiento y espacios integrales en madera a la medida. Tres generaciones de oficio." | `app/layout.tsx:32-34` — coincide con §7 del contenido |
| Tipo JSON-LD primario | `HomeAndConstructionBusiness` + `Organization` | `page.tsx:134-202` |
| Tipos secundarios | `WebSite` con `SearchAction` | `page.tsx:186-200` |
| `review` (×4) | Testimonios reales GBP con `Rating 5` — sin `aggregateRating` | `page.tsx:148-165` |
| Slug canónico | `/` | — |
| `llms.txt` | Descripción de 1 línea (1 fila en `contenido_F01_home.md` §7) | pendiente de subsistema |

**Nota de método:** el JSON-LD de F-01 vive in-page (`page.tsx`), no en `app/layout.tsx`. El `metadata` global del layout ya quedó alineado (D-17).

---

## 13. Desviaciones detectadas y acciones (contrato inverso — ninguna se acepta como decisión)

*Esta sección es la razón de ser del documento retroactivo. Cada desviación es una **tarea de alineación pendiente**, registrada en `backlog_auditoria_pantallas.md` con su bloqueador. Se corrige en cuanto el bloqueador exista o se decida.*

| # | Sección | Diseño pide | Código hace hoy | Acción requerida | Bloqueador |
|---|---|---|---|---|---|
| D-01-1 | Hero fondo | Foto real o token D4 `--color-bg-linen` | `bg-bg-alt` en hero (`page.tsx:207`) — valor idéntico a `--color-linen-100` en `globals.css:13` | Alinear referencia de token (decidir: normalizar a `bg-linen` o documentar equivalencia) | decisión token / I-016 |
| D-01-2 | Hero CTA primario | → F-12 `/agenda-tu-asesoria` | → WhatsApp (`page.tsx:218`) | Reenrutar CTA a `/agenda-tu-asesoria` cuando exista | F-12 |
| D-01-3 | RA-1 "¿Qué es Veta Dorada?" | `<h2>` visible justo bajo el descriptor del hero (indexable) | `<h2>` con estilo de caption al pie del hero (`page.tsx:222-230`) | Reubicar/reescalar como RA semántica bajo el descriptor | — |
| D-01-4 | Espacios (7 cards) | Cada card → su landing F-09 (ruta `/espacios/[categoria]`); CTA → F-10 `/espacios` | Cards → WhatsApp; CTA "Ver todos los espacios" → `/portafolio` (`page.tsx:268-277, 281`) | Reenrutar cards a F-09 y CTA a F-10 | F-09 / F-10 |
| D-01-5 | Espacios | Foto real por categoría (I-016) | `ImagenPlaceholder` (inicial) (`page.tsx:275`) | Imágenes reales de las 6 landings + F-14 | I-016 |
| D-01-6 | Cómo trabajamos | CTA "Conoce el proceso completo" → F-11 | Sin CTA (omitido, D-10) | Añadir CTA → `/como-trabajamos` | F-11 |
| D-01-7 | Proyectos teaser | 3 proyectos: foto 16:9 + nombre + **barrio real** + tipo de proyecto; selección pendiente (Talero candidato) | `publicados()[0..2]` + `ImagenPlaceholder` + `MetaItem MapPin` con `categoriaEspacio` (no barrio) (`page.tsx:130, 308-319`) | Definir selección real; agregar campo barrio al schema Portafolio; imágenes; tipo de proyecto | F-03 / I-016 / decisión schema `Portafolio.barrio` |
| D-01-8 | Conócenos teaser | CTA "Conoce nuestra historia" → F-18 | Sin CTA (omitido, D-10) | Añadir CTA → `/conocenos` | F-18 |
| D-01-9 | Testimonios | nombre + barrio + tipo de proyecto (I-013); + Jose Talero | nombre + texto + "Reseña en Google"; sin barrio/tipo; sin Talero (`page.tsx:115-126, 364-369`) | Enriquecer filas con barrio/tipo; integrar Talero | datos / t-113 |
| D-01-10 | CTA final | primario → F-12; secundario → WhatsApp | primario y secundario → WhatsApp (`page.tsx:382-385`) | Reenrutar primario a `/agenda-tu-asesoria` | F-12 |

**Regla del contrato inverso:** ninguna fila de esta tabla pasa a "aceptada". Cuando su bloqueador cierre (pantalla F-XX diseñada o dato disponible), la desviación se corrige en el batch de alineación correspondiente.

---

## 14. Verificación de integridad (pre-entrega)

**Checklist del diseño retroactivo:**

- [x] Entidades en §1 existen en REGISTRO (`portafolio`).
- [x] Copy en §3 idéntico a `contenido_F01_home.md` §3 (dif textual verificado en D-10/D-17).
- [x] Sin `aggregateRating` en JSON-LD (grep = 0).
- [x] Teaser usa `publicados()` real, sin 3 proyectos hardcodeados.
- [x] Ningún `<Link>` a ruta 404 (D-10).
- [ ] **Pendiente:** token del hero (D-01-1) — decisión bloqueada.
- [ ] **Pendiente:** seleccionar 3 proyectos reales del portafolio + barrio en schema (D-01-7).
- [ ] **Pendiente:** recuperar fotografías reales I-016 (D-01-5).
- [ ] **Pendiente:** reenrutar CTAs a F-09/F-10/F-11/F-12/F-18 cuando existan (D-01-2/4/6/8/10).
- [ ] **Pendiente:** integración testimonio Jose Talero (t-113).

---

## 15. Doble Diamante — Metodología de diseño (Sección Especial)

**Nota de retroactividad:** la Home fue diseñada antes del código por la sub-línea de demanda (`contenido_F01_home.md`, aprobado 2026-08-09) — el diamante de **contenido** sí se ejecutó. Lo que faltó fue la destilación al `disenio_FXX.md` de pantalla (PLANTILLA_PANTALLA). Este documento cierra ese hueco **a posteriori** con trazabilidad diseño↔código en vez de exploración de alternativas.

**Fuentes de decisión ya cerradas que esta pantalla consolida:**

| Decisión | Valor | Fuente |
|---|---|---|
| H1 del hero | "Carpintería arquitectónica. Diseñamos, fabricamos, instalamos." | Elegido entre 3 alternativas Creador Experto (2026-08-09) |
| Eslogan D1 | "Diseña tu espacio. Habita el bienestar." | `plan_demanda.md` §1 |
| DC-1 | Testimonios ACTIVA (sin schema) | `REGISTRO_DE_ENTIDADES.md` §10 |
| DC-3 | Embudo híbrido → los CTA a F-12 eventualmente a `/agenda-tu-asesoria` | `plan_estructura_sitio_publico.md` |
| DC-4 | Línea de tiempo 1995→2014→2019 (en copy del hero y Conócenos) | `plan_diseno_web_publica.md` §0 |

**Decisiones de computabilidad tomadas en D-10 (retro, a revisar):** CTA a pantallas inexistentes → WhatsApp o se omiten; `bg-alt` en vez de `bg-linen` inexistente; `publicados()` en vez de proyectos placeholder. **Ninguna de estas decisiones es definitiva — se corrige en §13.**

---

## 16. Entrega a Agente Código

**Estado: ya implementada.** Este documento es **retroactivo** — no se entrega a un agente Código para construir de cero, sino para **alinear** según §13:

1. En el batch de alineación (post-auditoría Parte B): resolver D-01-3 (RA-1 como `<h2>` semántica bajo el descriptor).
2. Al existir F-09/F-10/F-11/F-12/F-18: reenrutar CTAs (D-01-2/4/6/8/10) según §13.
3. Al existir dato/schema: barrio + tipo de proyecto en testimonios y teaser (D-01-7/9), fotos reales (D-01-5), token del hero (D-01-1).
4. Verificar siempre: CA-1..CA-8 antes de marcha.

**Blockers conocidos:** F-09..F-12/F-18 (pantallas aún sin diseñar), I-016 (imágenes), t-113 (Talero), decisión de schema `Portafolio.barrio`, decisión de token del hero.

**Status: Ciclo 1 completado y cerrado** — Los 4 puntos de aprobación aprobados fueron:
1. ✅ Aprobación del diseño retroactivo de F-01
2. ✅ Normalización del token del hero a usar `bg-linen` (token creado)
3. ✅ AgREGAR campo `barrio` al schema `Portafolio` (decisión de schema)
4. ✅ Confirmación para iniciar Ciclo 2 con F-02 Tienda

El backlog de auditoría ha sido actualizado para reflejar estas decisiones y marquedas como "planificadas" o "corregidas" donde aplica.