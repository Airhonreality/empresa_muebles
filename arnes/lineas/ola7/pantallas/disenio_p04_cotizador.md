# P-04 — Cotizador (Veta de Oro)

**Fecha:** 2026-08-05 · **Estado:** Propuesta para aprobación del Supervisor · **Fase:** F2 · **Ruta:** `/app/erp/cotizador/[proyectoId]` · **Roles:** admin, comercial

**Dependencias:** Decisiones diamante exclusivo C1-C4 aprobadas · **Artefactos base:** `destilacion_cotizador_contrato.md`, `m06_capa_tecnica_transversal.md`, `glosario_h07.md`

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

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`). No redefinas schemas aquí.*

| Entidad | § del REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| `proyectos` | §3 Comercial | id, estado, nombre_proyecto, cliente_id, direccion_obra, tipo_proyecto, costos_operativos, imprevistos_instalacion, descuento_comercial, ajuste_arbitrario, aplica_iva, porcentaje_iva, garantia_anios, comercial_id | Header proyecto (Sidebar Izq): nombre, estado, tipo, dirección, costos, imprevistos, descuento, ajuste, IVA, garantía. Auto-save via PATCH. |
| `clientes` | §3 Comercial | id, nombre, documento, telefono | HybridClientSelector (combobox + crear on-the-fly con `useSmartSearch`) |
| `espacio_variantes` | §3 Comercial | id, proyecto_id, nombre, visible_pdf, orden, activa, jornadas_desarrollo_tecnico, jornadas_ensamblaje_taller, jornadas_instalacion_obra | EspacioCard: 11 CollapseStrips por espacio. Variantes con tabs (una activa). DayCounters de MO. |
| `items_variante` | §3 Comercial | id, espacio_variante_id, catalogo_id, descripcion, cantidad, precio_unitario, total_linea, es_referencial, fuente_referencial, grupo_referencial, visible_pdf | ItemRow: tabla de items dentro de Collapse 5. Items referenciales (C2) en Collapse 11. Cálculo de Grand Totals. |
| `espacios_artefactos` | §3 Comercial | id, espacio_variante_id, categoria, dimensiones_mm, tipo_specifique, ubicacion, foto_url, requiere_verificacion, validado_por, validado_en | Collapse "Artefactos del espacio" (INSTANCIA). Badge por categoría (determinante/electrodomestico/bloqueante/obra_civil/servicio_tercero). Formulario crear/editar medidas, ubicación, foto. Estado pendiente verificación/validado. **No duplica la ficha técnica del catálogo (CLASE).** |
| `productos_catalogo` | §2 Catálogo | id, sku, descripcion, precio_publico, precio_directo, tipo_catalogo, imagen_url, unidad_medida | SmartSearch en ItemRow para buscar/autollenar (SÓLO CONSUMO — no crea catálogo inline). `[Nuevo producto]` → navega a **P-27 Catálogo** (POC-12). Default precio = `precio_publico` (C4). |
| `parametros` | §1 Cimientos F0 | clave, valor | Tarifas taller: arriendo_mensual_taller, horas_mes_taller, pct_mantenimiento_maquinas, factor_logistica_instalacion, costo_hora_operario_base. Transiciones estado: `transiciones_proyecto` (matriz JSON). |
| `contratos` | §4 Contratos | id, proyecto_id, codigo_contrato, valor_total, plazo_ejecucion_texto, holgura_dias, garantia_anios, especificaciones_estructura, especificaciones_herrajes, especificaciones_mesones, especificaciones_desmonte | ContratoModal (5 secciones). Especificaciones compiladas dinámicamente desde items `visible_pdf` agrupados por tipo. |
| `hitos_pago` | §4 Contratos | id, contrato_id, tipo, monto_o_porcentaje, razon, fecha_limite | PaymentScheduleCalculator (componente 100% controlado). Add/Remove hitos, tipo % o fijo. Suma exacta = valor_total. |

---

## 2. Estados que transiciona

*Cita los estados del REGISTRO DE ENTIDADES y del glosario H07. Los estados canónicos del REGISTRO (§3, `proyectos`) son: `borrador → en_revision → cotizado → desarrollo → aprobado_compras → armado → verificado → instalado → entregado / perdida / cancelada`. La pantalla opera sobre la matriz de transiciones configurable en `parametros.transiciones_proyecto`.*

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| `activa` | Cambiar estado → "enviada" | `enviada` | — | — |
| `activa` | Cambiar estado → "perdida" | `perdida` | — | — |
| `activa` | Cambiar estado → "cancelada" | `cancelada` | — | — |
| `enviada` | Cambiar estado → "en_contrato" | `en_contrato` | — | — |
| `enviada` | Cambiar estado → "activa" | `activa` | — | — |
| `enviada` | Cambiar estado → "perdida" | `perdida` | — | — |
| `en_contrato` | Cambiar estado → "pre_produccion" | `pre_produccion` | — | — |
| `en_contrato` | Cambiar estado → "enviada" | `enviada` | — | — |
| `en_contrato` | Cambiar estado → "perdida" | `perdida` | — | — |
| `pre_produccion` | Cambiar estado → "produccion" | `produccion` | — | — |
| `pre_produccion` | Cambiar estado → "en_contrato" | `en_contrato` | — | — |
| `produccion` | Cambiar estado → "entregado" | `entregado` | — | — |
| `produccion` | Cambiar estado → "pre_produccion" | `pre_produccion` | — | — |
| `perdida` | Cambiar estado → "activa" | `activa` | — | — |
| `cancelada` | Cambiar estado → "activa" | `activa` | — | — |
| — | "Enviar cotización" (Publicar propuesta) | `cotizado` / `enviada` | E-09 | Requiere ≥1 espacio |
| — | "Generar contrato" | `en_revision` (proyecto) / `borrador` (contrato) | E-12 | Cliente requerido, Total > 0, ∃ items_variante con cantidad > 0 |
| — | "Activar Producción" | `produccion` | — | Solo si `estado ∈ {en_contrato, pre_produccion}` + contrato firmado |

**Estados de pantalla (UI):**

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

## 3. Vocabulario H07 (labels visibles)

*Cita del `glosario_h07.md`. Todo label de UI sale de aquí.*

| Label natural | Código interno | Entidad.campo |
|---|---|---|
| "Borrador" | `borrador` | `proyectos.estado` (B.0) |
| "En revisión" | `en_revision` | `proyectos.estado` (B.0) |
| "Cotizado" | `cotizado` | `proyectos.estado` (B.0) |
| "Propuesta" | `enviada` | `proyectos.estado` (B.0 legacy) |
| "Proyecto" / "obra" | — | `proyectos` (A) |
| "Cliente" / "comprador" | — | `clientes` (A) |
| "Contrato" / "contrato de obra" | — | `contratos` (A) |
| "Hito de pago" / "etapa de pago" | — | `hitos_pago` (A) |
| "Esquema" / "schema" | — | `schemas_proyecto` (A) |
| "Espacio" / "espacio arquitectónico" | — | `espacio_variantes` (A) |
| "Variante" / "variante de espacio" | — | `espacio_variantes` (A) |
| "Componente / Ítem" / "pieza" | — | `items_variante` (A) |
| "Módulo" / "módulo de mueble" | — | `modulos` (A) |
| "Costos operativos" | — | `proyectos.costos_operativos` (D.3) |
| "Imprevistos de instalación" | — | `proyectos.imprevistos_instalacion` (D.3) |
| "Descuento comercial" | — | `proyectos.descuento_comercial` (D.3) |
| "Garantía" | — | `proyectos.garantia_anios` (D.3/D.4) |
| "Aplica IVA" / "% IVA" | — | `proyectos.aplica_iva` / `porcentaje_iva` (D.3) |
| "Jornadas de desarrollo" | — | `espacio_variantes.jornadas_desarrollo_tecnico` (D.3) |
| "Jornadas de ensamble" | — | `espacio_variantes.jornadas_ensamblaje_taller` (D.3) |
| "Jornadas de instalación" | — | `espacio_variantes.jornadas_instalacion_obra` (D.3) |
| "Artefacto del espacio" / "objeto determinante" / "objeto bloqueante" | — | `espacios_artefactos` (A, REGISTRO §3) |
| "Orden de compra" (nunca "OC") | — | `ordenes_compra` (A, decisión H07) |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Cliente requerido para generar contrato | Client (ContratoModal) + Server (zap) | Test: intentar generar contrato sin cliente → error "Seleccione un cliente" |
| R2 | Total > 0 para generar contrato | Client + Server | Test: contrato con total=0 → error "Total debe ser mayor a 0" |
| R3 | Suma de hitos = valor_total (±0.01) | Client (PaymentScheduleCalculator) + Server | Test: hitos [40,35,25] con valor_total=100 → OK; hitos [40,30,25] con valor_total=100 → error |
| R4 | Transición de estado válida según matriz `transiciones_proyecto` | Server (zap_validar_transicion_estado) | Test: transición `entregado → produccion` → 422 "Transición no permitida: X → Y" |
| R5 | `horas_mes_taller > 0` si hay mano de obra configurada | Server (parametros) | Test: horas_mes_taller=0, intentar guardar → error "Capacidad taller requerida" |
| R6 | `precio_unitario ≥ 0` | Client (MoneyInput) | Test: ingresar precio=-1000 → error "Precio inválido" |
| R7 | `cantidad > 0` | Client (NumberInput) | Test: ingresar cantidad=0 → error "Cantidad inválida" |
| R8 | Items con `es_referencial=true` no suman a Grand Totals contractuales | Client (cálculo gt memo) + Server | Test: espacio con 2 items (1 normal $100, 1 referencial $50) → gt.materiales = $100, no $150 |
| R9 | Tarifas de mano de obra son calculadas server-side, no editables directo | Server (read-only) | Test: PATCH tarifa_dev directo → 422 (campo calculado, no mutable) |
| R10 | Precio default de nuevo item = `catalogo.precio_publico` (C4) | Client (ItemRow onSelect) | Test: seleccionar producto con precio_publico=$85.000 → campo precio prellenado con $85.000 |

---

## 5. Componentes UI

**Layout Principal:**
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

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `HeaderProyecto` | Server + Client | `proyecto: Proyecto, onUpdate` | `proyectos` | `--color-primary`, `Fraunces` |
| `HybridClientSelector` | Client | `value, onChange, clientes: Cliente[]` | `clientes` | `useSmartSearch` |
| `PanelConfiguracionTaller` | Client (sidebar colapsable) | `params: Parametro[], tarifas: TarifasCalculadas` | `parametros` | Section collapse "⚙ Taller" |
| `PanelTransicionesEstado` | Client (sidebar read-only) | `matriz: TransicionMap, estadoActual: string` | `parametros.transiciones_proyecto` | Badge verde/rojo según válida |
| `EspacioCard` | Client | `espacio: EspacioVariante, catalogo: ProductoCatalogo[], onUpdate` | `espacio_variantes` | 12 CollapseStrips, `--radius-md` |
| `CollapseStrip` | Client | `title, defaultOpen, content` | — | `aria-expanded`, `--focus-ring` |
| `ItemRow` | Client | `item: ItemVariante, catalogo: ProductoCatalogo[], onUpdate, onDelete` | `items_variante` | MoneyInput, SmartSearch, badge "Referencial" (amber) |
| `DayCounter` | Client | `value, onChange, label, tarifa, step=0.5, min=0` | `espacio_variantes.jornadas_*` | `--focus-ring`, aria-label |
| `MoneyInput` | Client | `value, onChange, aria-label, inputmode="decimal"` | — | `--color-primary`, COP formatter |
| `SmartSearch` | Client | `items, onSelect, placeholder` | `productos_catalogo` | `role="combobox"`, `aria-autocomplete="list"` |
| `ResumenPanel` | Client (sticky, 320px) | `gt: GrandTotals, acciones: ActionProps[]` | — | Display COP, destacado size-lg el TOTAL |
| `ContratoModal` | Client (modal) | `proyectoId, cliente, espacios, onClose` | `contratos`, `hitos_pago` | 5 secciones, PaymentScheduleCalculator |
| `PaymentScheduleCalculator` | Client | `milestones, valor_total, onChange` | `hitos_pago` | Barra progreso, add/remove hitos, validación suma exacta |

**Especificaciones completas de cada componente:**

### HeaderProyecto (Sidebar Izq — siempre visible)

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

### PanelConfiguracionTaller (Sidebar — sección colapsable "⚙ Taller")

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

### PanelTransicionesEstado (Sidebar — sección colapsable "🔗 Transiciones")

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

### EspacioCard (Área Central — uno por espacio del proyecto)

**Estructura (11 CollapseStrips, todos `defaultOpen` salvo Imágenes/Notas):**

| # | CollapseStrip | Contenido | Novedades C1-C4 |
|---|---|---|---|
| 1 | **Header Espacio** | Nombre, `visible_pdf`, orden, duplicar, mover, eliminar | — |
| 2 | **Descripción** | Textarea (común a variantes) | — |
| 3 | **Variantes (Tabs)** | Tabs: una activa (punto verde `bg-emerald-500`), add/dup/del/rename/reorder/toggle `visible_pdf`. La variante activa se controla desde el header del espacio (ícono ojo + tab con punto verde), no desde formulario. | — |
| 4 | **Items (Tabla)** | **ItemRow × N** + `[+ Item]` | **C2, C4** |
| 5 | **Artefactos del Espacio** | Lista de artefactos con badge de categoría, nombre/modelo, dimensiones mm, ubicación, estado (pendiente verificación/validado). Formulario crear/editar medidas y foto. `[+ Artefacto]` | — |
| 6 | **Imágenes** | Grid, reorder, delete, `SmartImageInput` | — |
| 7 | **Notas** | Lista reordenable markdown simple | — |
| 8 | **Colores/Acabados** | Swatches + catálogo global + crear nuevo (upload) | — |
| 9 | **Mano de Obra** | 3 `DayCounter` (desarrollo/ensamblaje/instalación) + **tarifas calculadas read-only** | **C1** |
| 10 | **Subtotal Espacio** | Materiales / MO / Total (read-only) | **C1, C2** |
| 11 | **Presupuesto Adicional (Referenciales)** | Agrupación visual por `grupo_referencial` de items con `es_referencial=true` | **C2** |

### ItemRow (Fila de tabla en Collapse 5 — Items)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Descripción ▼]  [Und]  [Cant]  [Precio ₽]  [Total ₽]  [Img]  [🗑] [✎]   │
│  Popover:                                                                   │
│  ┌─ SmartSearch(catálogo) ── [Nuevo producto → P-27]                          │
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
| **Descripción** | Popover + `useSmartSearch` | Busca `productos_catalogo` (fuzzy). Seleccionar → autollenar resto. `[Nuevo producto]` → **navega a P-27** (POC-12: crear catálogo es de diseño-desarrollo, no inline). | — |
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

### Collapse 9 — Mano de Obra (por variante)

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

### Collapse 11 — Presupuesto Adicional (Referenciales)

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
- **Botón "Anexar a catálogo"** (en ItemRow referencial) → navega a **P-27 Catálogo** con los datos del ítem prellenados en el modal de creación (POC-12: la creación del catálogo es del área diseño-desarrollo; el comercial propone el anexo, D-Desarrollo aprueba/clasifica)

### Panel Derecho — Resumen + Acciones (Sticky, 320px)

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

### ContratoModal (P-05 — integrado en P-04)

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

### Accesibilidad (a11y)

- `MoneyInput`: `aria-label="Precio unitario"`, `inputmode="decimal"`
- `DayCounter`: `aria-label="Jornadas desarrollo"`, `step="0.5"`
- `SmartSearch`: `role="combobox"`, `aria-autocomplete="list"`
- `CollapseStrip`: `aria-expanded`, `aria-controls`
- Kanban: `role="list"`, items `role="listitem"`, `aria-selected`
- Focus visible en todos los interactivos (tokens `--focus-ring`)
- `prefers-reduced-motion`: desactiva animaciones Collapse/Modal

**Patrones M-06 L1 usados:** `useAutoSave`, `useSmartSearch`, `useDebounce`, `MoneyInput`, `COP`, `Suspense`, `Promise.all`

---

## 6. Comportamiento

### Flujo de Datos (Server ↔ Client)

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

### Tabla de eventos y gatillos

| # | Evento | Gatillo | Acción | Side effect | Trace E-XX |
|---|---|---|---|---|---|
| 1 | Cargar pantalla | `page.tsx` mount | `Promise.all([proyectos, clientes, catalogo, parametros, transiciones])` | — | — |
| 2 | Cambiar estado | Select "Estado" / menú "Cambiar estado →" | `PATCH /api/erp/proyectos/:id {estado}` | `eventos` registra cambio | E-09 |
| 3 | Auto-save header | `useAutoSave` + debounce 800ms | `PATCH /api/erp/proyectos/:id` (header fields) | `eventos` registra mutación | — |
| 4 | Auto-save espacio/variante | `useAutoSave` | `POST/PATCH /api/erp/espacio-variantes` | `eventos` registra mutación | — |
| 5 | Auto-save item | `useAutoSave` | `POST/PATCH /api/erp/items-variante` | Recalcula gt memo | — |
| 6 | Seleccionar producto catálogo | `useSmartSearch` onSelect | Autollenar ItemRow (descripción, unidad, precio, imagen) | C4: precio default = `precio_publico` | — |
| 7 | Toggle item referencial | Checkbox "☑ Referencial" | `es_referencial=true/false` | Recalcula gt (excluye de totales si true). Muestra badge "Referencial" | C2 |
| 8 | Cambiar jornadas MO | DayCounter onChange | Actualiza `jornadas_*` en `espacio_variantes` | Recalcula subtotal MO y gt | — |
| 9 | Generar contrato | Botón "Generar Contrato" | Abre `ContratoModal` → POST /api/erp/contratos | `eventos` registra E-12 | E-12 |
| 10 | Exportar PDF | Botón "Exportar PDF" | `flush()` auto-guardado + POST /api/erp/propuestas | — | — |
| 11 | Activar producción | Botón "Activar Producción" | `zap_activar_produccion` (estado → `produccion`) | Validar contrato firmado + estado válido | — |
| 12 | Editar params taller | MoneyInput/Number onChange | `PATCH /api/erp/parametros/:clave` | Dispara recálculo server-side de tarifas | — |

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Comando / verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 errores en todo el árbol | `npx tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores en archivos de esta pantalla | `npx eslint app/erp/cotizador/` |
| CA-3 | Todos los labels usan H07 (no hay strings sueltos en español sin respaldo) | `grep -r "'[A-Z]" app/erp/cotizador/` = 0 resultados sin correspondencia en glosario |
| CA-4 | Layout general renderiza Header, Sidebar, Central, Panel Derecho | Navegar a `/app/erp/cotizador/[id]` → layout visible con 4 zonas |
| CA-5 | Header Proyecto renderiza todos los campos con auto-save | Campos: nombre, cliente, estado, tipo, dir.obra, costos, imprevistos, descuento, ajuste, IVA, garantía |
| CA-6 | ItemRow usa precio por defecto = `catalogo.precio_publico` (C4) | Seleccionar producto con `precio_publico=$85.000` → `precio_unitario=$85.000` |
| CA-7 | Items referenciales no suman a total contractual (C2, R8) | Espacio con item normal ($100) + item referencial ($50) → `gt.materiales = $100` |
| CA-8 | Suma de hitos = valor_total ±0.01 (R3) | `npx tsx __tests__/cotizador/hitos.test.ts` → PASS |
| CA-9 | Tarifas MO son read-only, derivadas de params físicos (C1, R9) | PATCH directo a `tarifa_dev` → 422 |
| CA-10 | Transición de estado inválida → 422 (R4) | POST transición `entregado → produccion` → 422 |
| CA-11 | ContratoModal 5 secciones completas + PaymentScheduleCalculator | Modal visible con: Contratante, Plazos, Especificaciones (compiladas), Objeto, Valor+Hitos |
| CA-12 | PanelConfiguracionTaller: horas_mes_taller=0 → error (R5) | Guardar con horas=0 → "Capacidad taller requerida" |
| CA-13 | Validaciones client: precio < 0 (R6), cantidad ≤ 0 (R7) | Ingresar precio=-1000 → error; cantidad=0 → error |
| CA-14 | Accesibilidad: focus visible, aria labels, prefers-reduced-motion | `aria-label` en MoneyInput, DayCounter, SmartSearch; `aria-expanded` en CollapseStrip |
| CA-15 | `next build` sin errores de compilación (excepto ECONNREFUSED si no hay DB) | `npx next build` — errores de conexión son esperados, otros errores no |

---

## 8. Verificación de integridad (pre-entrega)

Antes de marcar el diseño como "aprobado", el Iniciador verifica:

- [ ] Toda entidad en §1 existe en el `REGISTRO_DE_ENTIDADES.md` (8 entidades: proyectos §3, clientes §3, espacio_variantes §3, items_variante §3, productos_catalogo §2, parametros §1, contratos §4, hitos_pago §4)
- [ ] Todo estado en §2 existe en el `REGISTRO_DE_ENTIDADES.md` y en `glosario_h07.md` (estados legacy desde `parametros.transiciones_proyecto`; estados canónicos desde B.0)
- [ ] Todo label en §3 existe en `glosario_h07.md` (22 entradas con traza a §A, B.0, D.3, D.4)
- [ ] Toda regla en §4 tiene verificación mecánica (R1-R10: cada una con test concreto o condición de error)
- [ ] Todo componente en §5 usa tokens D4 y patrones M-06 L1 (MoneyInput, DayCounter, SmartSearch, CollapseStrip, Suspense, useAutoSave, useSmartSearch, useDebounce)
- [ ] Todo comportamiento en §6 traza a un evento E-XX (E-09 cambio estado, E-12 generar contrato)
- [ ] Los criterios de aceptación en §7 son ejecutables (CA-1 a CA-15: comandos `tsc`, `eslint`, `grep`, `npx tsx`, `next build`)

---

## Apéndice: Sub-Diamante Pendiente — Propuesta de Diseño Virtual

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

## Apéndice: Próximos Pasos (tras aprobación)

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
