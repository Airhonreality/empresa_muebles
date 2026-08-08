# Destilación F3-público — Pantallas F-02, F-03, F-08 (Cierre F2)

**Fecha:** 2026-08-05
**Origen:** Repositorio legacy (`empresa_muebles_clone`)
**Destino:** `dev` worktree (`empresa_muebles_clone-dev`)
**Artefactos base:** `/src/app/colecciones/page.tsx`, `/src/app/portafolio/page.tsx`, `/src/app/propuesta/[slug]/page.tsx` + server projections

---

## 1. F-02 — Catálogo público (`colecciones`)

### Ruta
`/colecciones`

### Componentes
- `src/app/colecciones/page.tsx` → Page (server, metadata dinámico, `force-dynamic`)
- `src/components/specialized/public/PublicCollections.tsx` → Client component (UI de catálogo)
- `src/server/public-site-data.ts` → `getPublicStoreProducts()` (server projection con `getStrategy().read()`)

### Datos de origen (legacy schema-driven)
- `prefabricados` (`publicado_web`, `slug_publico`, `nombre`, `precio_publico`, `categoria_comercial`, `imagen_url`, `disponibilidad`)
- `productos_catalogo` (mismos campos + `stock_actual` → `disponibilidad`)

### Datos nuevos (schema explicito)
- `productos_tienda` (tabla destino)
- `categorias_producto` (lookup para `categoria_comercial`)

### Pantalla
Grid de productos con filtro por categoría, precio formateado (COP), disponibilidad (disponible/bajo pedido/agotado), imagen lazy. Link a detalle individual `/colecciones/[slug]`.

### Decisiones del diamante
- ❌ **NO migrar "as-is"** → schema `productos_tienda` define tipos (`prefabricado` vs `catalogo`) y enum `disponibilidad`
- ✅ **Server projection forzada** → `getPublicStoreProducts()` filtra `publicado_web = true`, `precio_publico > 0`, nunca expone `id`, `costo`, `stock` interno
- ✅ **C1 resuelto:** Precio semántico claro — `precio_publico` = PVP default (publicado en web), `precio_directo` = costo (no público), `productos_tienda.valor_tienda` = para web override (ver C4)

---

## 2. F-03 — Portafolio público (`portafolio`)

### Ruta
`/portafolio`

### Componentes
- `src/app/portafolio/page.tsx` → Page (server, metadata dinámico, JSON-LD)
- `src/components/specialized/portfolio/VetaPortfolio.tsx` → Client component (galería interactiva)
- `src/server/public-site-data.ts` → `getPublicPortfolio()` (server projection)

### Datos de origen
- `portfolio_publico` (`publicado`, `slug`, `titulo`, `descripcion_comercial`, `categoria_espacio`, `materiales_destacados`, `precio_referencial`, `destacado`, `orden`)
- `imagenes_portfolio` (join por `portfolio_id`, `imagen_url`, `descripcion`, orden implícito)

### Datos nuevos (schema explicito)
- `portafolio_proyectos` (tabla destino)
- `portafolio_imagenes` (tabla destino)

### Pantalla
Galería masonry por categoría (6 categorías predefinidas, colores por categoría). Vista detalle de proyecto con galería ampliable (foco/carrusel), materiales como tags, descripción, precio referencial. SEO: JSON-LD Schema.org `ImageGallery` + `Article`.

### Decisiones del diamante
- ❌ **NO exponer** ubicación exacta, cliente, relación operacional → `zona = 'Bogotá'` fija, `id` oculto
- ✅ **Server projection forzada** → `getPublicPortfolio()` filtra `publicado = true`, omite `id`, costos, stock
- ✅ **Orden de exposición:** destacado primero, luego `orden`

---

## 3. F-08 — Propuesta pública (`/propuesta/{slug}`)

### Ruta
`/propuesta/{slug}`

### Componentes
- `src/app/propuesta/[slug]/page.tsx` → Page (server, `force-dynamic`)
- `src/components/specialized/public/PublicProposal.tsx` → Client component (UI de propuesta)
- `src/server/public-proposal.ts` → `getPublicProposal(slug)` (server projection)

### Datos de origen
- `propuestas_publicas` → `data.public_slug` + `data.estado = 'publicada'` + `data.snapshot_json` (JSON)

### Estructura del snapshot (proyectado)
```typescript
PublicProposalSnapshot {
  title: string
  issued_at: string
  financial?: {
    carpentry_total: number
    civil_estimate_total: number
    subtotal?: number
    costos_operativos?: number
    imprevistos?: number
    descuento?: number
    ajuste?: number
    aplica_iva?: boolean
    pct_iva?: number
    iva?: number
  }
  spaces: Array<{
    id: string
    name: string
    description?: string
    variants: Array<{
      name: string
      colors?: [{ name, image_url? }]
      images?: [{ url, description? }]
      notes?: string[]
      items: [{ name, quantity, unit?, image_url?, unit_price?, total? }]
      civil_estimate?: [{ category, name, quantity, unit?, unit_price?, total?, notes? }]
      materials_total?: number
      labor_total?: number
      labor_breakdown?: { dev_days, dev_rate, assembly_days, assembly_rate, install_days, install_rate }
      total: number
    }>
  }>
}
```

### Pantalla
Layout de storytelling: header sticky, navegación de ambientes, galería de imágenes con foco/carrusel, variantes múltiples, selector de colores/materiales, items incluidos con imágenes, notas, estimado civil (referencial, fuera de contrato). Resumen financiero con desglose de mano de obra (jornadas: dev/assembly/install). Botón "Guardar como PDF". Tema light con variables CSS (`--veta-*` override).

### Decisiones del diamante
- ❌ **NO migrar snapshot as-is** → `projectPublicProposal()` proyecta explícitamente campos permitidos, descarta metadata comercial privada
- ✅ **Snapshot es inmutable** → versión publicada del contrato; lectura-only
- ✅ **Mano de obra:** tarifas derivadas de `parametros` (C1) — `dev_rate`, `assembly_rate`, `install_rate` se calculan en runtime, no se almacenan en snapshot
- ✅ **Civil estimate:** informaciónal, fuera de contrato de carpintería

### Estado
- ✅ **Destilado COMPLETO** del legacy
- ❌ **NO incluido en F2 cierre inmediato** → subsidiario complejo, requiere viewer 3D integrado (sub-diamante F7)
- 🔻 **Pendiente de refactorizar** → `PublicProposal.tsx` (454 líneas, refs a `@/components/ui/*`) debe reconstruirse como componente `Viewer3DModal` + propuesta modular en F7

---

## 4. Resumen para cierre F2

| Feature | Ruta | Estado |
|---|---|---|
| **F-01** Landing/Home | `/` | 🔲 Por construir — PoC 3 es demo de tokens D4, no pantalla de negocio. Ver `plan_estructura_sitio_publico.md` |
| **F-02** Catálogo | `/colecciones` | ✅ Destilado — listo para schema `productos_tienda` |
| **F-03** Portafolio | `/portafolio` | ✅ Destilado — listo para schema `portafolio_proyectos` |
| **F-08** Propuesta | `/propuesta/{slug}` | ✅ Destilado — pendiente refactorizar en F7 |

**Conclusión:** F-02 y F-03 están destilados y listos. F-08 está destilado pero su UI (454 líneas con dependencias UI) requiere refactorización como parte del sub-diamante de viewer 3D (F7), no bloquea el cierre de F2.

---

## 5. Próximos pasos

1. **Schema:** `productos_tienda`, `portafolio_proyectos`, `portafolio_imagenes` migrados en Ola 7
2. **Server projection:** `getPublicStoreProducts()`, `getPublicPortfolio()` reescritos con Drizzle contra nuevo schema
3. **UI:** `PublicCollections.tsx` y `VetaPortfolio.tsx` adaptados (componentes client)
4. **F-08:** Pausado hasta F7 (viewer 3D + propuesta modular)