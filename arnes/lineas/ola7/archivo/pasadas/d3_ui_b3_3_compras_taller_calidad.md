# Pase B3-3 — Compras + taller + calidad + entrega (subagente, loop de 3 iteraciones)

**Lente:** diseño de alto detalle de las pantallas de la familia **B3-3** (compras + taller + calidad + entrega) según `diamante3_metodologia.md:110-123`.
**Rol:** sub-agente B3-3 del Diamante 3 (`met:51`). **Modo:** `opencode general`, loop interno de 3 iteraciones.
**Fuentes leídas (solo estas):** `d3_schema_consolidado.md` (sch_c) · `d3_ui_b2_2_pantallas_requeridas.md` (inv) · `d3_ui_b2_1_destilacion_inv.md` (reg) · `d3_ui_b1_1_ux_ergonomia.md` (ux) · `diamante2_define_eventos.md` (define) · `diamante2_discover_eventos.md` (discover) · `d3_ui_b3_2_cronograma_gates.md` (b3_2) · `diamante3_metodologia.md` (met).
**Archivo de salida (único escrito):** `arnes/diagnostico/pasadas/d3_ui_b3_3_compras_taller_calidad.md`.
**Vocabulario:** `met:98-107`. Trazabilidad `archivo:línea`. Escepticismo: nada inventado.

---

## Iteración 1 (bruta)

Inventario crudo de la familia B3-3 sin filtrar:

- **Pantallas del inventario** (`inv:109`): P-13 Compras (OC, 3 mecánicas), P-14 Recepción (triple verificación E-21), P-15 Herramientas (reposición E-45), P-16 Fila del taller (E-22/E-44, capa 1 B2), P-17 Calidad (citación E-23 + veredicto E-24), P-18 Instalación (E-25), P-19 Acta de entrega (E-26). 7 pantallas.
- **Gates que esta familia ejecuta:** **E-21** (P-14), **E-24** (P-17, veredicto del comercial vendedor), **E-20** (P-13 dispara pago → gate de caja en P-20, B3-4). E-23 es señal (push, no gate).
- **Datos del consolidado** (`sch_c:§5-8-9`): `ordenes_compra` (7 estados, 3 mecánicas, `monto_total`/`anticipo_monto`), `items_orden_compra` (`recibido_cantidad`/`sin_defectos`/`catalogo_id`), `recepciones_material` (checks + estado), `herramientas`, `ordenes_trabajo` (ampliada, E-44 enganche), `modulos_armado` (fila de salida B2), `tareas_produccion` (capa 2 conservada), `citaciones_calidad` (estado citada), `verificaciones` (tipo_gate='calidad'), `instalaciones` (rango 5 días, adelantada_por), `actas_entrega` (firma, holgura 12), `proveedores`, `pedidos_web`.
- **Reglas** (`reg:`): R05 matemática en servidor (caja, monto OC), R07 verificación humana (listado→OC, cobro→desbloqueo), R12 constraints (checklist E-21 checkbox), R16 gates con guard, R18 confirmación destructiva (rechazar recepción, E-54), R28 captura en punto de verdad, R34 Familia A (dinero/compras/cronograma/fila taller).
- **Principios UX** (`ux:`): P01, P03, P08, P14, P28.

**Conteo bruto:** 7 pantallas × 8 secciones = 56 bloques.

---

## Iteración 2 (autocrítica)

Dudo de mis decisiones:

1. **¿E-20 se ejecuta en P-13 o P-20?** `inv:56` — P-13 dispara el pago, el gate de caja vive en P-20 (B3-4, D1 bloqueante). **Decisión: P-13 tiene el botón "Pagar" que navega a P-20 con contexto; el predicado E-20 y la caja derivada se especifican en B3-4 (P-20).** Este pase documenta la frontera y el dato de entrada (`ordenes_compra.monto_total`/`anticipo_monto`, CF-16).
2. **¿La recepción E-21 es por OC completa o por ítem?** El predicado `sch_c:§6`: `NOT EXISTS (items i WHERE i.recibido_cantidad < i.cantidad OR i.sin_defectos IS NOT TRUE)` — es por ítem, la OC se marca `recibida_verificada` cuando TODOS los ítems pasan. **Decisión: checklist por ítem (checkbox tipo/cantidad/sin defectos) + estado global derivado del predicado.** El `sin_defectos` nullable: null = aún no verificado = falla.
3. **¿P-17 (calidad) es una pantalla o dos?** `inv:61` las fusiona en UNA (E-23 empuja citación, E-24 veda en el mismo lugar). **Decisión: una pantalla con dos secciones: citación (desarrollador empuja) y veredicto (comercial vendedor decide).**
4. **¿La fila del taller (P-16) se diseña completa?** Solo la fila de salida por módulo (capa 1, decisión B2; `inv:59`); el detalle interno (`tareas_produccion`) es capa 2 DIFERIDO. **Decisión: P-16 muestra `modulos_armado` (estado por módulo) + enganche de `ordenes_trabajo`, sin pantallas de carpinteros.**
5. **¿El acta de entrega (P-19) es firma digital?** E-26 acta digital 100% (`sch_c:§8`); firma del cliente (E-13/E-26 subsistema firma DIFERIDO). **Decisión: wizard de firma dentro de P-19 (admin) y F-07 (cliente), consistente con E-13.**
6. **Autocrítica de datos:** la instalación fallida (E-25→E-54) dispara reproceso; el rango es ≤5 días (R40); `instalaciones.adelantada_por→check_15_dias` (B3-2 P-11). El `proyectos.estado` transiciona armado→instalado→entregado (enum extendido, CF-02).

**Resultado:** 7 pantallas; E-20 delegado a B3-4 (P-20); E-21 por ítem con estado derivado; P-17 unificada; P-16 solo fila de salida; P-19 con firma wizard.

---

## Iteración 3 (refinamiento final)

Decisiones depuradas:

- **Compras:** 3 mecánicas (anticipo_saldo / unico / subcontratacion) con campos distintos; estado 7 valores (`solicitada→aprobada→en_pago→pagada→recibida_verificada|rechazada|cancelada`, CF-13); guard E-18 (no OC de proyecto sin schema aprobado).
- **Recepción:** checklist C3 por ítem (R12); `recepciones_material.estado` derivado; verificadoPorRol='desarrollador'; rechazo con `reprocesos.origen='compra'` (E-54, rastreo de origen D2).
- **Calidad:** E-23 = señal (push del desarrollador, no bloquea); E-24 = veredicto del verificador único (comercial vendedor) con predicado completo.
- **Instalación:** rango 5 días; fallida → E-54; adelanto por check 15 (B3-2).
- **Responsive:** dinero/compras/fila taller = Familia A (scroll, 1ª columna sticky); calidad/instalación/garantía = Familia B.

---

## Entregable: especificación de pantallas (7)

### P-13 — Compras: órdenes de compra (3 mecánicas)

**1. Encabezado**
- Nombre: Compras. Ruta: `/app/erp/compras` + `/app/erp/compras/[ocId]` (nuevo — `inv:56`).
- Rol: gerente (o rol `compras` — DECISION_PENDIENTE DP-02), desarrollador.
- Eventos: E-19, E-20 (dispara pago → P-20), E-45 (OC operativa).

**2. Wireframe estructural**
```
┌ Header: [Compras] [Filtros: estado/proveedor] [+ Nueva OC] ───────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Lista de OC (Familia A)]                                              │
│  codigo | proveedor | monto | estado | mecanica | fecha | [Pagar]     │
│ ── Detalle /app/erp/compras/[ocId] ───────────────────────────────────  │
│ [OC #codigo]: proyecto/schema (si aplica) | proveedor | mecanica       │
│  Items (catalogo/cantidad/precio/total) | monto_total | anticipo_monto │
│  [Aprobar OC] [Registrar pago →] [Cancelar]                            │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Nueva OC | botón | E-19 | `ordenes_compra` (estado=solicitada) | gerente/`compras` | — | items + proveedor | — |
| Aprobar OC | botón | E-19 | `estado→aprobada` | gerente | — | items válidos | **si proyecto sin E-18 aprobado** (guard, define:75) |
| Registrar pago | botón | E-20 | → P-20 (gate de caja, D1) | gerente | caja insuficiente → bloquea en P-20 | — | si estado≠aprobada |
| Cancelar OC | botón rojo | — | `estado→cancelada` | gerente | modal R18 | motivo | si en_pago |
| OC operativa (reposición) | botón | E-45 | `ordenes_compra.origen='operativa'` (proyecto null) | gerente | — | herramientas a reponer | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "OC sin schema aprobado" | guard E-18 visible (R16) |
| "Mecánica: anticipo + saldo" | según `mecanica_pago` |
| "Pago sujeto al gate de caja" | botón pagar (R16) |
| "No hay órdenes de compra" | empty state |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| OC | `ordenes_compra.codigo_orden/estado/mecanica_pago/origen` | texto/enum(7)/enum/enum | E-19/E-45 |
| Monto | `ordenes_compra.monto_total/anticipo_monto` | currency | CF-16 |
| Items | `items_orden_compra.catalogo_id/nombre_personalizado/cantidad/precio_unitario/total_linea` | numeric | E-19 |
| Proyecto/schema | `ordenes_compra.proyecto_id/schema_id` | uuid | E-18/E-19 |
| Proveedor | `ordenes_compra.proveedor_id → proveedores.nombre` | uuid | E-19 |

**6. Máquina de estados del gate** — Guard E-18 de entrada (no OC de proyecto sin schema aprobado, `define:75`). **E-20 se ejecuta en P-20 (B3-4)**: este pase navega con contexto (`monto_total`/`anticipo_monto`). Estados OC = flujo interno (CF-13).

**7. Responsive + accesibilidad** — Familia A (tabla densa); CTA en tercio inferior; botones ≥48px.

**8. Aspectos de código React** — `OcForm` (3 mecánicas condicionales), `OcTable`, `OcDetalle`. API: `POST /api/erp/compras`, `PATCH /api/erp/compras/[ocId]`. Validación zod por mecánica.

---

### P-14 — Recepción de material (triple verificación + checklist C3)

**1. Encabezado**
- Nombre: Recepción de material. Ruta: `/app/erp/compras/[ocId]/recepcion` (nuevo — `inv:57`).
- Rol: desarrollador (ejecuta E-21), gerente (ve).
- Eventos: **E-21**, E-54 (rastreo de origen).

**2. Wireframe estructural**
```
┌ Header: [Recepción] [OC #{codigo}] [proveedor] ───────────────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Checklist por ítem (R12, C3)]                                         │
│  item | cantidad esperada | cantidad recibida | tipo ✓ | despacho ✓ | │
│        sin defectos ✓ |                                                │
│ [Estado global (derivado del predicado E-21)]:                         │
│  "Todos los ítems verificados" / "Faltan N ítems"                     │
│ [Acciones]: [Marcar recibido-verificado] [Reportar defecto → E-54]    │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Cantidad recibida | input | E-21 | `items_orden_compra.recibido_cantidad` | desarrollador | — | ≤ cantidad esperada | — |
| Check tipo | checkbox | E-21 | `recepciones_material.check_pedido_bien` | desarrollador | — | — | — |
| Check despacho | checkbox | E-21 | `check_despacho_bien` | desarrollador | — | — | — |
| Check sin defectos (por ítem) | checkbox | E-21 | `items_orden_compra.sin_defectos` | desarrollador | — | — | — |
| **Marcar recibido-verificado** | botón primario | **E-21** | `recepciones_material.estado→recibido_verificado` cuando P21 true | desarrollador | si no P21 → "faltan ítems" (botón deshabilitado R16) | P21 | si no todos los checks |
| Reportar defecto | botón rojo | E-54 | `reprocesos.origen='compra'` + módulo/componente/culpable | desarrollador | modal R18 | culpable requerido (D2) | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Todos los ítems verificados — puedes recibir" | P21 true |
| "Faltan N ítems sin verificar" | P21 false (R16) |
| "Material defectuoso — se abre reproceso" | tras E-54 |
| "Recepción verificada — control al taller" | toast (define:76) |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Esperado/recibido | `items_orden_compra.cantidad/recibido_cantidad` | numeric | E-19/E-21 |
| Defectos | `items_orden_compra.sin_defectos` (nullable) | bool | E-21 |
| Checks | `recepciones_material.check_pedido_bien/check_despacho_bien/check_material` | bool | E-21 |
| Estado | `recepciones_material.estado` | enum (pendiente/recibido_verificado/recibido_defectuoso) | E-21 |
| Verificador | `recepciones_material.verificado_por_rol` ('desarrollador') | enum | E-21 |

**6. Máquina de estados del gate — E-21 (el gate de esta pantalla)**

`P21(r) = r.check_pedido_bien ∧ r.check_despacho_bien ∧ NOT EXISTS (items i WHERE i.ordenId=:oc AND (i.recibido_cantidad < i.cantidad OR i.sin_defectos IS NOT TRUE))` (`sch_c:§6`).

- Por ítem; `sin_defectos` null = no verificado = falla. Estado global derivado del predicado, no campo manual.
- Al pasar, el control pasa al taller (P-16) con `ordenes_trabajo` (transición "recibido_verificado", bloque C resuelto: E-21 sale con estado `recibido_verificado`).
- Rechazo → `reprocesos.origen='compra'` con rastreo de origen (D2).

**7. Responsive + accesibilidad** — Checklist con filas ≥48px; checkbox grandes; Familia A si muchos ítems; foco visible.

**8. Aspectos de código React** — `RecepcionChecklist` (por ítem), estado derivado en servidor. API: `POST /api/erp/compras/[ocId]/recepcion` (escribe checks + items + estado en un tx + `eventos`).

---

### P-15 — Herramientas / reposición

**1. Encabezado**
- Nombre: Herramientas. Ruta: `/app/erp/compras/herramientas` (nuevo — `inv:58`).
- Rol: gerente, desarrollador. Eventos: E-45.

**2. Wireframe estructural**
```
┌ Header: [Herramientas] [+ Registrar herramienta] ─────────────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Lista (Familia B)]                                                    │
│  nombre | tipo | estado | proveedor | [Marcar necesita reposición]    │
│  → al marcar → OC operativa (P-13, origen='operativa')                │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Registrar herramienta | botón | — | `herramientas` (estado=operativa) | gerente | — | nombre+tipo | — |
| Marcar reposición | botón | E-45 | `herramientas.estado→necesita_reposicion` → dispara OC operativa | gerente/dev | — | — | — |
| Marcar mantenimiento | botón | — | `estado→mantenimiento` | gerente/dev | — | — | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Se genera una orden de compra operativa" | tras E-45 |
| "No hay herramientas registradas" | empty state |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Herramienta | `herramientas.nombre/tipo/valor/estado` | texto/enum | E-45 |
| Proveedor | `herramientas.proveedor_id → proveedores` | uuid | E-45 |

**6. Máquina de estados del gate** — Ninguna. E-45 → OC `origen='operativa'` (P-13).

**7. Responsive + accesibilidad** — Familia B; botones ≥48px.

**8. Aspectos de código React** — `HerramientasList`, `HerramientaForm`. API: `POST /api/erp/herramientas`, `PATCH /api/erp/herramientas/[id]/reposicion`.

---

### P-16 — Fila del taller (avance por módulo, capa 1)

**1. Encabezado**
- Nombre: Taller. Ruta: `/app/erp/taller` + `/app/erp/taller/[ordenId]` (existe, extiende — `inv:59`).
- Rol: desarrollador, gerente, comercial (visibilidad, H8). Contexto: Taller (solo fila de salida).
- Eventos: E-22, E-44 (enganche pedido→orden). Input de E-59/E-34.

**2. Wireframe estructural**
```
┌ Header: [Taller] [Filtros: estado/orden] ─────────────────────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Fila por módulo (Familia A)]                                          │
│  orden | proyecto | módulo | estado | horas estimadas | enganche      │
│  (por_armar → en_armado → armado → en_calidad → aprobado → en_instal)│
│ [Detalle interno NO disponible (capa 2 DIFERIDO)]                      │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Avanzar módulo | botón | E-22 | `modulos_armado.estado` (fila de salida) | desarrollador | — | — | si estado=aprobado |
| Enganchar pedido web | botón | E-44 | `ordenes_trabajo.origen='pedido_web'` + `pedido_web_id` | desarrollador | — | pedido pendiente | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Avance por módulo" | header (B2, define:118) |
| "Detalle de tareas — capa 2" | nota (DIFERIDO) |
| "Sin órdenes de trabajo" | empty state |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Fila | `modulos_armado.modulo/estado/horas_estimadas` | texto/enum/numeric | E-22 |
| Orden | `ordenes_trabajo.codigo_orden/tipo/origen/pedido_web_id` | texto/enum/enum/uuid | E-22/E-44 |

**6. Máquina de estados del gate** — Sin gates. Input de lectura para P-11 (E-59) y P-10 (E-34) (B3-2).

**7. Responsive + accesibilidad** — Familia A (fila del taller, `inv:59`/`reg:R34`); estados con icono+texto.

**8. Aspectos de código React** — `FilaTallerTable`, `AvanzarModulo`. API: `PATCH /api/erp/taller/[ordenId]/modulos`.

---

### P-17 — Calidad: citación + veredicto pre-despacho

**1. Encabezado**
- Nombre: Calidad. Ruta: `/app/erp/calidad` (nuevo — `inv:60`).
- Rol: comercial (veredicto E-24, D3), desarrollador (empuja citación E-23), gerente (ve).
- Eventos: **E-23**, **E-24**, E-54 (dispara reproceso).

**2. Wireframe estructural**
```
┌ Header: [Calidad] [Proyecto] [verificador: {comercial vendedor}] ─────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Sección citación (E-23)]:                                            │
│  citación de calidad → citaciones_calidad.estado='citada' (push)     │
│  módulos en citación | ventana programada                             │
│ [Sección veredicto (E-24)]:                                           │
│  [Aprobar veredicto] [Rechazar → reproceso E-54]                      │
│  guard: verificador único = comercial vendedor (proyectos.verificador_id)│
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Citar calidad | botón | E-23 | `citaciones_calidad.estado→citada` + `citado_en` (push, señal) | desarrollador | — | módulos en citación | — |
| **Aprobar veredicto** | botón primario | **E-24** | `verificaciones.tipo_gate='calidad',veredicto='aprobado'` — **`proyectos.estado` permanece en `'armado'`** (P24 queda true, desbloquea P-18/E-25); el único evento que saca de `'armado'` es E-25 (P-18) | **comercial vendedor** | modal R18 (irreversible) | — | si `verificador_id≠rol actual` O sin citación |
| Rechazar veredicto | botón rojo | E-24 | veredicto='rechazado' → `reprocesos.origen='calidad'` + módulo/componente | comercial vendedor | — | detalle requerido | idem |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Citación enviada — calidad programada" | tras E-23 |
| "Veredicto del verificador único" | header (I-035) |
| "Falta la citación del desarrollador" | guard E-24 (R16) |
| "Rechazado — reproceso de módulo {x}" | tras E-24 rechazo |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Citación | `citaciones_calidad.estado/modulos_ids/citado_en/ventana_programada` | enum/jsonb/ts/ts | E-23 |
| Veredicto | `verificaciones.tipo_gate='calidad'/veredicto/verificador_id/creado_en` | enum/enum/uuid/ts | **E-24** |
| Reproceso | `reprocesos.origen='calidad'/modulo/componente/culpable` | enum/enum/enum/enum | E-54 |

**6. Máquina de estados del gate — E-24 (el gate de esta pantalla)**

`P24(p) = p.estado='armado' ∧ ∃c∈citaciones_calidad: c.proyecto_id=p.id ∧ c.estado='citada' ∧ ∃v∈verificaciones: v.proyecto_id=p.id ∧ v.tipo_gate='calidad' ∧ v.veredicto='aprobado' ∧ v.verificador_id=p.verificador_id ∧ v.creado_en ≥ c.citado_en` (`sch_c:§6`).

- E-23 es SEÑAL (push), no gate (`inv:60`): la citación no bloquea por sí sola.
- E-24 desbloquea la instalación (E-25, P-18). Verificador único = comercial vendedor (D3).
- **Determinismo (corrección de reapertura, auditoría independiente):** al aprobar E-24, `proyectos.estado` NO cambia (permanece `'armado'`) — el predicado `P24` (que exige `estado='armado'`) queda `true` y el guard de P-18 ("Iniciar si P24 pasó") se desbloquea. `proyectos.estado` sale de `'armado'` únicamente por E-25 en P-18 (`en_instalacion`/`instalado`). Un solo destino de estado por transición: sin deadlock entre E-24 y P-18, y sin colapso con E-25.
- Rama negativa: rechazo → reproceso con rastreo de origen (D2).

**7. Responsive + accesibilidad** — Familia B; veredicto prominente (R10); modal R18 con focus trap.

**8. Aspectos de código React** — `CitacionCalidadForm`, `VeredictoE24` (guard de rol). API: `POST /api/erp/calidad/citar`, `POST /api/erp/calidad/veredicto` (un tx + eventos).

---

### P-18 — Instalación (rango de 5 días)

**1. Encabezado**
- Nombre: Instalación. Ruta: `/app/erp/instalaciones` + `[id]` (nuevo — `inv:61`).
- Rol: instalador, gerente, comercial. Eventos: E-25, E-54 (fallida en sitio).

**2. Wireframe estructural**
```
┌ Header: [Instalación] [Proyecto] [verificador: aprobado E-24] ────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Rango de instalación (≤5 días, datepicker de rango R40)]             │
│  rango_fecha_inicio | rango_fecha_fin | fecha_real                   │
│ [Estado]: programada → en_curso → instalada | fallida                │
│ [Acciones]: [Iniciar] [Marcar instalada] [Reportar fallida → E-54]   │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Seleccionar rango | datepicker rango | E-25 | `instalaciones.rango_fecha_inicio/fin` | instalador | — | ≤5 días (R40) | — |
| Iniciar | botón | E-25 | `instalaciones.estado→en_curso` + `proyectos.estado→en_instalacion` (sale de `'armado'`) | instalador | — | rango definido + **P24 true (veredicto calidad aprobado)** | si P24 false |
| Marcar instalada | botón | E-25 | `instalaciones.estado→instalada` + `proyectos.estado→instalado` | instalador | — | — | si no en_curso |
| Reportar fallida | botón rojo | E-54 | `instalaciones.estado→fallida` + `reprocesos.origen='instalacion'` | instalador | modal R18 | motivo + módulo | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Instalación programada para {rango}" | programada |
| "Rango máximo de 5 días" | nota (define:43) |
| "Instalación fallida — se abre reproceso" | tras E-54 |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Rango | `instalaciones.rango_fecha_inicio/fin/fecha_real` | timestamp | E-25 |
| Estado | `instalaciones.estado` (programada/en_curso/instalada/fallida) | enum | E-25 |
| Adelanto | `instalaciones.adelantada_por→check_15_dias` | uuid | E-59 (B3-2) |

**6. Máquina de estados del gate** — Guard E-24 de entrada: "Iniciar" se deshabilita si `P24` no pasó (R16). Tras la corrección de reapertura, `P24` evalúa `proyectos.estado='armado'` ∧ veredicto calidad aprobado del verificador único — como E-24 ya NO mueve el estado, `P24` permanece `true` al aprobar y "Iniciar" se habilita. "Iniciar" lleva `proyectos.estado→en_instalacion`; "Marcar instalada" → `instalado`. Sin deadlock.

**7. Responsive + accesibilidad** — R40 (timezone, hidratación); datepicker accesible; CTA en tercio inferior.

**8. Aspectos de código React** — `InstalacionForm`, `RangoDatePicker`. API: `PATCH /api/erp/instalaciones/[id]`.

---

### P-19 — Acta de entrega digital

**1. Encabezado**
- Nombre: Acta de entrega. Ruta: `/app/erp/instalaciones/[id]/acta` (nuevo — `inv:62`).
- Rol: instalador, cliente (firma), gerente. Eventos: E-26.

**2. Wireframe estructural**
```
┌ Header: [Acta de entrega] [Proyecto] [instalación] ───────────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Resumen: proyecto + instalación + holgura operativa (12 días)]       │
│ [Wizard de firma (E-26, subsistema DIFERIDO)]:                        │
│  → generar acta (pdf_url) → enviar al cliente → firmar → estado       │
│  (pendiente → firmada → proyectos.estado→entregado)                   │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Generar acta | botón | E-26 | `actas_entrega` (estado=pendiente, pdf_url) | instalador | — | instalación instalada | si no instalada |
| Enviar para firma | botón | E-26 | envía firma al cliente (wizard D8) | instalador | — | — | si no generada |
| Registrar firma | botón | E-26 | `actas_entrega.estado→firmada` + `proyectos.estado→entregado` | cliente (F-07) / instalador | — | firma | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Acta generada — pendiente de firma" | pendiente |
| "Holgura operativa: 12 días" | nota (sch_c) |
| "Entrega completada — proyecto entregado" | tras firma |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Acta | `actas_entrega.estado/fecha_firma/pdf_url/firmado_por` | enum/ts/texto/enum | E-26 |
| Holgura | `actas_entrega.holgura_operativa_dias` (12) | int | E-26 |

**6. Máquina de estados del gate** — Ninguna. E-26 cierra el proyecto (`proyectos.estado→entregado`, enum extendido CF-02).

**7. Responsive + accesibilidad** — Wizard en una columna <768px; firma accesible por teclado.

**8. Aspectos de código React** — `ActaForm`, `FirmaWizard` (compartido con E-13). API: `POST /api/erp/actas`, `POST /api/erp/actas/[id]/firmar`.

---

## Cobertura de eventos de la familia (7/7 pantallas, gates E-21/E-24 ejecutados aquí)

| Evento | Pantalla(s) | Tipo |
|---|---|---|
| E-19 | P-13 | humano |
| **E-20** | P-13 (dispara) + **P-20 (B3-4, gate de caja)** | **GATE** |
| **E-21** | **P-14** (ejecuta) | **GATE** |
| E-45 | P-15 (+ OC operativa en P-13) | humano |
| E-22 | P-16 (fila de salida) | humano (detalle capa 2) |
| E-44 | P-16 (enganche) + P-24 (B3-5) | híbrido |
| E-23 | **P-17** (push, señal) | **GATE** (señal) |
| **E-24** | **P-17** (veredicto) | **GATE** |
| E-54 | P-14/P-17/P-18 (origen compra/calidad/instalación) | híbrido |
| E-25 | P-18 | humano |
| E-26 | P-19 (firma) + F-07 (B3-5) | híbrido |

---

## Hallazgos

| ID | Tipo | Descripción | Fuente |
|---|---|---|---|
| H-B3-3-01 | `DECISION_PENDIENTE` | ¿"compras" es rol tipado o función del gerente? (DP-02): P-13 asume gerente, pero E-19/E-20 nombran "compras" — resolver antes de B4-2 | `sch_c:DP-02`; `inv:H-B2-2-02` |
| H-B3-3-02 | NOTA | E-20 (gate de caja) se especifica en B3-4 (P-20): este pase documenta la frontera y el dato de entrada (CF-16) | `sch_c:§6` |
| H-B3-3-03 | NOTA | `tareas_produccion` (capa 2) conservada sin rediseño; P-16 solo fila de salida (`modulos_armado`) | `sch_c:§7`; `inv:59` |
| H-B3-3-04 | `DECISION_PENDIENTE` | Alojador de docs E-41 (Drive vs R2, DP-09/inv:H-B2-2-12): roza P-19 pdf_url — validar alojador antes del corte | `sch_c:DP-09` |
| H-B3-3-05 | NOTA | `recepciones_material.check_material` está en la tabla pero no en el predicado P21 (solo check_pedido_bien + check_despacho_bien + ítems) — se captura como dato, no como gate | `sch_c:§6` |

---

## Notas para el Orquestador

- **Contrato cumplido (met:110-123):** 7 pantallas × 8 secciones; gates E-21 (P-14) y E-24 (P-17) con predicados completos; E-20 delegado a B3-4 (P-20).
- **Para B3-4:** P-20 (caja) consume `ordenes_compra.monto_total`/`anticipo_monto` (CF-16) y la caja derivada; el panel "Requiere tu decisión" (R20) lista los E-20 bloqueados.
- **Para B4-1:** verificar que E-21/E-24/E-20 sean evaluables desde UI (botones deshabilitados con razón R16) y que la atomicidad `eventos`+mutación esté en la implementación.
- **Prohibido cumplido:** solo escribió `d3_ui_b3_3_compras_taller_calidad.md`.

## Registro

- Fecha: 2026-08-04 · Pase B3-3 (ola 4 — compras + taller + calidad + entrega).
- Archivo de salida: `arnes/diagnostico/pasadas/d3_ui_b3_3_compras_taller_calidad.md`.
- Conteo: **7 pantallas** · gates E-21/E-24 ejecutados, E-20 delegado · 5 hallazgos (2 DECISION_PENDIENTE, 3 notas).
