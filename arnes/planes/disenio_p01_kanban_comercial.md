# Diseño de Pantalla P-01 — Kanban Comercial (Veta de Oro)

**Fecha:** 2026-08-05
**Estado:** Propuesta para aprobación del Supervisor
**Dependencias:** Decisiones diamante exclusivo C1-C4, M-06 L1 (patrones técnicos), P-04 aprobado
**Artefactos base:** `destilacion_cotizador_contrato.md` (Kanban legacy), `m06_capa_tecnica_transversal.md`, `glosario_h07.md`

---

## 1. Visión General

El Kanban Comercial es la vista principal del embudo de ventas. Muestra todos los proyectos/leads organizados por estado, permite transicionarlos, buscar/filtrar, y crear nuevos. Es el punto de entrada del comercial (`comercial`, `admin`).

**Estructura de página:** `/app/erp/comercial/page.tsx` (Client Component, `"use client"`)

**Patrones técnicos (M-06 L1):**
- `useSmartSearch` (fuzzy + historial localStorage, contexto "comercial-kanban")
- `useDebounce` (filtros, 300ms)
- `useAutoSave` (NO — el kanban persiste via API directa al mover tarjetas)
- `Promise.all` carga paralela (proyectos + clientes + parametros transiciones)
- `Suspense` + loading states
- Design tokens + primitivas `components/veta/` (Card, Badge, Button, Popover, Select)

---

## 2. Layout Principal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER (sticky)                                                             │
│ [Logo]  Embudo Comercial  |  SmartSearch(proyectos/clientes)  [Nuevo +]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────┐ │
│  │  ACTIVA     │ │  ENVIADA    │ │ EN_CONTRATO │ │ PRE_PRODUCC │ │ ...  │ │
│  │  (Lead)     │ │ (Propuesta) │ │ (Negociación)│ │ (Pre-prod)  │ │      │ │
│  │  🟡         │ │  🔵         │ │  🟣         │ │  🟠         │ │      │ │
│  ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤ ├──────┤ │
│  │ ████████████│ │ ████████████│ │ ████████████│ │ ████████████│ │      │ │
│  │ Proyecto A  │ │ Proyecto B  │ │ Proyecto C  │ │ Proyecto D  │ │      │ │
│  │ Cliente X   │ │ Cliente Y   │ │ Cliente Z   │ │ Cliente W   │ │      │ │
│  │ $45M · 3d   │ │ $120M · 12d │ │ $80M · 5d   │ │ $200M · 1d  │ │      │ │
│  │ [Abrir]     │ │ [Abrir]     │ │ [Abrir]     │ │ [Abrir]     │ │      │ │
│  ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤ ├──────┤ │
│  │ Proyecto E  │ │             │ │ Proyecto F  │ │             │ │      │ │
│  │ ...         │ │  [+ Lead]   │ │ ...         │ │  [+ Lead]   │ │      │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └──────┘ │
│                                                                             │
│  [Footer: Filtros: Comercial | Tipo | Fecha | Solo mis leads]              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Estados (columnas) — 8 legacy + transiciones desde `parametros`:**
| Orden | Estado (value) | Label | Color | Descripción |
|---|---|---|---|---|
| 1 | `activa` | Lead | amber | Cotización en borrador, sin enviar |
| 2 | `enviada` | Propuesta | blue | Propuesta pública emitida al cliente |
| 3 | `en_contrato` | En contrato | violet | Contrato generado, en negociación/firma |
| 4 | `pre_produccion` | Pre-producción | orange | Contrato firmado, preparando producción |
| 5 | `produccion` | Producción | green | En taller (solo lectura desde comercial) |
| 6 | `entregado` | Entregado | green | Finalizado con éxito |
| 7 | `perdida` | Perdida | rose | Cerrada sin venta |
| 8 | `cancelada` | Cancelada | muted | Cancelada por cliente/interno |

**Nota:** Estados 5-8 son **solo lectura** para rol `comercial` (no drag-drop). Transiciones válidas vienen de `parametros.transiciones_proyecto`.

---

## 3. Componentes Principales

### 3.1 Header Kanban

| Elemento | Tipo | Comportamiento |
|---|---|---|
| **Título** | "Embudo Comercial" | — |
| **SmartSearch** | `useSmartSearch` contexto "comercial-kanban" | Busca en `proyectos.nombre_proyecto` + `clientes.nombre`. Fuzzy (Levenshtein) + historial localStorage (20 items) + uso frecuente (50 items LRU). Filtra tarjetas en tiempo real en todas las columnas. |
| **Botón [Nuevo +]** | `Button` variant=primary | Abre `NuevoProyectoModal` (P-02) |
| **Filtros (colapsables)** | `Popover` / `Select` múltiple | Comercial (usuario), Tipo proyecto, Rango fecha, "Solo mis leads" (checkbox). `useDebounce` 300ms. |

---

### 3.2 Columna Kanban (KanbanColumn)

**Props:** `estado`, `label`, `color`, `proyectos[]`, `transicionesValidas[]`, `esSoloLectura`, `onMove(proyectoId, nuevoEstado)`

**Estructura:**

```
┌─────────────────────────────────────┐
│ 🟡 Lead                    (12)     │  ← Header: badge color + contador
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Tarjeta Proyecto (ComercialCard)│ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Tarjeta Proyecto                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │  ← Drop zone (si !esSoloLectura)
│ │        [+ Añadir Lead]          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Comportamiento Drag & Drop:**
- `@dnd-kit` (ya en deps PoC 3) o HTML5 DnD nativo
- **Solo columnas no solo-lectura** aceptan drop
- **Validación transición:** al soltar, chequea `transicionesValidas.includes(nuevoEstado)`. Si inválida → toast error + revert animado.
- **Optimistic UI:** mueve tarjeta local → `PATCH /api/erp/proyectos/:id` `{estado}` → success: confirm / error: revert + toast.

**Empty state:** `[+ Añadir Lead]` → abre `NuevoProyectoModal` con `estado` pre-seleccionado = columna actual.

---

### 3.3 Tarjeta Proyecto (ComercialCard)

**Basada en legacy `ComercialKanban.tsx` + `ComercialCard.tsx` + decisiones C1-C4.**

```
┌────────────────────────────────────────────────────────────┐
│  Proyecto: Cocina Integral Casa López          🟡 Activa   │
│  Cliente: María López (310 555 0123)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Espacios: Cocina, Estudio, Lavandería (3)           │  │
│  │  Items: 24  |  Variantes activas: 3/3                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ────────────────────────────────────────────────────────  │
│  💰 $185.000.000  (Materials: $120M | MO: $45M | +Costos) │
│  📅 Creado: 15/01/2026  |  Actualizado: hace 3 días       │
│  ⏱ Días en estado: 3                                      │
│  ────────────────────────────────────────────────────────  │
│  [Abrir en Cotizador]  [⋮ Menú: Duplicar, Historial,     │
│                          Cambiar estado →, Eliminar]      │
└────────────────────────────────────────────────────────────┘
```

**Campos (derivados de `proyectos` + relaciones):**

| Campo | Fuente | Formato |
|---|---|---|
| **Nombre proyecto** | `proyectos.nombre_proyecto` | Texto |
| **Estado badge** | `proyectos.estado` | Badge color según tabla §2 |
| **Cliente** | `clientes.nombre` + `telefono` | "Nombre (tel)" |
| **Espacios** | Count `espacio_variantes` donde `proyecto_id` + `activa=true` | "X espacios: Nombres (N)" |
| **Items totales** | Count `items_variante` por variantes activas | Número |
| **Variantes activas** | "Activas/Total espacios" | "3/3" |
| **Total estimado** | **Calculado server-side** (materiales + MO + costos - desc + ajuste) | COP formateado |
| **Desglose rápido** | Materiales / MO / Costos netos | Tooltip o línea secundaria |
| **Fechas** | `created_at`, `updated_at` | Relative time + absolute |
| **Días en estado** | `now - updated_at` (cuando cambió estado) | Número |

**Acciones (menú ⋮):**
| Acción | Qué hace | Validación |
|---|---|---|
| **Abrir en Cotizador** | Navega a `/erp/cotizador/[proyectoId]` | — |
| **Duplicar** | `POST /api/erp/proyectos` copia header + espacios + items, estado=`activa` | — |
| **Cambiar estado →** | Submenú con `transicionesValidas` (desde `parametros`) | Solo destinos válidos |
| **Ver historial** | Abre modal `EventosModal` (fase posterior) | — |
| **Eliminar** | Soft delete (`estado=cancelada` o `deleted_at`) | Confirm modal |

---

### 3.4 Transiciones de Estado (Regla C3)

**Fuente:** `parametros.transiciones_proyecto` (JSON):
```json
{
  "activa": ["enviada", "perdida", "cancelada"],
  "enviada": ["en_contrato", "activa", "perdida"],
  "en_contrato": ["pre_produccion", "enviada", "perdida"],
  "pre_produccion": ["produccion", "en_contrato"],
  "produccion": ["entregado", "pre_produccion"],
  "entregado": [],
  "perdida": ["activa"],
  "cancelada": ["activa"]
}
```

**En Kanban:**
- **Drag-drop:** Solo permite soltar en columnas que estén en `transicionesValidas[estadoActual]`.
- **Menú "Cambiar estado →":** Lista solo destinos válidos.
- **Columnas solo-lectura (`produccion`, `entregado`, `perdida`, `cancelada`):** No aceptan drops, no muestran `[+ Añadir]`, tarjetas sin drag handle.
- **Validación server:** `PATCH /api/erp/proyectos/:id` valida contra misma matriz (guardia).

---

### 3.5 Filtros (Sidebar derecho o header expandido)

| Filtro | Tipo | Comportamiento |
|---|---|---|
| **Comercial** | Multi-select (usuarios rol `comercial`) | Filtra `proyectos.comercial_id` (FK a añadir en F1) |
| **Tipo proyecto** | Multi-select (`tipoProyecto` enum) | `producto_fijo` \| `proyecto_a_medida` \| `servicio_tecnico` |
| **Fecha rango** | DateRangePicker | `created_at` entre fechas |
| **Solo mis leads** | Checkbox | Filtra `comercial_id = currentUser.id` |
| **Texto libre** | SmartSearch (ya en header) | Fuzzy sobre nombre proyecto + cliente |

**Persistencia:** Filtros en `localStorage` clave `comercial-kanban-filters` (restaurar al recargar).

---

### 3.6 Nuevo Proyecto Modal (P-02 — preview en P-01)

**Trigger:** Botón `[Nuevo +]` en header o `[+ Añadir Lead]` en columna `activa`.

```
┌────────────────────────────────────────────┐
│  Nueva Cotización / Proyecto          [×]  │
├────────────────────────────────────────────┤
│  Nombre proyecto *    [________________]   │
│  Cliente *            [HybridClientSelector]│
│  Tipo proyecto *      [▼ proyecto_a_medida]│
│  Estado inicial       [▼ activa] (fijo si  │
│                        viene de columna)    │
│  Dirección obra       [________________]   │
│  ────────────────────────────────────────  │
│  [Cancelar]          [Crear y abrir]       │
└────────────────────────────────────────────┘
```

- `HybridClientSelector`: Combobox + crear on-the-fly (usa `useSmartSearch` contexto "clientes", `vWrite` legacy → `POST /api/erp/clientes` nuevo).
- **Crear y abrir:** `POST /api/erp/proyectos` → redirige a `/erp/cotizador/[newId]`.

---

## 4. Flujo de Datos

```
Server Component (page.tsx)
  └─ Promise.all:
       ├─ getProyectos(filtros) → {id, nombre_proyecto, estado, cliente_id, comercial_id, tipo_proyecto, costos_operativos, imprevistos_instalacion, descuento_comercial, ajuste_arbitrario, aplica_iva, porcentaje_iva, created_at, updated_at, espacios_count, items_count, total_estimado}
       ├─ getClientes() → {id, nombre, telefono, email}
       ├─ getParametrosTransiciones() → matriz JSON
       └─ getCurrentUser() → {id, rol, nombre}
  → Props a Client Component (KanbanClient)

Client Component (KanbanClient)
  ├─ Estado local: columnas[], filtros, searchQuery, dragState
  ├─ useSmartSearch(proyectos + clientes, contexto="comercial-kanban")
  ├─ useDebounce(filtros, 300ms)
  ├─ Derivado: proyectosFiltrados = search + filtros aplicados
  ├─ Agrupado por estado → columnas[estado] = proyectos[]
  └─ Actions:
       ├─ moveProyecto(proyectoId, nuevoEstado) → PATCH /api/erp/proyectos/:id {estado}
       ├─ createProyecto(data) → POST /api/erp/proyectos → redirect
       └─ duplicateProyecto(proyectoId) → POST /api/erp/proyectos (copy) → redirect
```

**API `GET /api/erp/proyectos` (con query params filtros):**
- `select` optimizado: solo campos necesarios para tarjeta (no carga espacios/items completos)
- `total_estimado` calculado en server (SQL aggregate: materiales + MO + costos - desc + ajuste)
- `espacios_count`, `items_count` como subqueries `COUNT(*)`

---

## 5. Validaciones de Negocio

| Regla | Dónde | Error |
|---|---|---|
| Transición estado válida | Client (drag-drop/menu) + Server (PATCH) | "Transición no permitida: X → Y" |
| Solo comercial/admin ve Kanban | Server (middleware/guard) | 403 |
| Comercial ve solo sus leads (si filtro) | Client + Server (RLS opcional) | — |
| Nombre proyecto requerido al crear | Client (modal) + Server | "Nombre requerido" |
| Cliente requerido al crear | Client (modal) + Server | "Seleccione cliente" |

---

## 6. Estados de Pantalla

| Estado | Qué muestra |
|---|---|
| **Cargando** | Skeleton columns (3-4 tarjetas placeholder por columna) |
| **Error carga** | Alert + "Reintentar" |
| **Sin resultados (filtro)** | "No hay proyectos con estos filtros" + botón "Limpiar filtros" |
| **Vacío total** | Columnas vacías + `[+ Añadir Lead]` en `activa` |
| **Drag activo** | Tarjeta con sombra elevada, columna drop target resaltada |
| **Transición inválida** | Toast error + tarjeta regresa animada (spring) |

---

## 7. Accesibilidad (a11y)

- **Drag-drop:** `aria-roledescription="movible"`, `aria-grabbed`, `aria-dropeffect`. Alternativa teclado: menú "Cambiar estado →" (Enter/Space).
- **Columnas:** `role="list"`, `aria-label="Columna Lead"`, tarjetas `role="listitem"`.
- **SmartSearch:** `role="combobox"`, `aria-autocomplete="list"`, `aria-controls`.
- **Badges estado:** `aria-label="Estado: Lead"`.
- **Focus visible:** tokens `--focus-ring` en todos los interactivos.
- **Reduced-motion:** desactiva animaciones drag/drop, transiciones columnas.

---

## 8. Checklist de Aprobación (Supervisor)

- [ ] Layout: Header + columnas horizontales scroll-x + footer filtros
- [ ] 8 columnas con estados legacy + colores + contadores
- [ ] Transiciones desde `parametros.transiciones_proyecto` (drag-drop + menú)
- [ ] ComercialCard: todos los campos (nombre, cliente, espacios, items, total, fechas, días)
- [ ] SmartSearch (fuzzy + historial + uso frecuente) filtrando en vivo
- [ ] Filtros: Comercial, Tipo, Fecha, Solo mis leads (persistidos localStorage)
- [ ] Drag-drop con validación transición + optimistic UI + revert on error
- [ ] Columnas solo-lectura (producción, entregado, perdida, cancelada): sin drag, sin +Añadir
- [ ] Botón [Nuevo +] → NuevoProyectoModal (P-02 preview)
- [ ] Tarjeta menú ⋮: Abrir, Duplicar, Cambiar estado, Historial, Eliminar
- [ ] Accesibilidad: drag-drop teclado, focus, reduced-motion, ARIA

---

## 9. Próximos Pasos (tras aprobación)

1. **Iniciador** escribe `plan_t-079.md` (detalle implementación P-01)
2. **Agente Código** implementa:
   - API `GET /api/erp/proyectos` (optimizada para kanban)
   - API `PATCH /api/erp/proyectos/:id` (transición estado + validación)
   - Client `KanbanClient` + `KanbanColumn` + `ComercialCard`
   - `useSmartSearch` integración (M-06 L1)
   - Tests: transiciones, filtros, search, drag-drop
3. **QA** verifica: `tsc`, `eslint`, `next build`, tests, E2E contra `dev-local`

---

## 10. Relación con P-02/P-03

| Pantalla | Relación |
|---|---|
| **P-02 Nueva Cotización** | Modal que se abre desde `[Nuevo +]` o `[+ Añadir Lead]`. Crea proyecto → redirect a P-04. |
| **P-03 Detalle Solo Lectura** | Click "Abrir" en tarjeta con rol `taller`/`finanzas` → `/erp/cotizador/[id]?readonly=true` (subconjunto P-04). |

---

**¿Apruebas este diseño P-01 (Kanban Comercial)?**
Si sí → Iniciador escribe `plan_t-079.md`.
Si ajustes → indícalos y re-itero.