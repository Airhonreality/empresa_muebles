# F-03 — Portafolio de Proyectos

**Fecha:** 2026-08-07 · **Estado:** propuesta · **Fase:** F7 · **Rutas:** `/portafolio`, `/portafolio/[slug]` · **Roles:** publico

---

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`).*

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `portafolio` | §10 | id, proyecto_id, titulo, descripcion_comercial, categoria_espacio, materiales_destacados, precio_referencial, publicado, destacado, orden, slug | Casos de obra publicados |
| `proyectos` | §3 | id, nombre_proyecto, direccion_obra, estado | Datos del proyecto asociado |
| `modulos_artefactos` | §8 | id, nodo_id, tipo('imagen'), fuente, url | Imagenes de obra (heredadas del catalogo o dedicadas) |
| `categorias` | §2 | id, nombre, tipo('portafolio') | Categorias de espacio (cocina, closet, estudio) |

---

## 2. Estados que transiciona

*Sin estados transicionales — solo lectura publica. El campo `portafolio.publicado` controla visibilidad.*

---

## 3. Vocabulario H07

| Label | Codigo | Entidad |
|---|---|---|
| "Portafolio" | — | — |
| "Proyectos realizados" | — | — |
| "Cocinas" | `cocina` | `portafolio.categoria_espacio` |
| "Closets" | `closet` | `portafolio.categoria_espacio` |
| "Estudios" | `estudio` | `portafolio.categoria_espacio` |
| "Precio referencia" | — | `portafolio.precio_referencial` (rango, no cifra exacta) |
| "Materiales destacados" | — | `portafolio.materiales_destacados` |

---

## 4. Reglas de negocio

| # | Regla | Validacion |
|---|---|---|
| R1 | Solo `publicado=true` | `WHERE publicado = true` |
| R2 | Sin precios exactos — solo `precio_referencial` como rango estimado | UI: "desde $8M COP" o "$8M - $15M COP", nunca cifra exacta |
| R3 | JSON-LD para SEO (schema.org `CreativeWork`) por proyecto | Server: genera dinamicamente metadata estructurada |
| R4 | Orden por `destacado` DESC, luego `orden` ASC | Server |
| R5 | Imagenes de `modulos_artefactos` con `fuente='heredado_catalogo'` o `dedicado_proyecto` | No se exponen planos de armado ni modelos 3D, solo tipo `imagen` |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `PortafolioGrid` | Server + Client | Grid masonry responsivo (3 col → 2 → 1) con tarjetas destacadas arriba |
| `PortafolioCard` | Client | `portafolio`: imagen hero, titulo, categoria, rango de precio. Efecto hover-elevate |
| `PortafolioDetalle` | Server + Client | `/(publico)/portafolio/[slug]`: galeria completa de imagenes, descripcion comercial, materiales, sin precios exactos, sin fotos de planos |
| `PortafolioSEO` | Server | JSON-LD dinamico por proyecto, meta tags, Open Graph |

**Tokens D4:** `mist`, tema light, `--font-display` (Fraunces titulos), `--font-sans` (Inter cuerpo)

---

## 6. Comportamiento

| # | Evento | Gatillo | Accion |
|---|---|---|---|
| 1 | Cargar portafolio | `/portafolio` mount | `GET /api/publico/portafolio` (server projection: solo `publicado=true`) |
| 2 | Filtrar por categoria | Click categoria | Re-fetch con query param `?categoria=cocina` |
| 3 | Ver detalle | Click tarjeta | Navigate a `[slug]` |
| 4 | Compartir proyecto | Click compartir | Meta tags + URL canonica |

---

## 7. Criterios de aceptacion (verificables mecanicamente)

| # | Criterio | Verificacion |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | Solo `publicado=true` visibles | Test: count publico = count `WHERE publicado=true` |
| CA-3 | Sin precio exacto — solo rango o "desde" | Playwright: no existe `$` seguido de cifra exacta en tarjeta |
| CA-4 | JSON-LD valido para cada proyecto | `curl {url}/portafolio/{slug} \| grep "application/ld+json"` |
| CA-5 | Sin fotos de planos de armado (tipo='plano_armado' no expuesto) | Test: response no contiene `tipo=plano_armado` en imagenes |
| CA-6 | Destacados aparecen primero | Test: primer elemento de la lista tiene `destacado=true` |
