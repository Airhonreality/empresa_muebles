# P-28 — Tablero de Clientes (CRM)

**Fecha:** 2026-08-15 · **Estado:** propuesta — pendiente checkpoint Supervisor · **Fase:** F2 · **Ruta:** `/erp/clientes` (tablero) · `/erp/clientes/[clienteId]` (detalle) · **Roles:** admin, comercial (acceso completo)

**Fuente del pedido:** `arnes/lineas/ola7/tecnico/input_diseno_javier_20260815.md` §4 — "Nuevo Acceso: Agregar al menú principal de navegación el acceso al Tablero / Base de Datos de Clientes" (t-138).

**Dependencias:** P-01 aprobado (patrones de tablero: SmartSearch, filtros, tokens D4, M-06 L1), `glosario_h07.md`, `REGISTRO_DE_ENTIDADES.md` §3/§9/§10, shell del ERP (`components/veta/erp-shell.tsx` → `components/veta/erp-sidebar.tsx`).
**Artefactos base:** `disenio_p01_kanban_comercial.md`, `PLANTILLA_PANTALLA.md`, `input_diseno_javier_20260815.md`.

> **Nota de numeración (ver H-CRM-1 en Notas):** el número P-28 se asigna de forma provisional porque P-27 está duplicado en el repo. Esta pantalla es nueva de punta a punta; no requiere cambio de schema (ver Notas §"Cambios de schema").

---

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`). No redefinas schemas aquí.*

| Entidad | § del REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| `clientes` | §3 Comercial | id, nombre, documento, telefono, email, domicilio, etapa_funnel, created_at, updated_at | **Tablero:** fila con nombre (título), teléfono, correo, documento, domicilio, badge de etapa (B.1), contadores derivados (proyectos / obligaciones / pedidos web). **Detalle:** header con los mismos campos. Búsqueda y filtros sobre estas columnas. |
| `proyectos` | §3 Comercial | id, nombre_proyecto, estado, tipo_proyecto, direccion_obra, comercial_id, verificador_id, created_at, updated_at | Detalle → pestaña "Proyectos": filas con nombre, estado (badge B.0), tipo, dirección; acción "Abrir en Cotizador" → `/erp/cotizador/[proyectoId]`. |
| `citas` | §3 Comercial | id, franja, tipo, estado | Detalle → pestaña "Visitas": agenda del cliente con estado de cita (B.2). |
| `visitas` | §3 Comercial | id, observaciones, medidas, fotos | Detalle → pestaña "Visitas": registro de la visita (observaciones, medidas, fotos), ligado a cita y proyecto. |
| `pedidos_web` | §10 Sitio público y tienda | id, total_pedido, estado, created_at, proyecto_id | Detalle → pestaña "Pedidos web": pedidos del cliente con total y estado. |
| `item_pedido` | §10 Sitio público y tienda | cantidad, precio_unitario | Detalle → pestaña "Pedidos web": desglose de ítems del pedido (cantidad × precio unitario, releído del servidor — nunca del cliente). |
| `obligaciones_pendientes` | §9 Finanzas | id, descripcion, origen, monto_total, monto_pagado, fecha_vencimiento, estado, proyecto_id, contrato_id | Detalle → pestaña "Obligaciones": cuentas por cobrar/pagar del cliente, "Total / Pagado" (D.4), estado (B.14), origen de la obligación (D.4). |
| `eventos` | §1 Cimientos F0 | — (append-only, solo lectura) | "Ver historial": modal con eventos `WHERE cliente_id` (trazabilidad E-51 y mutaciones). |

> **Nota §1 (H-CRM-3):** `citas`, `visitas` y `conversaciones` están declaradas en el REGISTRO §3 pero aún no materializadas en `schema.ts` (solo existe `citas_garantia`). La pestaña "Visitas" del detalle **depende** de esas tablas (ver Notas). El resto de secciones (Proyectos, Pedidos web, Obligaciones) solo usa tablas existentes.

---

## 2. Estados que transiciona

*Cita los estados del REGISTRO DE ENTIDADES y del glosario H07.*

**P-28 no transiciona estados de negocio.** `clientes` no tiene máquina de estado propia; `etapa_funnel` es un snapshot del embudo escrito en E-51 (P-01/P-02, conversión de lead a cliente) — esta pantalla lo lee en **solo lectura**. Cobros, citas y estados de proyecto se ejecutan en sus pantallas de origen; P-28 solo navega.

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| (ninguna) | P-28 no muta `clientes.etapa_funnel` | — | E-51 (escribe el snapshot en P-01/P-02, no acá) | Guard: no existe endpoint de mutación de etapa en P-28 |
| (navegación) | "Abrir en Cotizador" en pestaña Proyectos | — | — | P-04 asume la máquina de estados del proyecto |
| (navegación) | "Cobrar" en pestaña Obligaciones | — | E-28 | Se ejecuta en P-21/P-22 (`/erp/finanzas/obligaciones`); P-28 solo navega |
| (navegación) | "Agendar visita" desde el detalle | — | E-06 | Se ejecuta en P-03; P-28 solo navega |

---

## 3. Vocabulario H07 (labels visibles)

*Cita del `glosario_h07.md`. Todo label de UI sale de aquí.*

### 3.1 Estados de etapa del embudo (`clientes.etapa_funnel` — snapshot B.1)

| Label natural | Código interno | Entidad.campo |
|---|---|---|
| "Nuevo" | `nuevo` | `clientes.etapa_funnel` |
| "En contacto" | `en_contacto` | `clientes.etapa_funnel` |
| "Calificado" | `calificado` | `clientes.etapa_funnel` |
| "Descartado" | `descartado` | `clientes.etapa_funnel` |
| "Redirigido" | `redirigido` | `clientes.etapa_funnel` |
| "No viable" | `no_viable` | `clientes.etapa_funnel` |
| "Cliente" | `cliente` | `clientes.etapa_funnel` |

### 3.2 Estados de proyecto (badges pestaña "Proyectos" — B.0)

| Label natural | Código interno | Entidad.campo |
|---|---|---|
| "Lead" / "Propuesta" / "En Negociación" / "En contrato" / "Retoma de Medidas" / "Pre-producción" / "Producción" / "Entregado" / "Perdido" / "Cancelado" | `activa` / `enviada` / `negociacion` / `en_contrato` / `retoma` / `pre_produccion` / `produccion` / `entregado` / `perdida` / `cancelada` | `proyectos.estado` |

### 3.3 Estados de cita y obligación

| Label natural | Código interno | Entidad.campo |
|---|---|---|
| "Agendada" / "Realizada" / "No asistida" / "Cancelada" | `agendada` / `realizada` / `no_show` / `cancelada` | `citas.estado` (B.2) |
| "Pendiente" / "Atrasada" / "Pagada" | `pendiente` / `atrasada` / `pagada` | `obligaciones_pendientes.estado` (B.14) |
| "Por cobrar" / "Por pagar" | — | tipo de obligación (B.14) |

### 3.4 Términos de negocio en UI

| Label natural | Código interno | Entidad.campo |
|---|---|---|
| "Cliente" | — | `clientes` (entidad) |
| "Proyecto" | — | `proyectos` (entidad) |
| "Visita" | — | `visitas` / `citas` (entidad) |
| "Pedido web" | — | `pedidos_web` (entidad) |
| "Obligación" | — | `obligaciones_pendientes` (entidad) |
| "Etapa en el embudo" | `etapa_funnel` | `clientes.etapa_funnel` (D.2) |
| "Total: $2M · Pagado: $600k" | `monto_total` / `monto_pagado` | `obligaciones_pendientes` (D.4) |
| "Origen de la obligación" | `origen` | `obligaciones_pendientes.origen` (D.4) |
| "Creado" | `created_at` | `clientes.created_at` / `pedidos_web.created_at` |
| "Actualizado" | `updated_at` | `clientes.updated_at` |

### 3.5 Acciones (verbos)

| Label natural | Verbo canónico H07 §C | Ubicación |
|---|---|---|
| "Abrir en Cotizador" | — | Pestaña Proyectos, fila de proyecto |
| "Cobrar" | Cobrar (E-28) | Pestaña Obligaciones → navega a P-21/P-22 |
| "Agendar visita" | Agendar (E-06) | Detalle → navega a P-03 |
| "Ver historial" | — | Menú ⋮ fila del tablero (patrón P-01) |

### 3.6 Labels nuevos propuestos (NO existen en `glosario_h07.md` — declarados para este diseño, pendientes de gobernanza del glosario)

| Label natural propuesto | Entidad.campo | Nota |
|---|---|---|
| "Clientes" | — | Título de página y entrada del nav del ERP |
| "Teléfono" | `clientes.telefono` | Campo de contacto |
| "Correo electrónico" | `clientes.email` | Campo de contacto |
| "Documento" | `clientes.documento` | Campo de identidad |
| "Domicilio" | `clientes.domicilio` | Campo de dirección |
| "Nuevo cliente" | — | Acción de creación manual (`origen='manual'`) |
| "Solo con obligaciones pendientes" | — | Filtro del tablero |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Solo roles `admin`/`comercial` acceden a `/erp/clientes` | Server (middleware/guard) | Test: GET `/erp/clientes` con rol `taller` → 403 |
| R2 | P-28 no muta `clientes.etapa_funnel` (snapshot E-51, solo lectura) | No existe endpoint de mutación de etapa; la fila de `clientes` solo se crea (manual) o se lee | Test: no hay ruta `PATCH /api/erp/clientes/:id` con `etapa_funnel` en el payload |
| R3 | Ningún ID interno se muestra en la UI (principio POC-01) | Guard de render | Test: `grep` de `clientes.id`/`proyecto.id` en componentes de UI → 0 resultados en markup visible |
| R4 | "Nuevo cliente" manual requiere `nombre`; `origen` se asienta como `manual` | Server (POST `/api/erp/clientes`) | Test: POST sin `nombre` → 422 "Nombre requerido" |
| R5 | Contadores del tablero (proyectos, obligaciones, pedidos web por cliente) se derivan server-side por FK, nunca en client | Server (SQL aggregate) | Test: GET `/api/erp/clientes` devuelve `proyectos_count`, `obligaciones_count`, `pedidos_count` correctos contra fixtures |
| R6 | Filtro de etapa valida contra valores B.1 (whitelist) | Client + Server (query param validado) | Test: GET con `etapa_funnel=no_existe` → 422 |
| R7 | El detalle solo muestra registros ligados por FK al cliente: `proyectos.cliente_id`, `obligaciones.cliente_id`, `pedidos_web.cliente_id`, visitas vía `citas.cliente_id` | Server (WHERE obligatorio) | Test: fixture con 2 clientes → el detalle de cliente A no lista filas de B |

---

## 5. Componentes UI

### 5.1 Estructura de página

**Tablero:** `/app/erp/clientes/page.tsx` (Server Component → props a Client Component `ClientesTablero`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER (sticky)                                                         │
│ [Volver]  Clientes  |  SmartSearch(clientes)  [Filtros]  [Nuevo cliente]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Nombre   │ Teléfono │ Correo    │ Documento │ Etapa        │ ⋮  │  │
│  ├───────────┼──────────┼───────────┼───────────┼──────────────┼────┤  │
│  │ Ana Pérez │ 300...   │ a@mail.co │ CC 1234   │ [Cliente]    │ ⋮  │  │
│  │   → 3 proyectos · 1 obligación pendiente · 0 pedidos web          │  │
│  ├───────────┼──────────┼───────────┼───────────┼──────────────┼────┤  │
│  │ Luis Gómez│ 311...   │ l@mail.co │ CC 5678   │ [Calificado] │ ⋮  │  │
│  │   → 1 proyecto · 0 obligaciones · 2 pedidos web                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [Footer: N clientes · Filtros: Etapa | Solo con obligaciones pend.]   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Detalle:** `/app/erp/clientes/[clienteId]/page.tsx` (Server Component → Client Component `ClienteDetalle`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER cliente                                                          │
│ [Ana Pérez] · badge [Cliente]  ·  Teléfono · Correo · Documento         │
│ Domicilio: {domicilio} · Creado: {created_at} · [Agendar visita]        │
├─────────────────────────────────────────────────────────────────────────┤
│ [Pestañas: Proyectos | Visitas | Pedidos web | Obligaciones]            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Pestaña activa renderiza la lista correspondiente del cliente     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Tabla de componentes

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `ClientesTablero` | Client (`"use client"`) | `clientes: ClienteCRM[], currentUser: CurrentUser` | `clientes`, `proyectos`, `obligaciones_pendientes`, `pedidos_web` (contadores) | — |
| `HeaderClientes` | Client | `searchQuery, onSearch, onNewCliente, filtros, onFilterChange` | — | `Fraunces` (título), `Button variant=primary` (Nuevo cliente) |
| `SmartSearch` | Client (M-06 L1) | `items, contexto="clientes"` | `clientes.nombre`, `clientes.telefono`, `clientes.email` | `--focus-ring`, `role="combobox"` (patrón P-01) |
| `FiltrosPopoverClientes` | Client | `filtros, onFilterChange` | `clientes.etapa_funnel` | `Popover`, `Select` múltiple, Checkbox, `useDebounce` 300ms (patrón P-01) |
| `ClienteRow` | Client | `cliente: ClienteCRM, onVerDetalle, onVerHistorial` | `clientes` + contadores | Card primitiva, Badge etapa, `role="row"`, `--radius-md` |
| `MenuAcciones` | Client | `cliente, onVerDetalle, onVerHistorial` | `clientes` | `Popover` menú ⋮, `Button` (patrón P-01) |
| `NuevoClienteModal` | Client | `isOpen, onClose, onCreated(clienteId)` | `clientes` | `Select`, `Button`, `--focus-ring` |
| `ClienteDetalle` | Client | `cliente: ClienteCRM, proyectos, visitas, pedidosWeb, obligaciones` | `clientes` y relacionadas | Tabs, Card, Badge |
| `ProyectosTab` | Client | `proyectos: ProyectoCRM[]` | `proyectos` | Badge estado (B.0), link `/erp/cotizador/[proyectoId]` |
| `VisitasTab` | Client | `visitas: (citas + visitas)[]` | `citas`, `visitas` | Badge estado cita (B.2), fotos/medidas |
| `PedidosWebTab` | Client | `pedidos: (pedidos_web + item_pedido)[]` | `pedidos_web`, `item_pedido` | Total COP formateado, desglose ítems |
| `ObligacionesTab` | Client | `obligaciones: ObligacionCRM[]` | `obligaciones_pendientes` | "Total / Pagado" (D.4), Badge estado (B.14), link a P-21/P-22 |
| `EventosModal` | Client | `clienteId, isOpen, onClose` | `eventos` | Modal (patrón P-01 "Ver historial") |

**Patrones M-06 L1 usados:** `useSmartSearch` (contexto "clientes"), `useDebounce` (filtros, 300ms), `Promise.all` (carga paralela), `Suspense` + loading states, design tokens + primitivas `components/veta/` (Card, Badge, Button, Popover, Select, Tabs).

### 5.3 Detalle de fila del tablero

| Campo | Fuente | Formato |
|---|---|---|
| Nombre | `clientes.nombre` | Texto (título de fila) |
| Teléfono | `clientes.telefono` | "300 123 4567" |
| Correo electrónico | `clientes.email` | Texto |
| Documento | `clientes.documento` | Texto |
| Domicilio | `clientes.domicilio` | Texto |
| Etapa | `clientes.etapa_funnel` | Badge según §3.1 (B.1) |
| Contadores | COUNT `proyectos` / `obligaciones_pendientes` / `pedidos_web` WHERE `cliente_id` | "3 proyectos · 1 obligación pendiente · 0 pedidos web" |
| Creado / Actualizado | `created_at`, `updated_at` | Relative time + absoluta |

**Menú ⋮ acciones:** "Ver detalle" (navega a `/erp/clientes/[clienteId]`) · "Ver historial" (abre `EventosModal` con `eventos WHERE cliente_id`).

### 5.4 Navegación en el shell del ERP

- **Ubicación:** sección **"Comercial"** de `ERP_NAV_SECTIONS` en `components/veta/erp-sidebar.tsx`, como segundo ítem después de `/erp/comercial`.
- **Entrada propuesta:** `{ href: '/erp/clientes', label: 'Clientes', icon: <Contact /> }` (icono `Contact` de `lucide-react`; `Users` ya se usa en la sección "Equipo").
- **Rutas:** tablero `/erp/clientes` · detalle `/erp/clientes/[clienteId]`.
- **Roles que la ven:** `admin`, `comercial` (acceso completo). Lectura para `finanzas` (relación cliente↔obligaciones) queda como pregunta del checkpoint — ver H-CRM-4 en Notas.

### 5.5 Accesibilidad (a11y)

- Tablero como tabla: `role="row"` por fila, `role="columnheader"` en encabezados.
- `SmartSearch`: `role="combobox"`, `aria-autocomplete="list"`, `aria-controls` (patrón P-01).
- Badges de estado: `aria-label="Etapa: Cliente"`.
- Pestañas del detalle: `role="tablist"` / `role="tab"` / `aria-selected`.
- Focus visible: tokens `--focus-ring` en todos los interactivos.

---

## 6. Comportamiento

### 6.1 Flujo de datos

```
Server Component (tablero, page.tsx)
  └─ Promise.all:
       ├─ getClientes(filtros) → {id, nombre, documento, telefono, email, domicilio, etapa_funnel, created_at, updated_at, proyectos_count, obligaciones_count, pedidos_count}
       └─ getCurrentUser() → {id, rol, nombre}
  → Props a Client Component (ClientesTablero)

Server Component (detalle, [clienteId]/page.tsx)
  └─ Promise.all:
       ├─ getCliente(clienteId)
       ├─ getProyectosByCliente(clienteId)
       ├─ getVisitasByCliente(clienteId)   [H-CRM-3: depende de citas/visitas]
       ├─ getPedidosWebByCliente(clienteId) (+ item_pedido)
       └─ getObligacionesByCliente(clienteId)
  → Props a Client Component (ClienteDetalle)

Client Component (ClientesTablero)
  ├─ useSmartSearch(clientes, contexto="clientes")
  ├─ useDebounce(filtros, 300ms)
  ├─ Derivado: clientesFiltrados = search + filtros aplicados
  └─ Actions:
       ├─ verDetalle(clienteId) → navega /erp/clientes/[clienteId]
       └─ crearCliente(data) → POST /api/erp/clientes → refresh listado
```

### 6.2 Tabla de eventos y comportamientos

| # | Evento | Gatillo | Acción | Side effect | Trace E-XX |
|---|---|---|---|---|---|
| 1 | Cargar tablero | `page.tsx` mount | `Promise.all([getClientes, getCurrentUser])` | — | — |
| 2 | Buscar cliente | `SmartSearch` input | `useSmartSearch` fuzzy sobre `nombre`/`telefono`/`email` + historial localStorage (patrón P-01) | — | — |
| 3 | Filtrar | Cambio en `FiltrosPopoverClientes` | `useDebounce` 300ms → re-filtra `clientesFiltrados` | Filtros persistidos en `localStorage` clave `clientes-filtros` | — |
| 4 | Ver detalle | Click fila / "Ver detalle" | Navegación a `/erp/clientes/[clienteId]` | — | — |
| 5 | Cargar detalle | `[clienteId]/page.tsx` mount | `Promise.all([getCliente, getProyectosByCliente, getVisitasByCliente, getPedidosWebByCliente, getObligacionesByCliente])` | — | — |
| 6 | Ver historial | "Ver historial" en menú ⋮ | Abre `EventosModal` (`eventos WHERE cliente_id`) | — | — |
| 7 | Crear cliente manual | Click [Nuevo cliente] | `POST /api/erp/clientes` → `origen='manual'` → refresh listado | — | Sin evento E-XX definido para creación manual (pendiente checkpoint, ver Notas) |
| 8 | Navegar a operación | Acciones de pestaña | "Abrir en Cotizador" → `/erp/cotizador/[proyectoId]` · "Cobrar" → `/erp/finanzas/obligaciones` · "Agendar visita" → `/erp/comercial` (P-03) | — | E-28 / E-06 (en pantalla destino) |

### 6.3 Estados de pantalla (UI states)

| Estado | Qué muestra |
|---|---|
| **Cargando** | Skeleton de filas (4-5 placeholders) |
| **Error carga** | Alert + "Reintentar" |
| **Sin resultados (filtro)** | "No hay clientes con estos filtros" + botón "Limpiar filtros" |
| **Vacío total** | Listado vacío + `[Nuevo cliente]` |
| **Pestaña sin registros** | "Sin proyectos" / "Sin visitas" / "Sin pedidos web" / "Sin obligaciones" por pestaña |

### 6.4 API endpoints

- **`GET /api/erp/clientes`** — con query params de filtro (`q`, `etapa_funnel[]` whitelist B.1, `soloObligaciones=1`). Select optimizado + contadores agregados (`proyectos_count`, `obligaciones_count`, `pedidos_count`) como subqueries `COUNT(*)`.
- **`GET /api/erp/clientes/:id`** — detalle del cliente.
- **`GET /api/erp/clientes/:id/proyectos`** · **`/visitas`** · **`/pedidos-web`** · **`/obligaciones`** — secciones del detalle (o un solo endpoint de detalle con `Promise.all` server-side).
- **`POST /api/erp/clientes`** — crear cliente manual (`origen='manual'`, validación R4).
- **`GET /api/erp/eventos?clienteId=`** — historial (append-only, lectura).

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Comando / verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 errores | `tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores en archivos de esta pantalla | `eslint app/erp/clientes/` |
| CA-3 | Entrada "Clientes" en la sección Comercial del sidebar, activa en `/erp/clientes*` | Test: `isItemActive('/erp/clientes')` true para `/erp/clientes/[id]`; inspección de `ERP_NAV_SECTIONS` |
| CA-4 | Regla R1: rol no autorizado recibe 403 | Test: `GET /erp/clientes` con rol `taller` → 403 |
| CA-5 | Todos los labels usan H07 o están en §3.6 "Labels nuevos propuestos" | `grep -r "'[A-Z]" app/erp/clientes/` = 0 resultados fuera del glosario / sección 3.6 |
| CA-6 | Tablero renderiza filas con nombre, teléfono, correo, documento, domicilio, etapa (B.1) y contadores | Test: `document.querySelector('[role="row"]')` contiene valores esperados de fixtures |
| CA-7 | Detalle renderiza pestañas Proyectos / Visitas / Pedidos web / Obligaciones con registros del cliente | Test: fixture con 2 clientes → las pestañas del cliente A no muestran filas del B |
| CA-8 | Filtros persistidos en localStorage y restaurados al recargar | Test: aplicar filtros → recargar → filtros restaurados. `localStorage["clientes-filtros"]` existe. |
| CA-9 | Principio POC-01: ningún ID interno visible | Test: markup visible no contiene UUIDs |
| CA-10 | Regla R2: no hay endpoint de mutación de `etapa_funnel` | `grep -r "etapa_funnel" app/api/erp/clientes/` = 0 resultados de escritura (solo lectura de DB) |
| CA-11 | `next build` compila sin errores de conexión de esta pantalla | `npx next build` (errores `ECONNREFUSED` esperados sin DB local; cualquier otro error es bug real) |

---

## 8. Verificación de integridad (pre-entrega)

Antes de marcar el diseño como "aprobado", el Iniciador verifica:

- [ ] Toda entidad en §1 existe en el `REGISTRO_DE_ENTIDADES.md`
- [ ] Todo estado en §2 existe en el `REGISTRO_DE_ENTIDADES.md` y en `glosario_h07.md`
- [ ] Todo label en §3 existe en `glosario_h07.md` o está declarado como "label nuevo propuesto" (§3.6)
- [ ] Toda regla en §4 tiene verificación mecánica (no "se ve bien")
- [ ] Todo componente en §5 usa tokens D4 y patrones M-06 L1
- [ ] Todo comportamiento en §6 traza a un evento E-XX del `diamante2_define_eventos.md`
- [ ] Los criterios de aceptación en §7 son ejecutables (no opinables)

---

## Notas complementarias (no canónicas)

### Hallazgos detectados (declarados, NO resueltos — requieren checkpoint del Supervisor)

**H-CRM-1 — Colisión de numeración P-27 (pre-existente).** El número P-27 está duplicado en el repo: `disenio_P27_gestion_portafolio.md` y `disenio_p27_catalogo_diseno_desarrollo.md`. Este diseño **no la resuelve** (fuera de alcance de t-138, solo la señala, según `input_diseno_javier_20260815.md` §4). Por eso este documento se numera **P-28** (provisional, misma numeración declarada en el input del Supervisor). La desambiguación de P-27 queda pendiente de checkpoint.

**H-CRM-2 — Divergencia `clientes.etapa_funnel` vs. código vivo.** El REGISTRO de entidades (§3) declara `clientes.etapa_funnel` ("snapshot del embudo, escrito en E-51") como canónico (regla de supremacía). El código vivo (`lib/db/schema.ts:402-412`) no tiene esa columna: en su lugar existe `clientes.origen` (texto, default `'manual'`). Este diseño **usa `etapa_funnel`** (fuente canónica) para el badge y el filtro de etapa, pero su materialización en schema queda **pendiente de checkpoint** — no se asume resuelta.

**H-CRM-3 — `citas` / `visitas` / `conversaciones` no materializadas.** Declaradas en REGISTRO §3 pero ausentes de `schema.ts` (solo existe `citas_garantia`). La pestaña **"Visitas"** del detalle depende de `citas` (franja, tipo, estado) y `visitas` (observaciones, medidas, fotos). El resto de la pantalla no depende de estas tablas. Pendiente de checkpoint: materializar las tablas o diferir la pestaña.

**H-CRM-4 — El sidebar no tiene gating por rol.** `components/veta/erp-sidebar.tsx` renderiza `ERP_NAV_SECTIONS` incondicionalmente para todo rol autenticado; no existe mecanismo de visibilidad por rol hoy. La declaración de roles de §5.4 (admin + comercial, ¿finanzas?) es la **intención de diseño**; su enforcement (ocultar/mostrar según rol, y guard server en las rutas) queda **pendiente de checkpoint** — no se asume implementado. La lectura para `finanzas` (pestaña Obligaciones) es pregunta abierta al Supervisor.

### Cambios de schema

**No se requiere cambio de schema para el núcleo de esta pantalla** (tablero + pestañas Proyectos / Pedidos web / Obligaciones): todo se lee de `clientes`, `proyectos`, `pedidos_web`/`item_pedido` y `obligaciones_pendientes` existentes. Las adiciones que podrían necesitarse son las declaradas en H-CRM-2 (`etapa_funnel`) y H-CRM-3 (`citas`/`visitas`) — **ambas pendientes de checkpoint, ninguna asumida resuelta**.

### Labels nuevos propuestos

Ver §3.6. Antes de implementar, el Orquestador debe registrar estos labels en `glosario_h07.md` (gobernanza §E: mutación de `arnes/` requiere checkpoint del Supervisor) — no se modificó el glosario en este documento.

### Relación con otras pantallas

| Pantalla | Relación |
|---|---|
| **P-01 Kanban Comercial** | Fuente de los patrones del tablero (SmartSearch, filtros, POC-01 "no IDs"). `clientes` se crea ahí vía `HybridClientSelector` (P-01/P-02) o conversión E-51; P-28 los consume. |
| **P-02 / P-04 Cotizador** | "Abrir en Cotizador" desde la pestaña Proyectos. |
| **P-03 Visitas** | "Agendar visita" navega a la agenda (E-06); la pestaña "Visitas" del detalle lee el registro. |
| **P-21 / P-22 Obligaciones** | "Cobrar" navega a la gestión de cobros (E-28); P-28 solo muestra el estado del cliente. |
| **P-24 Pedidos web** | La pestaña "Pedidos web" lee pedidos del cliente (el alta de pedidos ocurre en la tienda/P-24). |
| **F-07 Portal cliente** | Ninguna: P-28 es backstage exclusivamente (R03, `glosario_h07.md` §E.5). |
