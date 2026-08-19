# P-13 — Testimonios (Página dedicada)

**Fecha:** 2026-08-19 · **Estado:** propuesto · **Fase:** F-13 · **Ruta:** `/testimonios` · **Roles:** [Público]

---

## 1. Entidades que consume

| Entidad | § del REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| `testimonios` | §10 Marketing | `contenido`, `nombre_autor`, `rating`, `barrio`, `tipo_proyecto`, `fuente`, `url_fuente` | Pintar grid de testimonios dinámicos |

---

## 2. Estados que transiciona
N/A (Sólo lectura)

---

## 3. Vocabulario H07 (labels visibles)
*Copy y encabezados extraídos desde `contenido_F13_testimonios.md`.*

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Renderizar testimonios dinámicamente | `listarTestimoniosPublicadosAction()` | No quemar testimonios en el `.tsx` |
| R2 | Metadatos SEO `FAQPage` o `Review` | `generateMetadata()` | Validación JSON-LD |
| R3 | **Cruce Testimonio ↔ Portafolio:** Si un Testimonio tiene `proyectoId` y ese proyecto está publicado en el Portafolio, el Testimonio debe mostrar un link "Ver proyecto". Si no hay fotos, es solo texto. (Axioma de Gracia Degrada). | UI conditionally renders Link | El componente verifica si `slug` del portafolio existe para ese `proyectoId`. |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `TestimonialGrid` | Server | `testimonios: Testimonio[]` | `testimonios` | Grid Masonry, `--color-card-bg` |
| `ReviewCard` | Client | `testimonio: Testimonio` | `testimonios` | Estrellas SVG, Quote styling |

**Patrones M-06 L1 usados:** `force-dynamic` para inyectar testimonios en tiempo real.

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect |
|---|---|---|---|---|
| 1 | Cargar pantalla | RSC mount | `listarTestimoniosPublicadosAction()` | — |

---

## 7. Criterios de aceptación
- `npx tsc --noEmit` = 0 errores
- `npx eslint` = 0 errores
