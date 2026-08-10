# REGISTRO DE CAMBIO EN SCHEMA — Testimonios ACTIVA (DC-1)

**Fecha del cambio:** 2026-08-09
**Decisión:** Adelantar `testimonios` de **DIFERIDO → ACTIVA** (E-55) por decisión DC-1 del Supervisor.
**Schema afectado:** `testimonios` (nucleo/REGISTRO_DE_ENTIDADES.md §10)
**Impacto en diseño de pantallas:** Desbloqueo de F-13, F-01/F-03 (sección testimonios), F-14 (si aplica).

---

## 1. Contexto

- **Origen:** `plan_estructura_sitio_publico.md` §4 DC-1 y `plan_diseno_web_publica.md` §4 DC-1.
- **Motivación:** Bloque C (corte) exige prueba social estructurada antes del merge. La tabla `testimonios` ya existía en el canon (DIFERIDA) pero no se implementaba en el sitio.
- **Regla anti-invención:** Nunca inventar testimonios ni `aggregateRating`. Solo se renderiza contenido real.

---

## 2. Cambio en el schema

### 2.1. Tabla `testimonios`

**Archivo:** `arnes/nucleo/REGISTRO_DE_ENTIDADES.md` §10, línea 179

**Antes:**
```markdown
| `testimonios` | Reseñas / testimonios | **DIFERIDO** (E-55). Calificación, texto, cliente. | FK→`clientes`, FK→`proyectos` |
```

**Después:**
```markdown
| `testimonios` | Reseñas / testimonios | **ACTIVA** (E-55). Calificación, texto, cliente. Adelantada por decisión DC-1 del Supervisor (2026-08-09) — sin tocar schema. **Especificación [2026-08-09]:** `contenido` (texto real, nunca editado), `rating` (1-5), `curado`, `aprobado`, `publicado`, `createdAt`, `fuente` (GBP/WhatsApp/Notion/video), `barrio` (contexto barrial I-013), `tipo_proyecto`, `url_fuente` (enlace a la fuente original), `fecha_publicacion`. Regla anti-invención: solo se renderiza con datos reales. | FK→`clientes`, FK→`proyectos` |
```

**Notas:**
- No se modifica el schema (DDL) — solo se cambia el estado en el canon.
- Los campos `fuente`, `barrio`, `tipo_proyecto`, `url_fuente`, `fecha_publicacion` son **nuevos en el canon** pero no requieren migración de datos (pueden ser `NULL` inicialmente).
- **FKs:** `proyectoId` y `clienteId` siguen siendo `NOT NULL` según el schema actual. Si una reseña de GBP no mapea a un proyecto real, se debe decidir: permitir `NULL` en `proyectoId` o mapear manualmente (ej: Glenda Danuro/Daniela Barón Esparza a proyectos de cocina reales).

---

## 3. Impacto en diseño de pantallas

### 3.1. F-13 (Testimonios)

**Estado:** Desbloqueada (antes bloqueada por DC-1).

**Cambios en el componente:**
- **Sección embebida en F-01/F-03:** Ahora activa. Renderizar solo testimonios con `publicado=true` y `aprobado=true`.
- **Página `/testimonios`:** Lista completa de testimonios públicos.
- **JSON-LD:** Emitir `Blog` (portada) y `Article`/`BlogPosting` por testimonio.
- **Gate de publicación:** Ver `archivo/flags_testimonios_seo.md` §1.

**Ejemplo de consulta SQL (pseudocódigo):**
```sql
SELECT * FROM testimonios 
WHERE publicado = true AND aprobado = true 
ORDER BY rating DESC, createdAt DESC 
LIMIT 4;
```

### 3.2. F-01 (Home) — Sección de testimonios

**Estado:** Desbloqueada (antes placeholder DC-1).

**Cambios:**
- Sección `#9` ahora activa. Mostrar 2-3 testimonios destacados (`rating >= 4`).
- Componente debe filtrar por `tipo_proyecto` para mostrar testimonios relevantes a la categoría de la landing (ej: cocina integral → testimonios de cocinas).

**Ejemplo de filtrado:**
```typescript
const testimoniosDestacados = testimoniosPublicados
  .filter(t => t.rating >= 4)
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 3);
```

### 3.3. F-03 (Portafolio) — Testimonios embebidos por proyecto

**Estado:** Desbloqueado (depende de que el proyecto tenga `testimonios` asociados).

**Cambios:**
- Si un proyecto tiene testimonios (`proyectoId` coincidente), embebirlos en su ficha.
- **Gate:** Solo testimonios con `publicado=true` y `aprobado=true`.

### 3.4. F-14 (Pisos de Madera)

**Estado:** Desbloqueado (si hay testimonios de pisos).

**Cambios:**
- Si un proyecto de pisos tiene testimonio, embebirlo en su ficha.

### 3.5. JSON-LD en todas las pantallas

**Reglas:**
1. **No emitir `aggregateRating` falso.** Solo calcular si hay testimonios reales publicados.
2. **Estructura correcta:**
   ```json
   {
     "@context": "https://schema.org",
     "@type": "AggregateRating",
     "ratingValue": "4.5",
     "reviewCount": "8"
   }
   ```
3. **`Review` por testimonio:**
   ```json
   {
     "@type": "Review",
     "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
     "author": { "@type": "Person", "name": "Daniela Barón Esparza" },
     "reviewBody": "Muy cumplidos y dedicados...",
     "datePublished": "2024-11-05"
   }
   ```

**Ejemplo de código (Next.js + Drizzle):**
```typescript
// Obtener testimonios publicados y aprobados
const testimonios = await db.query.testimonios.findMany({
  where: and(
    eq(testimonios.publicado, true),
    eq(testimonios.aprobado, true)
  ),
  with: { cliente: true, proyecto: true },
});

// Build JSON-LD
const aggregateRating = testimonios.length > 0 ? {
  "@type": "AggregateRating",
  ratingValue: testimonios.reduce((a, t) => a + t.rating, 0) / testimonios.length,
  reviewCount: testimonios.length,
} : null;

const reviews = testimonios.map(t => ({
  "@type": "Review",
  reviewRating: { "@type": "Rating", ratingValue: String(t.rating), bestRating: "5" },
  author: { "@type": "Person", name: t.cliente.nombre },
  reviewBody: t.contenido,
  datePublished: t.fecha_publicacion ?? t.createdAt,
}));
```

---

## 4. Decisiones pendientes para implementación

| Decisión | Impacto | Estado |
|---|---|---|
| ¿Permitir `proyectoId` NULL en `testimonios` para reseñas genéricas de GBP? | Si no se mapea a un proyecto real, la reseña no puede asociarse a una categoría. | **Pendiente Supervisor** |
| ¿Cómo mapear las 4 reseñas de GBP a proyectos reales? | Ej: Glenda Danuro/Daniela Barón Esparza → proyectos de cocina. | **Pendiente Supervisor** |
| ¿Qué hacer con `barrio` y `tipo_proyecto` faltantes? | Si no hay dato, omitir contexto (no inventar). | **Regla cerrada:** omitir, no inventar (I-049). |
| ¿Cómo manejar `url_fuente` para reseñas de GBP? | Enlace a la reseña original en Google Business Profile. | **Regla cerrada:** incluir enlace con atribución. |

---

## 5. Referencias

- **Disciplina anti-invención:** `plan_seo_2026.md` §1; `archivo/flags_testimonios_seo.md` §1.
- **Protocolo de reseñas curadas:** `log_insights_fase2.md` I-013.
- **Seed de datos:** `contenido_F13_testimonios.md` §3.2 (4 reseñas GBP + Jose Talero).
- **JSON-LD:** `plan_seo_2026.md` §2.

---

## 6. Checklist para el agente Código

- [ ] Componente `VetaTestimonials` filtra por `publicado=true` y `aprobado=true`.
- [ ] Sección de testimonios en F-01/F-03 solo muestra testimonios con `rating >= 4`.
- [ ] JSON-LD emite `aggregateRating` solo si hay testimonios reales.
- [ ] `Review` por testimonio con `author.name` = nombre del cliente.
- [ ] Si `proyectoId` es NULL, no se asocia a ninguna categoría (pero se muestra en F-13).
- [ ] `barrio` y `tipo_proyecto` se omiten si no hay dato (no inventar).
- [ ] `url_fuente` se incluye con atribución a Google Business Profile.

---

## 7. Notas adicionales

- **No se requiere migración de datos.** Los campos nuevos (`fuente`, `barrio`, etc.) pueden ser `NULL` inicialmente.
- **El schema no cambia (DDL), solo el estado en el canon.** Esto evita riesgos de breaking changes en producción.
- **El componente de testimonios debe ser reutilizable** (usado en F-01, F-03, F-13, F-14).

---

**Registro creado por:** opencode (build mode)
**Fecha:** 2026-08-09
**Versión:** 1.0