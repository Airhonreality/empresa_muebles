# Diseño de Pantalla P-04 — Cotizador (Veta de Oro)

**Fecha:** 2026-08-05
**Estado:** Propuesta para aprobación del Supervisor
**Dependencias:** Decisiones diamante exclusivo C1-C4 aprobadas
**Artefactos base:** `destilacion_cotizador_contrato.md`, `m06_capa_tecnica_transversal.md`, `glosario_h07.md`

---

## 1. Visión General

El cotizador es la pantalla principal del comercial (rol `comercial`, `admin`). Permite crear/configurar cotizaciones por proyecto, calcular precios (materiales + mano de obra + costos operativos), generar contratos y publicar propuestas públicas.

**Estructura de página:** `/app/erp/cotizador/[proyectoId]/page.tsx` (Client Component, `"use client"`)

**Patrones técnicos (M-06 L1):**
- `useAutoSave` (800ms, race-safe, flush on unmount)
- `useSmartSearch` (fuzzy + historial localStorage)
- `useDebounce` (búsqueda catálogo, filtros)
- `COP` formatter + `MoneyInput` (primitiva `components/veta/`)
- `Promise.all` carga paralela (server component wrapper)
- `Suspense` boundaries + loading states
- Design tokens (`app/globals.css`) + primitivas `components/veta/`

---

### 🔻 Sub-Diamante Pendiente: Propuesta de Diseño Virtual

**Qué es:** La propuesta comercial que ve el cliente (`/propuesta/{slug}`) + el visor 3D ("Ver Despiece 3D" en ficha taller).

**Componentes legacy a destilar:**
1. **PublicProposal** (`src/components/specialized/public/PublicProposal.tsx:454 líneas`) — propuesta pública con navegación espacios, variantes, galería zoom, items con imágenes, materiales, notas, obra civil referencial, desglose mano de obra, resumen financiero (carpintería + obra civil = inversión total), impresión PDF.
2. **Viewer3DModal** (`src/components/specialized/Viewer3DModal.tsx:221 líneas`) — visor 3D Three.js en `ProjectDetails` (taller), tabs por espacio: Items cotizados, Tareas pendientes, Multimedia. Actualmente placeholder (cubo rotatorio).

**¿Fase?:** **NO es F2**. Es fase posterior (F7 Cliente/docs + frontstage o fase dedicada). Requiere sub-diamante propio cuando se diseñe porque:
- Involucra **3D real** (integración SketchUp/OpenCutList → CVC → visor web)
- Diferente audiencia (cliente vs comercial)
- Diferente stack (Three.js / WebGL / posible R3F)
- Snapshot público vs datos vivos

**Bloqueante actual:** Falta destilar completamente. **Acción:** Cuando se inicie F7 (o fase dedicada), lanzar sub-agente para destilar `PublicProposal` + `Viewer3DModal` + `public-proposal.ts` y abrir sub-diamante M-XX.

---

## 2. Layout Principal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER (sticky)                                                             │
│ [Logo]  Cotizador  |  SmartSearch(proyectos)  |  [Nuevo]  [Usuario]        │
├──────────────────┬────────────────────────────────────────────┬─────────────┤
│                  │                                            │             │
│  SIDEBAR IZQ     │           ÁREA CENTRAL                     │  PANEL DER  │
│  (280px)         │           (flex-1, min-w-0)                │  (320px,    │
│                  │                                            │   sticky)   │
│  ┌────────────┐  │  ┌──────────────────────────────────────┐  │  ┌────────┐ │
│  │ Header     │  │  │ EspacioCard 1 (Cocina)               │  │  │ RESUMEN│ │
│  │ Proyecto   │  │  │ ┌─ Collapse: Descripción             │  │  │        │ │
│  │  Nombre    │  │  │ ┌─ Collapse: Variantes (tabs)        │  │  │ Mat.   │ │
│  │  Cliente   │  │  │ │  [V1 Activa] [V2] [+]              │  │  │ MO     │ │
│  │  Estado ▼  │  │  │ │  ┌─ Collapse: Items (tabla)        │  │  │ SubT   │ │
│  │  Tipo ▼    │  │  │ │  │ ItemRow × N                      │  │  │ Costos │ │
│  │  Dir.Obra  │  │  │ │  │ [+ Item]                         │  │  │ Imprev │ │
│  │            │  │  │ │  └─ Collapse: Imágenes             │  │  │ Desc.  │ │
│  ├────────────┤  │  │ │  ┌─ Collapse: Notas                │  │  │ Ajuste │ │
│  │ Config     │  │  │ │  ┌─ Collapse: Colores              │  │  │ IVA    │ │
│  │ Taller ⚙   │  │  │ │  ┌─ Collapse: Mano de Obra         │  │  │ TOTAL  │ │
│  │ Transic. 🔗 │  │  │ │  ┌─ Collapse: Presupuesto Adic.   │  │  │ TOT+IVA│ │
│  └────────────┘  │  │  │ EspacioCard 2 (Estudio) ...       │  │  └────────┘ │
│                  │  │  └────────────────────────────────────┘  │             │
│                  │  │                                            │  ┌────────┐ │
│                  │  │  [Footer: Guardar] [Generar Contrato]     │  │ ACCIONES│ │
│                  │  │                                            │  │ [PDF]   │ │
└──────────────────┴────────────────────────────────────────────┴──┴────────┘ │
```

---

## 3. Componentes Principales

### 3.1 Header Proyecto (Sidebar Izq — siempre visible)

| Campo | Tipo | Comportamiento |
|---|---|---|
| **Nombre proyecto** | Input text | `useAutoSave` → `proyectos.nombre_proyecto` |
| **Cliente** | `HybridClientSelector` | Combobox + crear on-the-fly (`useSmartSearch` sobre `clientes`) |
| **Estado** | Select (enum `estadoProyecto`) | Opciones desde `parametros.transiciones_proyecto` (matriz válida desde estado actual). `useAutoSave` |
| **Tipo proyecto** | Select (enum `tipoProyecto`) | `producto_fijo` \| `proyecto_a_medida` \| `servicio_tecnico` |
| **Dirección obra** | Textarea | `useAutoSave` → `proyectos.direccion_obra` |
| **Costos operativos** | MoneyInput | `useAutoSave` → `proyectos.costos_operativos` |
| **Imprevistos instalación** | MoneyInput | `useAutoSave` → `proyectos.imprevistos_instalacion` |
| **Descuento comercial** | MoneyInput | `useAutoSave` → `proyectos.descuento_comercial` |
| **Ajuste arbitrario** | MoneyInput | `useAutoSave` → `proyectos.ajuste_arbitrario` |
| **IVA** | Checkbox + Number (19% default) | `aplica_iva`, `porcentaje_iva` |
| **Garantía años** | Number | `proyectos.garantia_anios` |

---

### 3.2 Panel Configuración Taller (Sidebar — sección colapsable "⚙ Taller")

**FR:** Ver y editar la base de costos del taller que deriva las 3 tarifas MO. **No editar tarifas directo** — editar variables físicas.

```typescript
// Server function (calculada en runtime, no persistida)
interface TarifasCalculadas {
  costo_hora_taller: number;      // (arriendo * (1 + pct_mant)) / horas_mes
  tarifa_dev: number;             // = costo_hora_taller
  tarifa_assembly: number;        // = costo_hora_taller + costo_hora_operario_base
  tarifa_install: number;         // = costo_hora_taller * factor_logistica
}
```

**UI (read-only calculated + editable base params):**

| Variable Física (editable) | Input | Valor Calculado (read-only) |
|---|---|---|
| **Arriendo mensual taller** | MoneyInput | — |
| **Horas mes taller (capacidad)** | Number | — |
| **% Mantenimiento máquinas** | Number (0-100, 1 decimal) | — |
| **Factor logística instalación** | Number (1 decimal) | — |
| **Costo hora operario base** | MoneyInput (desde `parametros` F0) | — |
| | | **Costo hora taller** = (Arriendo × (1+%Mant)) / HorasMes |
| | | **Tarifa Desarrollo** = Costo hora taller |
| | | **Tarifa Ensamblaje** = Costo hora taller + Costo hora operario |
| | | **Tarifa Instalación** = Costo hora taller × Factor logística |

**Guardado:** `useAutoSave` sobre cada param base → `parametros` (dispara recálculo server-side de tarifas).

**Validación:** Si `horas_mes_taller = 0` → error "Capacidad requerida".

---

### 3.3 Panel Transiciones Estado (Sidebar — sección colapsable "🔗 Transiciones")

**FR:** Ver matriz de transiciones válidas desde estado actual. Editar en admin (fase posterior).

```typescript
// parametros.transiciones_proyecto = {
//   "activa": ["enviada", "perdida", "cancelada"],
//   "enviada": ["en_contrato", "activa", "perdida"],
//   "en_contrato": ["pre_produccion", "enviada", "perdida"],
//   "pre_produccion": ["produccion", "en_contrato"],
//   "produccion": ["entregado", "pre_produccion"],
//   "entregado": [],
//   "perdida": ["activa"],
//   "cancelada": ["activa"]
// }
```

**UI (read-only en cotizador):**
- Lista: `Estado actual → [Destinos permitidos]`
- Badge verde/rojo en Kanban según transición válida
- Link "Gestionar transiciones" → `/admin/parametros/transiciones` (fase posterior)

---

### 3.4 EspacioCard (Área Central — uno por espacio del proyecto)

**Estructura (11 CollapseStrips, todos `defaultOpen` salvo Imágenes/Notas):**

| # | CollapseStrip | Contenido | Novedades C1-C4 |
|---|---|---|---|
| 1 | **Header Espacio** | Nombre, `visible_pdf`, orden, duplicar, mover, eliminar | — |
| 2 | **Descripción** | Textarea (común a variantes) | — |
| 3 | **Variantes (Tabs)** | Tabs: una activa (`activa=true`), add/dup/del/rename/reorder/toggle `visible_pdf` | — |
| 4 | **Descripción Alternativa** | Textarea (por variante activa) | — |
| 5 | **Items (Tabla)** | **ItemRow × N** + `[+ Item]` | **C2, C4** |
| 6 | **Imágenes** | Grid, reorder, delete, `SmartImageInput` | — |
| 7 | **Notas** | Lista reordenable markdown simple | — |
| 8 | **Colores/Acabados** | Swatches + catálogo global + crear nuevo (upload) | — |
| 9 | **Mano de Obra** | 3 `DayCounter` (desarrollo/ensamblaje/instalación) + **tarifas calculadas read-only** | **C1** |
| 10 | **Subtotal Espacio** | Materiales / MO / Total (read-only) | **C1, C2** |
| 11 | **Presupuesto Adicional (Referenciales)** | Agrupación visual por `grupo_referencial` de items con `es_referencial=true` | **C2** |

---

### 3.5 ItemRow (Fila de tabla en Collapse 5 — Items)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Descripción ▼]  [Und]  [Cant]  [Precio ₽]  [Total ₽]  [Img]  [🗑] [✎]   │
│  Popover:                                                                   │
│  ┌─ SmartSearch(catálogo) ── [Nuevo producto]                              │
│  │  SKU  |  Descripción          | Tipo  | P.Público  | P.Directo  │      │
│  │  MDF-18|  Tablero MDF 18mm     | Mat   | $85.000    | $62.000    │      │
│  │  HNG-01|  Bisagra 35mm soft    | Her   | $12.500    | $8.900     │      │
│  └─────────────────────────────────────────────────────                   │
│                                                                            │
│  Si item tiene es_referencial=true:                                       │
│  [☑ Referencial]  [Fuente ▼]  [Grupo: "Electrodomésticos"]               │
│     Fuente: Electrodoméstico | Obra civil | Servicio tercero | Otro      │
└────────────────────────────────────────────────────────────────────────────┘
```

**Campos y comportamiento:**

| Campo | Tipo | Comportamiento | Novedad C1-C4 |
|---|---|---|---|
| **Descripción** | Popover + `useSmartSearch` | Busca `productos_catalogo` (fuzzy). Seleccionar → autollenar resto. `[Nuevo producto]` → modal crear catálogo. | — |
| **Unidad** | Input text | Heredada de catálogo, editable | — |
| **Cantidad** | Number (step 0.1, min 0) | `onChange` → recalcula `total_linea = cant × precio` | — |
| **Precio** | `MoneyInput` | **Default = `catalogo.precio_publico`** (C4). Editable. `onBlur` → recalcula total. | **C4** |
| **Total** | Display (COP formateado) | `cantidad × precio_unitario` (siempre recalculado) | — |
| **Imagen** | Thumbnail + click | Override de `catalogo.imagen_url` | — |
| **☑ Referencial** | Checkbox | **C2**: Si checked → `es_referencial=true`, no suma a total contractual, muestra badge "Referencial" | **C2** |
| **Fuente ▼** | Select | **C2**: Visible si `es_referencial`. Opciones: `electrodomestico`, `obra_civil`, `servicio_tercero`, `otro` | **C2** |
| **Grupo** | Input text | **C2**: Visible si `es_referencial`. Agrupación visual en Collapse 11. Libre: "Electrodomésticos", "Ventanas", etc. | **C2** |
| **Acciones** | Icon buttons | `✎` Editar catálogo (si tiene `catalogo_id`), `🗑` Eliminar (`anulado=true` soft delete) | — |

**Cálculo total línea:**
```typescript
const total_linea = cantidad * precio_unitario;
// Si es_referencial → NO se suma en Grand Totals (gt.mo / gt.materiales)
```

---

### 3.6 Collapse 9 — Mano de Obra (por variante)

```
┌────────────────────────────────────────────────────────────┐
│  Desarrollo técnico     [DayCounter: jornadas]  Tarifa: $X │
│  Ensamblaje taller      [DayCounter: jornadas]  Tarifa: $Y │
│  Instalación obra       [DayCounter: jornadas]  Tarifa: $Z │
│                                                            │
│  Subtotal MO: $TOTAL (read-only, calculado)               │
│                                                            │
│  ℹ Tarifas derivadas de: Costo hora taller + params base  │
│     [Ver configuración taller ⚙]                          │
└────────────────────────────────────────────────────────────┘
```

- **DayCounter:** Number input (step 0.5, min 0) → `espacio_variantes.jornadas_desarrollo_tecnico` etc.
- **Tarifas:** Read-only, calculadas en server desde `parametros` (C1). Link abre panel "Configuración Taller".
- **Subtotal MO:** `jornadas_dev × tarifa_dev + jornadas_ens × tarifa_assembly + jornadas_inst × tarifa_install`

---

### 3.7 Collapse 11 — Presupuesto Adicional (Referenciales)

**FR:** Mostrar items referenciales agrupados por `grupo_referencial` para dar visibilidad de inversión total estimada con terceros.

```
┌────────────────────────────────────────────────────────────┐
│  ▼ Electrodomésticos (2 items)              [+ Item ref]  │
│     ☑ Nevera Samsung 300L        1 × $1.200.000 = $1.2M   │
│     ☑ Horno Empotrable Bosch     1 × $850.000   = $850K   │
│       Grupo: Electrodomésticos | Fuente: electrodomestico │
│                                                            │
│  ▼ Obra Civil / Ventanas (1 item)           [+ Item ref]  │
│     ☑ Ventanas PVC 3m            3 × $450.000   = $1.35M  │
│       Grupo: Ventanas | Fuente: obra_civil                │
│                                                            │
│  TOTAL REFERENCIAL: $3.4M  (no incluido en contrato)      │
└────────────────────────────────────────────────────────────┘
```

- **Agrupación visual** por `grupo_referencial` (string libre, case-insensitive)
- **Badge "Referencial"** (amber) en cada fila
- **No suma** a Grand Totals contractuales
- **Botón `[+ Item ref]`** → añade ItemRow con `es_referencial=true` pre-checkeado
- **Botón "Anexar a catálogo"** (en ItemRow referencial) → modal crear `productos_catalogo` con datos completos + `es_referencial=false`

---

### 3.8 Panel Derecho — Resumen + Acciones (Sticky, 320px)

#### Resumen (Grand Totals `gt`)

| Línea | Fórmula | Formato |
|---|---|---|
| **Materiales** | Σ `items_variante.total_linea` (solo `!es_referencial` y `visible_pdf`) | COP |
| **Mano de Obra** | Σ (jornadas × tarifa) por espacio/variante activa | COP |
| **Subtotal** | Materiales + MO | COP |
| **Costos Operativos** | `proyectos.costos_operativos` | COP |
| **Imprevistos** | `proyectos.imprevistos_instalacion` | COP |
| **Descuento** | `proyectos.descuento_comercial` | COP (negativo) |
| **Ajuste** | `proyectos.ajuste_arbitrario` | COP |
| **Total Base** | Subtotal + Costos + Imprev - Desc + Ajuste | COP |
| **IVA** | `aplica_iva ? Total Base × (porcentaje_iva/100) : 0` | COP |
| **TOTAL** | Total Base + IVA | **COP (destacado, size-lg)** |

#### Acciones

| Botón | Acción | Validación |
|---|---|---|
| **Guardar** | `useAutoSave.flush()` + toast "Guardado" | — |
| **Generar Contrato** | Abre `ContratoModal` | Cliente requerido, Total > 0 |
| **Exportar PDF** | `exportar_propuesta_pdf` zap (flush + sync) | — |
| **Activar Producción** | `zap_activar_produccion` (estado → `produccion`) | Solo si `estado ∈ {en_contrato, pre_produccion}` + contrato firmado |

---

### 3.9 ContratoModal (P-05 — integrado en P-04)

**Estructura (5 secciones + PaymentScheduleCalculator):**

| Sección | Campos | Autollenado |
|---|---|---|
| **1. Contratante** | Nombre*, Doc, Domicilio, Email, Tel | Cliente + `proyecto.direccion_obra` |
| **2. Plazos** | Texto semanas, Holgura días, Garantía años | `proyecto.plazo_ejecucion_texto`, `holgura_dias`, `garantia_anios` |
| **3. Especificaciones** | 4 textareas: Estructura, Herrajes, Mesones, Desmonte | **Compilado dinámicamente** desde items `visible_pdf` agrupados por `tipo` catálogo |
| **4. Objeto** | Lista items (1 línea c/u) | Espacios `visible_pdf` + items |
| **5. Valor + Hitos** | `MoneyInput` (valor_total editable) + `PaymentScheduleCalculator` | `calculatedTotal` default. Hitos: 50/25/25% editable |

**PaymentScheduleCalculator (ya destilado):**
- Componente 100% controlado (`milestones[]` prop + `onChange`)
- Add/Remove hitos, tipo % \| fijo, fecha límite, razón
- Barra progreso + validación suma exacta = `valor_total` (±0.01)
- `hitos_pago` → tabla separada `hitos_pago` (1:N)

---

## 4. Flujo de Datos (Server ↔ Client)

```
Server Component (page.tsx)
  └─ Promise.all:
       ├─ getProyecto(proyectoId) → header + costos + estados
       ├─ getCliente(clienteId)
       ├─ getEspacioVariantes(proyectoId) → espacios + variantes + items + imágenes + colores + notas
       ├─ getCatalogo() → productos_catalogo (para SmartSearch)
       ├─ getParametrosTarifas() → 5 params físicos + costo_hora_operario_base
       └─ getParametrosTransiciones() → matriz JSON
  → Props a Client Component (CotizadorClient)

Client Component (CotizadorClient)
  ├─ Estado local: header, espacios, variantes, items, activeVarMap
  ├─ useAutoSave(header, key=proyectoId, delay=800ms)
  ├─ useSmartSearch(proyectosList)
  ├─ useDebounce(búsqueda catálogo, 300ms)
  ├─ Cálculo gt (memo, derivado de estado local + tarifas server)
  └─ Actions:
       ├─ saveHeader → PATCH /api/erp/proyectos/:id (header fields)
       ├─ saveEspacioVariante → POST/PATCH /api/erp/espacio-variantes
       ├─ saveItem → POST/PATCH /api/erp/items-variante
       ├─ generateContrato → POST /api/erp/contratos (zap generar_contrato)
       └─ exportPDF → POST /api/erp/propuestas (zap exportar_propuesta_pdf)
```

---

## 5. Validaciones de Negocio (Client + Server)

| Regla | Dónde | Error |
|---|---|---|
| Cliente requerido para contrato | Client (modal) + Server (zap) | "Seleccione un cliente" |
| Total > 0 para contrato | Client + Server | "Total debe ser mayor a 0" |
| Suma hitos = valor_total (±0.01) | Client (PaymentScheduleCalculator) + Server | "Hitos no suman el total" |
| Transición estado válida | Server (zap_validar_transicion_estado) | "Transición no permitida: X → Y" |
| `horas_mes_taller > 0` si hay MO | Server (parametros) | "Capacidad taller requerida" |
| `precio_unitario ≥ 0` | Client (MoneyInput) | "Precio inválido" |
| `cantidad > 0` | Client (NumberInput) | "Cantidad inválida" |

---

## 6. Estados de Pantalla

| Estado | Qué muestra |
|---|---|
| **Cargando** | `Suspense` fallback (skeleton cards) |
| **Error carga** | Alert + botón "Reintentar" |
| **Proyecto no encontrado** | `notFound()` |
| **Sin permiso (rol ≠ comercial/admin)** | 403 page |
| **Auto-guardando** | Spinner sutil en header "Guardando..." |
| **Guardado** | Toast "Cambios guardados" (2s) |
| **Contrato generado** | Modal éxito + email preview + link PDF |

---

## 7. Accesibilidad (a11y)

- `MoneyInput`: `aria-label="Precio unitario"`, `inputmode="decimal"`
- `DayCounter`: `aria-label="Jornadas desarrollo"`, `step="0.5"`
- `SmartSearch`: `role="combobox"`, `aria-autocomplete="list"`
- `CollapseStrip`: `aria-expanded`, `aria-controls`
- Kanban: `role="list"`, items `role="listitem"`, `aria-selected`
- Focus visible en todos los interactivos (tokens `--focus-ring`)
- `prefers-reduced-motion`: desactiva animaciones Collapse/Modal

---

## 8. Checklist de Aprobación (Supervisor)

- [ ] Layout general (Header, Sidebar, Central, Panel Derecho)
- [ ] Header Proyecto (campos, auto-save, cliente selector)
- [ ] Panel Configuración Taller (5 params físicos, 3 tarifas calculadas read-only)
- [ ] Panel Transiciones (read-only matriz desde parametros)
- [ ] EspacioCard 11 collapse strips (orden, contenido)
- [ ] ItemRow (SmartSearch catálogo, MoneyInput, toggle Referencial, Fuente, Grupo)
- [ ] Mano de Obra (DayCounters + tarifas read-only + link config)
- [ ] Presupuesto Adicional (agrupación visual por grupo_referencial, no suma a total)
- [ ] Resumen Grand Totals (fórmulas correctas, IVA condicional)
- [ ] ContratoModal (5 secciones, especificaciones compiladas, PaymentScheduleCalculator)
- [ ] Acciones (Guardar, Generar Contrato, PDF, Activar Producción)
- [ ] Validaciones (client + server)
- [ ] Accesibilidad (tokens, focus, reduced-motion)

---

## 9. Próximos Pasos (tras aprobación)

1. **Iniciador** escribe `plan_t-078.md` (detalle implementación P-04)
2. **Agente Código** implementa:
   - Migración BD (3 campos `items_variante` + 5 params)
   - Seed params por defecto
   - Server components + API routes
   - Client component `CotizadorClient` con todos los sub-componentes
   - Tests unitarios (cálculo gt, tarifas, items referenciales)
3. **QA** verifica: `tsc`, `eslint`, `next build`, tests, E2E contra `dev-local`

---

**¿Apruebas este diseño de pantalla P-04?**
Si sí → F2 desbloqueada, Iniciador escribe `plan_t-078.md`.
Si ajustes → indícalos y re-itero.