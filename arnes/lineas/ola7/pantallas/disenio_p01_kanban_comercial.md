# P-01 — Kanban Comercial (Veta de Oro)

**Fecha:** 2026-08-05 · **Estado:** APROBADO-PROTOTIPO (v2) — validado por el Supervisor en revisión live del prototipo F10-B1 (2026-08-08). Rediseñado con hallazgos POC-01: +columna Negociación, +columna Archivo (agrega perdida+cancelada), −columnas Entregado/Perdida/Cancelada, −IDs en UI. · **Fase:** F2 · **Ruta:** `/erp/comercial` · **Roles:** admin, comercial · **Estado v3:** v3 propuesta — pendiente checkpoint Supervisor (2026-08-15, t-136, input directo de Javier)

**Dependencias:** Decisiones diamante exclusivo C1-C4, M-06 L1 (patrones técnicos), P-04 aprobado
**Artefactos base:** `destilacion_cotizador_contrato.md` (Kanban legacy), `m06_capa_tecnica_transversal.md`, `glosario_h07.md`

---

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`). No redefinas schemas aquí.*

| Entidad | § del REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| `proyectos` | §3 Comercial | id, nombre_proyecto, estado, cliente_id, comercial_id, tipo_proyecto, direccion_obra, costos_operativos, imprevistos_instalacion, descuento_comercial, ajuste_arbitrario, aplica_iva, porcentaje_iva, created_at, updated_at | Tarjeta ComercialCard: nombre_proyecto, estado (badge), cliente_id→nombre, fechas (created_at, updated_at), total_estimado (calculado server-side vía SQL aggregate). Columnas kanban: agrupación por estado (8 legacy). Drag-drop: PATCH estado. Filtros: comercial_id, tipo_proyecto, created_at (rango fechas). Modal crear: nombre_proyecto, tipo_proyecto, direccion_obra, estado. |
| `clientes` | §3 Comercial | id, nombre, telefono, email | Tarjeta: nombre + telefono. SmartSearch: búsqueda fuzzy clientes. HybridClientSelector en NuevoProyectoModal (combobox + crear on-the-fly). |
| `parametros` | §1 Cimientos F0 | clave=`transiciones_proyecto` (JSON) | Matriz única de transiciones válidas. Drag-drop y menú "Cambiar estado →" validan contra esta matriz en client y server (PATCH). |
| `espacio_variantes` | §3 Comercial | id, proyecto_id, activa | Tarjeta: "X espacios" = COUNT WHERE proyecto_id + activa=true. |
| `items_variante` | §3 Comercial | id, espacio_variante_id | Tarjeta: "Items: N" = COUNT via espacio_variantes activas. "Variantes activas: A/T" = COUNT espacios con activa=true / COUNT total espacios. |
| `eventos` | §1 Cimientos F0 | — (append-only, escritura por transición) | Registro de evento al cambiar estado vía PATCH (E-09 y análogos según origen→destino). |

---

## 2. Estados que transiciona

*Cita los estados del REGISTRO DE ENTIDADES y del glosario H07. La máquina de 8 estados es la legacy (consolidado `schema.ts`); el glosario B.0 la marca como "se sustituye por los aditivos de arriba en Fase 3".*

**Estados (columnas kanban) — v2 (POC-01):**

| Orden | Estado (código interno) | Label natural (H07 B.0) | Color | Solo lectura |
|---|---|---|---|---|
| 1 | `activa` | Lead | amber | No |
| 2 | `enviada` | Propuesta | blue | No |
| 3 | `negociacion` | En Negociación | orange | No |
| 4 | `en_contrato` | En contrato | violet | No |
| 5 | `retoma` | Retoma de Medidas | blue | No |
| 6 | `pre_produccion` | Pre-producción | orange | No |
| 7 | `produccion` | Producción | green | Sí |
| 8 | `perdida` + `cancelada` | Archivo | muted | Sí |

> **Nota POC-01:** la columna "Archivo" agrega dos estados (`perdida` + `cancelada`) en un bucket común de solo lectura. Las columnas individuales `entregado`, `perdida` y `cancelada` se eliminaron del kanban comercial. El estado `negociacion` es nuevo (pre-contrato): reuniones y negociación entre comercial y cliente, ocurre después de `enviada` y antes de `en_contrato`.

> **Nota POC-13 (2026-08-09):** el estado `retoma` (Retoma de Medidas) ya existía en el código (`schema.ts`, `COLUMNAS_KANBAN`, `parametros.transiciones_proyecto`, fixtures) pero NO estaba documentado en este diseño — era un gap documental. Se confirma su label "Retoma de Medidas", color azul (mismo tono que Propuesta: actividad de campo del comercial) y transiciones bidireccionales con `en_contrato` y hacia `pre_produccion`/Archivo.

**Transiciones (fuente: `parametros.transiciones_proyecto`) — v2 (POC-01):**

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| `activa` | Botón "→ Propuesta" / "→ Perdida" / "→ Cancelada" | `enviada`, `perdida`, `cancelada` | — | `transicionesValidas` + server PATCH |
| `enviada` | Botón "→ En Negociación" / "→ Perdida" | `negociacion`, `perdida` | — | `transicionesValidas` + server PATCH |
| `negociacion` | Botón "→ En Contrato" / "→ Propuesta" / "→ Perdida" | `en_contrato`, `enviada`, `perdida` | — | `transicionesValidas` + server PATCH |
| `en_contrato` | Botón "→ Pre-Producción" / "→ Retoma de Medidas" / "→ Perdida" / "→ Cancelada" | `pre_produccion`, `retoma`, `perdida`, `cancelada` | — | `transicionesValidas` + server PATCH |
| `retoma` | Botón "→ En Contrato" / "→ Pre-Producción" / "→ Perdida" / "→ Cancelada" | `en_contrato`, `pre_produccion`, `perdida`, `cancelada` | — | `transicionesValidas` + server PATCH |
| `pre_produccion` | Botón "→ Producción" / "→ Retoma de Medidas" / "→ Cancelada" | `produccion`, `retoma`, `cancelada` | — | `transicionesValidas` + server PATCH |
| `produccion` | — (columna solo lectura) | — | — | Transición por API, no desde kanban comercial |
| `perdida` + `cancelada` (Archivo) | — (columna solo lectura) | — | — | `perdida → activa` existe en matriz pero no se muestra en el bucket Archivo |

> **Nota POC-01:** las columnas solo-lectura (Producción, Archivo) no muestran botones de transición. Las transiciones `produccion → entregado/cancelada` y `perdida → activa` permanecen en la matriz del parametro pero no son accionables desde este kanban. El estado `entregado` ya no se renderiza como columna.

---

## 3. Vocabulario H07 (labels visibles)

*Cita del `glosario_h07.md`. Todo label de UI sale de aquí.*

### Estados de columna kanban — v2 (POC-01)

| Label natural | Código interno | Entidad.campo |
|---|---|---|
| "Lead" | `activa` | `proyectos.estado` |
| "Propuesta" | `enviada` | `proyectos.estado` |
| "En Negociación" | `negociacion` | `proyectos.estado` — POC-01 |
| "En contrato" | `en_contrato` | `proyectos.estado` |
| "Retoma de Medidas" | `retoma` | `proyectos.estado` — POC-13 |
| "Pre-producción" | `pre_produccion` | `proyectos.estado` |
| "Producción" | `produccion` | `proyectos.estado` |
| "Archivo" | `perdida` + `cancelada` (agregado UI) | `proyectos.estado` — POC-01 |

### Términos de negocio en UI

| Label natural | Código interno | Entidad.campo |
|---|---|---|
| "Embudo Comercial" | — | Título de página (no persiste en schema) |
| "Lead" | — | `leads` (entidad) |
| "Cliente" | — | `clientes` (entidad) |
| "Proyecto" | — | `proyectos` (entidad) |
| "Espacios" | — | `espacio_variantes` (entidad, plural UI) |
| "Items" | — | `items_variante` (entidad, plural UI) |
| "Variantes activas" | — | `espacio_variantes.activa` |
| "Creado" | `created_at` | `proyectos.created_at` |
| "Actualizado" | `updated_at` | `proyectos.updated_at` |
| "Días en estado" | — | Derivado: `now − proyectos.updated_at` |
| "Solo mis leads" | — | Filtro: `comercial_id = currentUser.id` |

### Acciones (verbos)

| Label natural | Verbo canónico H07 §C | Ubicación |
|---|---|---|
| "Nuevo +" | — (crea proyecto) | Header botón |
| "Abrir en Cotizador" | — | Menú ⋮ tarjeta |
| "Duplicar" | — | Menú ⋮ tarjeta |
| "Cambiar estado →" | — | Submenú ⋮ tarjeta |
| "Ver historial" | — | Menú ⋮ tarjeta |
| "Eliminar" | — | Menú ⋮ tarjeta |
| "Crear y abrir" | — | NuevoProyectoModal botón submit |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Transición de estado debe ser válida según `parametros.transiciones_proyecto` | Client (drag-drop/menú) + Server (guard en PATCH `/api/erp/proyectos/:id`) | Test: PATCH `activa→produccion` sin transición en matriz → 422 "Transición no permitida: activa → produccion" |
| R2 | Solo roles `admin`/`comercial` acceden al Kanban | Server (middleware/guard) | Test: GET `/erp/comercial` con rol `taller` → 403 |
| R3 | Comercial ve solo sus leads cuando filtro "Solo mis leads" activo | Client (filtro `comercial_id = currentUser.id`) + Server opcional (RLS) | Test: activar checkbox "Solo mis leads" → tarjetas filtradas a `comercial_id = currentUser.id` |
| R4 | Nombre de proyecto requerido al crear | Client (modal) + Server (POST `/api/erp/proyectos`) | Test: POST sin `nombre_proyecto` → 422 "Nombre requerido" |
| R5 | Cliente requerido al crear | Client (modal) + Server (POST `/api/erp/proyectos`) | Test: POST sin `cliente_id` → 422 "Seleccione cliente" |

---

## 5. Componentes UI

### 5.1 Estructura de página

**Estructura de página:** `/app/erp/comercial/page.tsx` (Server Component → props a Client Component `KanbanClient`)

**Layout:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER (sticky)                                                         │
│ [Logo]  Embudo Comercial  |  SmartSearch(proyectos/clientes)  [Nuevo +]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────┐ │
│  │  ACTIVA   │ │  ENVIADA  │ │EN_CONTRATO│ │PRE_PRODUCC│ │   ...    │ │
│  │  (Lead)   │ │(Propuesta)│ │(Negociación)│ │(Pre-prod) │ │          │ │
│  │  🟡       │ │  🔵       │ │  🟣       │ │  🟠       │ │          │ │
│  ├───────────┤ ├───────────┤ ├───────────┤ ├───────────┤ ├──────────┤ │
│  │███████████│ │███████████│ │███████████│ │███████████│ │          │ │
│  │Proyecto A │ │Proyecto B │ │Proyecto C │ │Proyecto D │ │          │ │
│  │Cliente X  │ │Cliente Y  │ │Cliente Z  │ │Cliente W  │ │          │ │
│  │$45M · 3d  │ │$120M · 12d│ │$80M · 5d  │ │$200M · 1d │ │          │ │
│  │[Abrir]    │ │[Abrir]    │ │[Abrir]    │ │[Abrir]    │ │          │ │
│  ├───────────┤ ├───────────┤ ├───────────┤ ├───────────┤ ├──────────┤ │
│  │Proyecto E │ │           │ │Proyecto F │ │           │ │          │ │
│  │...        │ │ [+ Lead]  │ │...        │ │ [+ Lead]  │ │          │ │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └──────────┘ │
│                                                                         │
│  [Footer: Filtros: Comercial | Tipo | Fecha | Solo mis leads]          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Diagrama de card — revisión v3 (2026-08-15, t-136):**

```
┌────────────────────────────────────────────────────────┐
│ ● Lead                     [→] [←]             [⋮]      │
│ María Fernanda López                                   │
│ Closet principal · A medida                            │
│ Cra 12 #34-56, Bogotá                                  │
│ ────────────────────────────────────────────────────── │
│ 3 espacios · Items: 12 · Variantes 2/3 · 5d en estado  │
└────────────────────────────────────────────────────────┘
```

- **Título:** `clientes.nombre` (María Fernanda López) + `clientes.telefono` secundario.
- **Subtítulo:** `proyectos.nombre_proyecto` · `proyectos.tipo_proyecto` (Closet principal · A medida).
- **Detalle:** `proyectos.direccion_obra` (Cra 12 #34-56, Bogotá).
- **Meta compacta:** COUNT `espacio_variantes` activas · COUNT `items_variante` · derivado `now − proyectos.updated_at`.
- **Badge (v3.2):** punto pulsante con irradiación blur + label mini Light, sin borde.
- **Controles (v3.3):** [→] Avanzar / [←] Retornar, solo si el destino está en la matriz — junto al menú ⋮.
- **Sin precio:** `total_estimado` ya no se renderiza en la card v3.

### 5.2 Tabla de componentes

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `KanbanClient` | Client (`"use client"`) | `proyectos: ProyectoKanban[], clientes: Cliente[], transiciones: TransicionesProyecto, currentUser: CurrentUser` | `proyectos`, `clientes`, `parametros` | — |
| `HeaderKanban` | Client | `searchQuery, onSearch, onNewProyecto, filtros, onFilterChange` | — | `Fraunces` (título), `Button variant=primary` (Nuevo +) |
| `SmartSearch` | Client (M-06 L1) | `items, contexto="comercial-kanban"` | `proyectos.nombre_proyecto`, `clientes.nombre` | `--focus-ring`, `role="combobox"` |
| `KanbanColumn` | Client | `estado, label, color, proyectos: ProyectoKanban[], transicionesValidas: string[], esSoloLectura: boolean, onMove(proyectoId, nuevoEstado)` | `proyectos` | Badge color según estado (§2), `role="list"`, `aria-label="Columna {label}"`, `--radius-md` |
| `ComercialCard` | Client | `proyecto: ProyectoKanban, transicionesValidas, onOpen, onDuplicate, onDelete` | `proyectos`, `clientes`, `espacio_variantes`, `items_variante` | Card primitiva, Badge estado, `--color-primary`, `role="listitem"`, `aria-roledescription="movible"`, `aria-grabbed` |
| `NuevoProyectoModal` | Client (P-02 preview) | `isOpen, onClose, estadoInicial?, onCreated(proyectoId)` | `proyectos`, `clientes` | Select, Button, `--focus-ring` |
| `HybridClientSelector` | Client | `onSelect(cliente), onCreate(nuevoCliente)` | `clientes` | Combobox + crear on-the-fly, `useSmartSearch` contexto "clientes" |
| `FiltrosPopover` | Client | `filtros, onFilterChange, currentUser` | `proyectos` | `Popover`, `Select` múltiple, `DateRangePicker`, Checkbox "Solo mis leads", `useDebounce` 300ms |
| `MenuAcciones` | Client | `proyecto, transicionesValidas, onOpen, onDuplicate, onChangeEstado, onVerHistorial, onDelete` | `proyectos` | `Popover` menú ⋮, `Button` |

### 5.3 Detalle de ComercialCard

**Campos renderizados:**

| Campo | Fuente | Formato |
|---|---|---|
| Nombre proyecto | `proyectos.nombre_proyecto` | Texto |
| Estado badge | `proyectos.estado` | Badge color según tabla §2 |
| Cliente | `clientes.nombre` + `clientes.telefono` | "Nombre (tel)" |
| Espacios | COUNT `espacio_variantes` WHERE `proyecto_id` + `activa=true` | "X espacios: Nombres (N)" |
| Items totales | COUNT `items_variante` via espacios activos | Número |
| Variantes activas | "Activas / Total espacios" | "3/3" |
| Total estimado | Calculado server-side (materiales + MO + costos − desc + ajuste) | COP formateado |
| Desglose rápido | Materiales / MO / Costos netos | Tooltip o línea secundaria |
| Fechas | `created_at`, `updated_at` | Relative time + absoluta |
| Días en estado | `now − updated_at` | Número |

**Menú ⋮ acciones:**

| Acción | Qué hace | Validación |
|---|---|---|
| Abrir en Cotizador | Navega a `/erp/cotizador/[proyectoId]` | — |
| Duplicar | `POST /api/erp/proyectos` copia header + espacios + items, estado=`activa` | — |
| Cambiar estado → | Submenú con `transicionesValidas` desde `parametros` | Solo destinos válidos |
| Ver historial | Abre modal `EventosModal` (fase posterior) | — |
| Eliminar | Soft delete (`estado=cancelada` o `deleted_at`) | Confirm modal |

> **Principio POC-01 (no mostrar IDs):** los IDs internos de base de datos no aparecen en ninguna UI visible al humano. El panel expandido de la card NO muestra `proyecto.id`. Esta regla aplica a todas las pantallas del ERP.

> **Principio POC-12 (el comercial no crea catálogo):** el kanban comercial consume el catálogo existente (`productos_catalogo`), nunca lo crea. Los proyectos con `tipo_proyecto = 'producto_fijo'` provienen de la pantalla **P-27 Catálogo (D-Desarrollo)** (`disenio_p27_catalogo_diseno_desarrollo.md`). Si se muestra "Producto fijo" como badge, es solo lectura del tipo heredado — el comercial no lo ofrece como opción de creación.

> **Revisión v3 (2026-08-15, t-136):** la jerarquía de campos, el badge y los controles de estado de esta sección se rediseñan en la sección «Revisión v3» inmediatamente abajo. La jerarquía v3 manda sobre la tabla de §5.3 una vez aprobada por el Supervisor; el historial POC-01/POC-13 no se elimina.

## Revisión v3 (2026-08-15, input directo de Javier) — Jerarquía de card + badges minimalistas + controles in-card

**Origen:** `input_diseno_javier_20260815.md` §1 (tarea t-136). **Estado:** **v3 propuesta — pendiente checkpoint Supervisor**. Donde esta revisión contradice una especificación previa, la v3 manda una vez que Javier la confirme. Nada se inventa: columnas citadas de `REGISTRO_DE_ENTIDADES.md` §3, labels citados de `glosario_h07.md` (o declarados como propuestos) y transiciones citadas de `parametros.transiciones_proyecto`.

### v3.1 Nueva jerarquía de contenido de ComercialCard

| Orden | Elemento | Columna real (REGISTRO_DE_ENTIDADES.md §3) | Formato |
|---|---|---|---|
| 1 — Título | Nombre del cliente | `clientes.nombre` (+ `clientes.telefono` secundario opcional) | Texto, mayor peso/tamaño de la card |
| 2 — Subtítulo | Nombre del proyecto + tipo | `proyectos.nombre_proyecto` + `proyectos.tipo_proyecto` | "Nombre proyecto · Tipo" |
| 3 — Detalle | Dirección de obra | `proyectos.direccion_obra` | Texto |
| Meta compacta (al pie) | Espacios · Items · Variantes · Días en estado | COUNT `espacio_variantes` (activa=true) · COUNT `items_variante` · derivado `now − proyectos.updated_at` | "3 espacios · Items: 12 · Variantes 2/3 · 5 días en estado" |

**Ajuste de precio:** la card v3 **no renderiza precio**. Se eliminan de ComercialCard el "Total estimado" y el "Desglose rápido" (materiales/MO/costos) de la tabla de §5.3. El cálculo `total_estimado` sigue viviendo server-side en `GET /api/erp/proyectos` (otras pantallas/exports lo consumen), pero la card no lo muestra.

> **Traza — "tipo de espacio":** Javier pide "nombre del proyecto / tipo de espacio". La columna del nombre/tipo de espacio de `espacio_variantes` **no está listada en REGISTRO_DE_ENTIDADES.md §3** (solo `id, proyecto_id, activa`). Por tanto el tag del subtítulo usa `proyectos.tipo_proyecto` (columna real). El nombre del espacio activo (ej. "Cocina") queda como **dependencia declarada**: se agrega cuando se confirme la columna en el REGISTRO. Labels de `tipo_proyecto`: "Producto fijo" ya citado (POC-12); **"Proyecto a medida" y "Servicio técnico" son labels nuevos propuestos, pendientes de agregar a `glosario_h07.md`** (nota: `REGISTRO_DE_ENTIDADES.md` §2 ya registra la divergencia `personalizado` vs `proyecto_a_medida` a alinear en F10-E).

### v3.2 Badge de estado minimalista (estilo + tokens D4 propuestos)

| Aspecto | Especificación |
|---|---|
| Tamaño | Super diminuto (mini, ≈ 11px de label) |
| Tipografía | Fuente Light (peso 300) |
| Borde | **Ninguno** — se elimina la caja/relleno del badge actual (§5.3) |
| Marca visual | Solo un **punto** sólido del color del estado + label mini a su lado |
| Punto | **Pulsante con irradiación blur** (halo difuminado que se expande y desvanece en fase con el pulso) |

**Tokens D4 propuestos** (no existen en `app/globals.css` hoy — se declaran aquí para incorporarlos al arnés de estilos cuando el Supervisor los apruebe):

| Token propuesto | Valor propuesto | Comportamiento (en palabras, no código) |
|---|---|---|
| `--badge-dot-size` | ≈ 6px | Diámetro del punto; círculo sólido del color del estado (§2: amber/blue/orange/violet/green/muted). Sin borde ni fondo de caja. |
| `--badge-dot-pulse-duration` | ≈ 2s | Ciclo del pulso: escala y opacidad del punto oscilan en bucle (latido suave, no parpadeo). |
| `--badge-dot-glow` | ≈ 8–12px | Radio de irradiación: halo desenfocado (blur) del color del estado que se expande y se desvanece siguiendo el pulso (eco/radar). |
| `--badge-label-size` | ≈ 11px | Tamaño del label; muy reducido frente al cuerpo de la card. |
| `--badge-label-weight` | 300 (Light) | Peso tipográfico del label. |

Reglas:
- El pulso y la irradiación **se desactivan con `prefers-reduced-motion: reduce`** (punto estático, solo label) — extiende la regla a11y de §5.6.
- En columnas solo-lectura (Producción, Archivo) el punto se renderiza **sin animación** (sin pulso), señalando que no hay acción disponible.

### v3.3 Controles de cambio de estado rápidos in-card (avanzar / retornar)

**No se inventa ninguna máquina de estados.** La fuente única de transiciones sigue siendo `parametros.transiciones_proyecto` (la misma que ya validan drag-drop, menú ⋮ y el guard del server en `PATCH /api/erp/proyectos/:id` — regla R1). Los controles rápidos son dos accesos directos a destinos **canónicos** por estado:

| Estado actual | "Avanzar →" (destino canónico) | "Retornar ←" (destino canónico) | ¿Ambos en `parametros.transiciones_proyecto`? |
|---|---|---|---|
| `activa` | `enviada` | — (sin reversa; botón oculto) | `activa→enviada` ✓ |
| `enviada` | `negociacion` | — (`enviada→activa` NO está en matriz; botón oculto) | `enviada→negociacion` ✓ |
| `negociacion` | `en_contrato` | `enviada` | ✓ `negociacion→en_contrato`, `negociacion→enviada` |
| `en_contrato` | `retoma` | — (sin reversa directa en matriz; botón oculto) | `en_contrato→retoma` ✓ |
| `retoma` | `pre_produccion` | `en_contrato` | ✓ `retoma→pre_produccion`, `retoma→en_contrato` |
| `pre_produccion` | `produccion` | `retoma` | ✓ `pre_produccion→produccion`, `pre_produccion→retoma` |
| `produccion` | — | — | Columna solo lectura: sin controles (§2) |
| `perdida`/`cancelada` (Archivo) | — | — | Columna solo lectura: sin controles (§2) |

**Convivencia con el menú ⋮ y el drag-drop:**
- Los controles rápidos **no reemplazan** el menú ⋮ ni el drag-drop. Los tres caminos ejecutan la misma acción `moveProyecto(proyectoId, nuevoEstado)` → `PATCH /api/erp/proyectos/:id {estado}` con el mismo optimistic UI + revert de §6.2.
- El menú ⋮ → "Cambiar estado →" sigue listando **todos** los destinos válidos de la matriz para el estado actual (no solo el canónico): es la alternativa completa; el control rápido es el atajo del flujo natural.
- Cada botón (→ / ←) se renderiza **solo si su destino existe en `transicionesValidas`** derivada de la matriz; si no, se **oculta**.
- Columnas solo-lectura: sin controles rápidos, sin drag handle, sin `[+ Añadir]` (consistente con CA-10).
- **a11y:** botones con `aria-label` "Avanzar a {label destino}" / "Retornar a {label destino}"; operables por teclado (Tab + Enter/Space).

**Criterios de aceptación de esta revisión:** §7 CA-19..CA-29.

### 5.4 Detalle de NuevoProyectoModal (P-02 preview)

```
┌──────────────────────────────────────────┐
│  Nueva Cotización / Proyecto        [×]  │
├──────────────────────────────────────────┤
│  Nombre proyecto *    [_______________]  │
│  Cliente *            [HybridClientSelector]│
│  Tipo proyecto *      [▼ proyecto_a_medida]│
│  Estado inicial       [▼ activa] (fijo si │
│                        viene de columna)  │
│  Dirección obra       [_______________]  │
│  ──────────────────────────────────────  │
│  [Cancelar]          [Crear y abrir]     │
└──────────────────────────────────────────┘
```

- `HybridClientSelector`: Combobox + crear on-the-fly (`useSmartSearch` contexto "clientes", `POST /api/erp/clientes`).
- **Crear y abrir:** `POST /api/erp/proyectos` → redirige a `/erp/cotizador/[newId]`.

### 5.5 Filtros

| Filtro | Tipo | Comportamiento |
|---|---|---|
| Comercial | Multi-select (usuarios rol `comercial`) | Filtra `proyectos.comercial_id` |
| Tipo proyecto | Multi-select (`tipoProyecto` enum: `producto_fijo`, `proyecto_a_medida`, `servicio_tecnico`) | Filtra `proyectos.tipo_proyecto`. Filtro de LECTURA sobre proyectos existentes — no es creación (POC-12: `producto_fijo` se crea en P-27) |
| Fecha rango | DateRangePicker | `created_at` entre fechas |
| Solo mis leads | Checkbox | Filtra `comercial_id = currentUser.id` |
| Texto libre | SmartSearch (ya en header) | Fuzzy sobre nombre proyecto + cliente |

**Persistencia:** Filtros en `localStorage` clave `comercial-kanban-filters`.

### 5.6 Accesibilidad (a11y)

- **Drag-drop:** `aria-roledescription="movible"`, `aria-grabbed`, `aria-dropeffect`. Alternativa teclado: menú "Cambiar estado →" (Enter/Space).
- **Columnas:** `role="list"`, `aria-label="Columna Lead"`, tarjetas `role="listitem"`.
- **SmartSearch:** `role="combobox"`, `aria-autocomplete="list"`, `aria-controls`.
- **Badges estado:** `aria-label="Estado: Lead"`.
- **Focus visible:** tokens `--focus-ring` en todos los interactivos.
- **Reduced-motion:** desactiva animaciones drag/drop, transiciones columnas.

### 5.7 Patrones M-06 L1 usados

- `useSmartSearch` (fuzzy + historial localStorage, contexto "comercial-kanban")
- `useDebounce` (filtros, 300ms)
- `Promise.all` carga paralela (proyectos + clientes + parametros transiciones)
- `Suspense` + loading states
- Design tokens + primitivas `components/veta/` (Card, Badge, Button, Popover, Select)

---

## 6. Comportamiento

### 6.1 Flujo de datos

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

### 6.2 Tabla de eventos y comportamientos

| # | Evento | Gatillo | Acción | Side effect | Trace E-XX |
|---|---|---|---|---|---|
| 1 | Cargar pantalla | `page.tsx` mount | `Promise.all([getProyectos, getClientes, getParametrosTransiciones, getCurrentUser])` | — | — |
| 2 | Buscar proyecto/cliente | `SmartSearch` input | `useSmartSearch` fuzzy match sobre `proyectos.nombre_proyecto` + `clientes.nombre` + historial localStorage (20 items) + uso frecuente (50 items LRU). Filtra tarjetas en tiempo real en todas las columnas. | — | — |
| 3 | Cambiar estado (drag-drop) | `onDragEnd` en columna destino (solo columnas no solo-lectura) | Chequea `transicionesValidas.includes(nuevoEstado)`. Si inválida → toast error + revert animado. Si válida → optimistic UI: mueve tarjeta → `PATCH /api/erp/proyectos/:id {estado}` → success: confirm / error: revert + toast. | `eventos` registra mutación (append-only) | — Pendiente de definir en iteración de diseño |
| 4 | Cambiar estado (menú) | Click en "Cambiar estado →" submenú | `PATCH /api/erp/proyectos/:id {estado}` | `eventos` registra mutación | — Pendiente de definir en iteración de diseño |
| 5 | Abrir proyecto | Click "Abrir en Cotizador" | Navegación a `/erp/cotizador/[proyectoId]` | — | — |
| 6 | Duplicar proyecto | Click "Duplicar" en menú ⋮ | `POST /api/erp/proyectos` copia header + espacios + items, estado=`activa` → redirect | — | — |
| 7 | Crear proyecto | Click [Nuevo +] en header o [+ Añadir Lead] en columna `activa` | Abre `NuevoProyectoModal`. `POST /api/erp/proyectos` → redirect `/erp/cotizador/[newId]` | — | — |
| 8 | Filtrar | Cambio en filtros (Comercial, Tipo, Fecha, Solo mis leads) | `useDebounce` 300ms → re-filtra `proyectosFiltrados` | Filtros persistidos en `localStorage` clave `comercial-kanban-filters` | — |
| 9 | Eliminar proyecto | Click "Eliminar" en menú ⋮ → confirm modal | Soft delete: `estado=cancelada` o `deleted_at` | — | — |

### 6.3 Estados de pantalla (UI states)

| Estado | Qué muestra |
|---|---|
| **Cargando** | Skeleton columns (3-4 tarjetas placeholder por columna) |
| **Error carga** | Alert + "Reintentar" |
| **Sin resultados (filtro)** | "No hay proyectos con estos filtros" + botón "Limpiar filtros" |
| **Vacío total** | Columnas vacías + `[+ Añadir Lead]` en `activa` |
| **Drag activo** | Tarjeta con sombra elevada, columna drop target resaltada |
| **Transición inválida** | Toast error + tarjeta regresa animada (spring) |

### 6.4 API endpoints

**`GET /api/erp/proyectos`** (con query params filtros):
- `select` optimizado: solo campos necesarios para tarjeta (no carga espacios/items completos)
- `total_estimado` calculado en server (SQL aggregate: materiales + MO + costos − desc + ajuste)
- `espacios_count`, `items_count` como subqueries `COUNT(*)`

**`PATCH /api/erp/proyectos/:id`**: Cambio de estado con validación contra `parametros.transiciones_proyecto`.

**`POST /api/erp/proyectos`**: Crear proyecto (desde modal).

**`POST /api/erp/clientes`**: Crear cliente on-the-fly (HybridClientSelector).

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Comando / verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 errores | `tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores en archivos de esta pantalla | `eslint app/erp/comercial/` |
| CA-3 | 8 columnas renderizadas con estados legacy + colores + contadores | Inspección visual + test: `document.querySelectorAll('[role="list"]').length === 8` |
| CA-4 | Transiciones desde `parametros.transiciones_proyecto` (drag-drop + menú) | Test: drag `activa→enviada` (válida) → PATCH 200. Test: drag `activa→produccion` (inválida) → toast error + revert. |
| CA-5 | Todos los labels de estado usan H07 B.0 (no hay strings sueltos inventados) | `grep -r "'Lead\|'Propuesta\|'En contrato\|'Pre-producción\|'Producción\|'Entregado\|'Perdida\|'Cancelada" app/erp/comercial/` — deben provenir de glosario, no hardcoded |
| CA-6 | ComercialCard renderiza todos los campos: nombre_proyecto, cliente(nombre+tel), espacios_count, items_count, total_estimado, created_at, updated_at, días_en_estado | Test: `document.querySelector('.tarjeta-proyecto').textContent` contiene valores esperados |
| CA-7 | SmartSearch (fuzzy + historial localStorage + uso frecuente) filtra en vivo | Test: escribir "cocina" → tarjetas filtradas a las que contengan "cocina" en nombre_proyecto o cliente. `localStorage` contiene clave "comercial-kanban-search". |
| CA-8 | Filtros (Comercial, Tipo, Fecha, Solo mis leads) persistidos en localStorage y restaurados al recargar | Test: aplicar filtros → recargar → filtros restaurados. `localStorage["comercial-kanban-filters"]` existe. |
| CA-9 | Drag-drop con validación transición + optimistic UI + revert on error | Test: `PATCH` falla con 500 → tarjeta regresa a columna origen animada + toast error. |
| CA-10 | Columnas solo-lectura (`produccion`, `entregado`, `perdida`, `cancelada`): sin drag handle, sin `[+ Añadir]`, sin drop target | Test: `document.querySelector('[aria-label="Columna Producción"] [aria-roledescription="movible"]')` = null. |
| CA-11 | Botón [Nuevo +] en header y [+ Añadir Lead] en columna `activa` abren NuevoProyectoModal | Test: click en ambos → modal visible con campos: nombre_proyecto, cliente, tipo_proyecto, estado, direccion_obra. |
| CA-12 | Tarjeta menú ⋮: Abrir, Duplicar, Cambiar estado, Historial, Eliminar | Test: click menú → 5 opciones renderizadas. "Cambiar estado →" muestra solo destinos válidos según transiciones. |
| CA-13 | Accesibilidad: drag-drop teclado (Enter/Space en menú), focus visible, reduced-motion, ARIA | Test: `document.querySelector('[role="combobox"]')` existe. `document.querySelector('[aria-roledescription="movible"]')` existe en columnas no solo-lectura. |
| CA-14 | `next build` compila sin errores de conexión de esta pantalla | `npx next build` (errores de `ECONNREFUSED` esperados por falta de DB local; cualquier otro error es bug real) |
| CA-15 | Regla R1: transición inválida rechazada en server | Test: `PATCH /api/erp/proyectos/:id {estado: "produccion"}` desde estado `activa` → 422 "Transición no permitida: activa → produccion" |
| CA-16 | Regla R2: rol no autorizado recibe 403 | Test: `GET /erp/comercial` con rol `taller` → 403 |
| CA-17 | Regla R4: nombre proyecto requerido | POST sin `nombre_proyecto` → 422 |
| CA-18 | Regla R5: cliente requerido | POST sin `cliente_id` → 422 |
| CA-19 | Jerarquía v3 de ComercialCard: primer elemento = `clientes.nombre`, segundo = `proyectos.nombre_proyecto` + tag `tipo_proyecto`, tercero = `proyectos.direccion_obra` | Test: `document.querySelector('.tarjeta-proyecto').children[0].textContent` contiene el nombre del cliente; `children[1]` el nombre del proyecto; `children[2]` la dirección de obra |
| CA-20 | La card v3 no renderiza precio | Test: `document.querySelector('.tarjeta-proyecto').textContent` NO matchea `/^\$\s?[0-9]/` (COP formateado); `rg -c "total_estimado" app/erp/comercial/components/ComercialCard.tsx` = 0 |
| CA-21 | Badge mini sin borde, sin caja, fuente Light | Test: `getComputedStyle(badge).borderWidth === '0px'` y `getComputedStyle(badge).fontWeight === '300'` (o el valor de `--badge-label-weight`) |
| CA-22 | Dot pulsante con irradiación blur + tokens propuestos declarados | Test: `document.querySelector('[data-testid="badge-dot"]')` existe; `rg "badge-dot-size\|badge-dot-pulse-duration\|badge-dot-glow\|badge-label-size\|badge-label-weight" app/globals.css` ≥ 5 ocurrencias |
| CA-23 | `prefers-reduced-motion: reduce` desactiva pulso/irradiación | Test: emular media query reduce → `getComputedStyle('[data-testid="badge-dot"]').animationName === 'none'` (o clase equivalente) |
| CA-24 | Control "Avanzar" presente solo si su destino canónico está en la matriz | Test: card en `activa` → existe `[aria-label="Avanzar a Propuesta"]`; card en `produccion` → `document.querySelector('[aria-label^="Avanzar"]')` = null |
| CA-25 | Control "Retornar" presente solo si la reversa está en la matriz | Test: card en `negociacion` → existe `[aria-label="Retornar a Propuesta"]`; card en `activa` → `document.querySelector('[aria-label^="Retornar"]')` = null |
| CA-26 | Controles rápidos usan `PATCH /api/erp/proyectos/:id` y el server valida contra la matriz (R1) | Test: click [→] en `activa` → PATCH `{estado:"enviada"}` → 200; forzar `activa→produccion` → 422 "Transición no permitida: activa → produccion" |
| CA-27 | Menú ⋮ "Cambiar estado →" sigue listando TODOS los destinos de la matriz (no solo el canónico) | Test: card en `negociacion` → menú muestra 3 destinos (`en_contrato, enviada, perdida`) y controles rápidos solo 2 botones |
| CA-28 | Labels de estado y controles provienen de H07/§3; los labels nuevos propuestos NO entran a código hasta agregarse al glosario | Test: `rg -l "Proyecto a medida\|Servicio técnico" app/erp/comercial/` = 0; labels de estado → `rg -r "'Lead\|'Propuesta\|'En Negociación\|'En contrato\|'Retoma de Medidas\|'Pre-producción\|'Producción\|'Archivo" app/erp/comercial/` provienen de §3 |
| CA-29 | Controles rápidos accesibles por teclado con `aria-label` de destino | Test: `document.querySelector('[aria-label^="Avanzar a"]')` y `document.querySelector('[aria-label^="Retornar a"]')` existen en columnas no solo-lectura; activables con Enter/Space |

---

## 8. Verificación de integridad (pre-entrega)

> **Nota POC-01 (2026-08-08):** este diseño fue validado contra el prototipo funcional en revisión live del Supervisor. La banda F0–F9 está cerrada; la validación de prototipo es el nuevo mecanismo de aprobación (plan_f10_migracion.md §4). Los criterios de aceptación en §7 se verificaron mecánicamente (tsc=0, eslint=0, build=11 rutas).

Antes de congelar el bloque B1, el Orquestador verifica:

- [ ] Toda entidad en §1 existe en el `REGISTRO_DE_ENTIDADES.md`
- [ ] Todo estado en §2 existe en el `REGISTRO_DE_ENTIDADES.md` y en `glosario_h07.md`
- [ ] Todo label en §3 existe en `glosario_h07.md`
- [ ] Toda regla en §4 tiene verificación mecánica (no "se ve bien")
- [ ] Todo componente en §5 usa tokens D4 y patrones M-06 L1
- [ ] Todo comportamiento en §6 traza a un evento E-XX del `diamante2_define_eventos.md`
- [ ] Los criterios de aceptación en §7 son ejecutables (no opinables)

---

## Notas complementarias (no canónicas)

### Próximos Pasos (tras aprobación)

1. **Iniciador** escribe `plan_t-079.md` (detalle implementación P-01)
2. **Agente Código** implementa:
   - API `GET /api/erp/proyectos` (optimizada para kanban)
   - API `PATCH /api/erp/proyectos/:id` (transición estado + validación)
   - Client `KanbanClient` + `KanbanColumn` + `ComercialCard`
   - `useSmartSearch` integración (M-06 L1)
   - Tests: transiciones, filtros, search, drag-drop
3. **QA** verifica: `tsc`, `eslint`, `next build`, tests, E2E contra `dev-local`

### Relación con P-02/P-03

| Pantalla | Relación |
|---|---|
| **P-02 Nueva Cotización** | Modal que se abre desde `[Nuevo +]` o `[+ Añadir Lead]`. Crea proyecto → redirect a P-04. |
| **P-03 Detalle Solo Lectura** | Click "Abrir" en tarjeta con rol `taller`/`finanzas` → `/erp/cotizador/[id]?readonly=true` (subconjunto P-04). |
