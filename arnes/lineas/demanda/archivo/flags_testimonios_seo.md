# FLAGS — Testimonios reales y verificables (SEO + anti-invención)

**Fecha:** 2026-08-09 · **Línea:** demanda · **Dueño del contrato:** Supervisor
**Contrato vivo del arnés:** este archivo declara los *flags* que el agente Código debe respetar al implementar la tabla `testimonios` (schema) y los componentes públicos (F-01 sección testimonios, F-13 página, JSON-LD). Navega de la regla anti-invención #1 de `plan_seo_2026.md` §1.

---

## 0. Principio rector

**La prueba social es real o no existe.** Un testimonio se renderiza solo si cumple TODAS las condiciones de §1. Si `testimonios` está vacío, la sección no se renderiza y `aggregateRating` nunca se publica. El dato falso es una violación de las políticas de datos estructurados de Google (I-020) y de la disciplina del arnés (I-040).

---

## 1. Condición de publicación (gate único)

Un testimonio es **público** si y solo si:

| # | Campo | Condición |
|---|---|---|
| 1 | `publicado` | `true` |
| 2 | `aprobado` | `true` |
| 3 | `contenido` | no vacío y textual (nunca editado ni inventado) |
| 4 | `clienteId` | FK válido → `clientes` |
| 5 | `proyectoId` | FK válido → `proyectos` (o decisión explícita de permitir `NULL` para reseñas genéricas — ver §6) |
| 6 | `fuente` | no vacía (GBP / WhatsApp / Notion / video) |

**Pseudocódigo (aplicación pública):**

```typescript
const publicos = await db.query.testimonios.findMany({
  where: and(
    eq(testimonios.publicado, true),
    eq(testimonios.aprobado, true),
  ),
  with: { cliente: true, proyecto: true },
});

const visibles = publicos.filter(t => t.contenido?.trim() && t.clienteId && t.fuente);
```

---

## 2. `aggregateRating` — solo con datos reales

| Flag | Regla |
|---|---|
| **Nunca hardcodear** | `4.9 / 185` como el JSON-LD de `INVS_SEO_empresas mobiliario.md` (I-020). Eso fue descartado. |
| **Exigencia mínima** | Solo renderizar `aggregateRating` si `visibles.length > 0`. |
| **Valores** | `ratingValue` = promedio real de `visibles.rating`; `reviewCount` = `visibles.length`. Ambos calculados en el servidor, nunca en el cliente. |
| **Sin redondeo engañoso** | Publicar el promedio real calculado (1 decimal mínimo), no inventar 5.0 forzado. |

```typescript
function buildAggregateRatingSchema(testimonios: TestimonioPublico[]) {
  if (testimonios.length === 0) return null;
  const ratingValue = testimonios.reduce((a, t) => a + t.rating, 0) / testimonios.length;
  return {
    "@type": "AggregateRating",
    ratingValue: ratingValue.toFixed(1),
    reviewCount: testimonios.length,
  };
}
```

---

## 3. `Review` — embebido solo si hay testimonios públicos

| Flag | Regla |
|---|---|
| Mejor práctica | Emitir un `Review` por testimonio público. Nunca un `Review` con `reviewBody` inventado. |
| Filtro de calidad editorial | Considerar `rating >= 4` para exponer en la home / sección destacada (Luis Silva, 1★ negativo, no se publica: no cumple tono de marca ni rating). No mezclar negativos en primer plano. |

```typescript
function buildReviewSchema(testimonio: TestimonioPublico) {
  return {
    "@type": "Review",
    reviewRating: { "@type": "Rating", ratingValue: String(testimonio.rating), bestRating: "5" },
    author: { "@type": "Person", name: testimonio.cliente.nombre },
    reviewBody: testimonio.contenido,
    datePublished: testimonio.fecha_publicacion ?? testimonio.createdAt,
  };
}
```

---

## 4. Contexto barrial y local (protocolo I-013)

| Flag | Regla |
|---|---|
| `barrio` | Se muestra en el caption / tarjeta: *"instalación de cocina en el barrio Rosales"*. Nunca inventar un barrio (I-049). Si no hay dato, se omite el contexto — no se fabrica. |
| `tipo_proyecto` | Texto libre canónico (cocina integral, closet, centro de entretenimiento...). Garantiza que el testimonio se muestre en la landing F-09 correspondiente. |
| SEO local | `areaServed` ya vive en el shell (F-00). El testimonio no debe declarar `areaServed` propio a menos que `barrio` exista — y aun así, solo con dato verificado. |

---

## 5. Reuso del testimonio en otros componentes

| Componente | Comportamiento |
|---|---|
| F-01 §3.10 (home) | Renderiza la sección solo si `visibles.length > 0`; muestra 3-4 destacados (`rating >= 4`). Sin `aggregateRating` falso. |
| F-13 (página /testimonios) | Lista completa de `visibles`. |
| F-03 (ficha de proyecto) | Si el `proyectoId` del testimonio coincide, se embebe en la ficha. |
| F-09 (landings por categoría) | Si `tipo_proyecto` coincide con la categoría de la landing, se embebe. Siempre condicionado al gate de §1. |

---

## 6. Flags sobre el schema (para el agente Código)

| Flag | Detalle | Estado |
|---|---|---|
| `proyectoId` nullable | Reseñas genericas de GBP sin proyecto identificado. **RESUELTO (2026-08-19):** `proyectoId`/`clienteId` son `uuid` nullable en `schema.ts` (testimonios) y el seed de los 4 testimonios reales siembra FKs en `null` — las reseñas GBP sin proyecto mapeado se insertan sin violar FK. | **CERRADO** — ver `schema.ts` testimonios y `scripts/seed-dev.ts`. |
| `fuente` como columna | Nuevo campo de rastreabilidad (GBP / WhatsApp / Notion / video). Aprobado 2026-08-09. | CERRADO — en el canon `REGISTRO_DE_ENTIDADES.md` §10. |
| `barrio`, `tipo_proyecto`, `url_fuente`, `fecha_publicacion` | Contexto barrial + categoría + trazabilidad para SEO local. Aprobados 2026-08-09. | CERRADO — en el canon `REGISTRO_DE_ENTIDADES.md` §10. |
| E-55 y P-33 (curaduría) | El flujo de captura `curado → aprobado → publicado` es E-55; la pantalla de curaduría P-33 sigue DIFERIDO (t-034). No se construye ahora. | DIFERIDO — respetar frontera. |

---

## 7. Frente de datos reales disponibles (seed del MVP)

Reseñas reales del Perfil de Empresa (I-019, 4,4★ con 8 opiniones) — proporcionadas por el Supervisor 2026-08-09:

| Cliente | Rating | Texto (textual) | Proyecto | Estado |
|---|---|---|---|---|
| Daniela Barón Esparza | ★★★★★ | "Muy cumplidos y dedicados. El modelo de mi cocina quedó tal cual como lo pedí. La calidad de su trabajo es excelente." | Cocina integral (mapear) | Público candidato |
| Glenda Danuro | ★★★★★ | "Cumplieron muy buen trabajo." | Sin identificar | Público candidato |
| Juan Spiro | ★★★★★ | "Excelente trabajo muy recomendados" | Sin identificar | Público candidato |
| Madeline Attara | ★★★★★ | "Agradecida con los trabajos obtenidos. Muy buen servicio pre y post venta. Super recomendado." | Servicio pre/post venta | Público candidato |
| Luis Silva | ★★★★★ | "Pésima experiencia..." (texto negativo) | Remodelación cocina/closet/baño | **NO PUBLICAR** (negativo) |
| Socorro Llerena, Manuel Andrés Puello, Natalia Gutiérrez | ★★★★★ | Sin texto visible | — | Sin contenido — no usar |

Semilla prioritaria: **Jose Talero** (I-050) — testimonio + proceso documentados (video pendiente, `t-113.json`).

---

## 8. Regla de verificación para QA

- [ ] Ningún `aggregateRating` ni `Review` aparece sin testimonios reales publicados.
- [ ] `ratingValue` y `reviewCount` se calculan del lado servidor.
- [ ] Ningún testimonio se muestra sin cumplir el gate de §1.
- [ ] Ningún barrio/tipo_proyecto se inventa: si falta el dato, se omite, no se fabrica.
- [ ] La sección no se renderiza cuando `visibles.length === 0`.
- [ ] El texto del testimonio es textual (nunca editado/embellecido).