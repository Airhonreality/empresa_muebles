# Pase B3-4 — Finanzas + compensación (subagente, loop de 3 iteraciones)

**Lente:** diseño de alto detalle de las pantallas de la familia **B3-4** (finanzas + compensación) según `diamante3_metodologia.md:110-123`.
**Rol:** sub-agente B3-4 del Diamante 3 (`met:51`). **Modo:** `opencode general`, loop interno de 3 iteraciones.
**Fuentes leídas (solo estas):** `d3_schema_consolidado.md` (sch_c) · `d3_ui_b2_2_pantallas_requeridas.md` (inv) · `d3_ui_b2_1_destilacion_inv.md` (reg) · `d3_ui_b1_1_ux_ergonomia.md` (ux) · `diamante2_define_eventos.md` (define) · `diamante2_discover_eventos.md` (discover) · `logica_de_negocio.md` (logica) · `d3_ui_b3_3_compras_taller_calidad.md` (b3_3) · `diamante3_metodologia.md` (met).
**Archivo de salida (único escrito):** `arnes/diagnostico/pasadas/d3_ui_b3_4_finanzas_compensacion.md`.
**Vocabulario:** `met:98-107`. Trazabilidad `archivo:línea`. Escepticismo: nada inventado.

---

## Iteración 1 (bruta)

Inventario crudo de la familia B3-4 sin filtrar:

- **Pantallas del inventario** (`inv:110`): P-20 Caja (E-43, E-20, E-08, E-28, E-57), P-21 Obligaciones y cobros (E-56/E-27/E-28/E-29/E-30), P-22 Compensación y comisiones (E-31/E-32/E-35/E-57/E-58), P-23 Dashboard del contador (lectura). 4 pantallas.
- **Gate que esta familia ejecuta:** **E-20** (gate de caja, D1 bloqueante) en P-20 — el único gate del conjunto. B3-3 delegó su especificación aquí (`b3_3:H-B3-3-02`).
- **Datos del consolidado** (`sch_c`): `cuentas_financieras` (saldo materializado reconciliado, S-02/CF-17), `movimientos_financieros` (+socioId/ordenCompraId/medioPago/comprobanteUrl/prioridadPago, CF-18), `obligaciones_pendientes` (+hitoId/origen 5 valores/deduccionDiseno3d/periodicidad/fechaNotificacion/atrasoDias/notificadoGerente, estado +atrasada), `liquidaciones_compensacion`, `comisiones_proyecto` (desfaseId → desfases_cronograma, 5 tipos), `facturas` (DIFERIDO A3-C4, amarrada a E-28), `parametros` (comision_desarrollador_pct=5, comision_carpintero_pct=5, bruto_diseno_3d, holgura_cobro_dias=12, iva_default_pct=19).
- **Predicado E-20** (`sch_c:215`): `caja_disponible = (Σ cuentas_financieras.saldo_actual) − (Σ obligaciones_pendientes WHERE tipo='por_pagar' AND estado IN ('pendiente','atrasada') OF (monto_total − monto_pagado))`; `P20 = caja_disponible ≥ :monto_pago`.
- **Reglas** (`reg:`): R05 matemática en servidor (caja derivada), R07 verificación humana (gerente resuelve gate), R16 gates con guard, R18 confirmación destructiva, R20 panel "Requiere tu decisión", R28 captura en punto de verdad.
- **Principios UX** (`ux:`): P01, P03, P08, P14, P22 (carga/estados), P28.

**Conteo bruto:** 4 pantallas × 8 secciones = 32 bloques.

---

## Iteración 2 (autocrítica)

Dudo de mis decisiones:

1. **¿E-20 vive solo en P-20 o también en P-13?** `inv:166` — el disparo es P-13, el gate se resuelve en P-20 (gerente moviendo cronogramas para liberar caja). **Decisión: P-20 es la pantalla de resolución del gate; P-13 navega aquí con contexto (OC + monto).** No duplico el movimiento financiero en P-13 (frontera `inv:H-B2-2-01`).
2. **¿La caja es un campo o una función?** `sch_c:137` — `cuentas_financieras.saldo_actual` es materializado reconciliado (S-02/CF-17); `caja_disponible` es DERIVADA por E-20 (R05). **Decisión: mostrar ambas: saldo por cuenta (materializado) + caja disponible calculada en servidor; nunca calcular en cliente.**
3. **¿P-21 y P-22 se separan?** P-21 = obligaciones (cobro al cliente), P-22 = compensación (pago a socios). Son dos flujos financieros distintos (define:120-133). **Decisión: separadas, pero comparten el componente de "movimiento"** (`movimientos_financieros`).
4. **¿El dashboard del contador (P-23) es login propio o vista sin sesión?** `inv:130` (H9) / `inv:H-B2-2-04` — `DECISION_PENDIENTE`. **Decisión: diseñar con login `contador` (lectura estricta), anotando la DP — B4-2 validará el permiso.**
5. **¿Compensación es automática total?** E-31/E-35 son sistema, pero la aprobación/pago es humana (`inv:181,186`). **Decisión: pantalla híbrida: cálculo automático (deshabilitado para edición, R05) + acción humana "aprobar/pagar".**
6. **Autocrítica de datos:** `facturas` DIFERIDO (A3-C4) → P-21/P-23 muestran "facturación pendiente" como frontera, sin escribir `facturas` aún. `deduccionDiseno3d` (E-30) resta del cobro al cliente. `comisiones_proyecto` amarrada a `desfases_cronograma` (E-33→E-35, causa auditable).

**Resultado:** 4 pantallas; E-20 resuelto en P-20; caja materializada + derivada; P-21 vs P-22 separadas; P-23 con login contador (DP anotada); compensación híbrida; facturas solo frontera.

---

## Iteración 3 (refinamiento final)

Decisiones depuradas:

- **P-20 (Caja):** E-20 gate de caja con predicado completo; botón "Resolver gate" navega al cronograma (E-33, causa estructurada — `define:87`); movimientos con `socioId`/`ordenCompraId`/`medioPago`/`comprobanteUrl`/`prioridadPago`.
- **P-21 (Obligaciones):** origen 5 valores; nacimiento automático E-56 por hito; estados (pendiente/atrasada/pagada/...); notificación E-27; cobro E-28; atraso E-29 con holgura 12 días; deducción E-30.
- **P-22 (Compensación):** liquidación por período; cuenta por socio E-58; 5 tipos de comisión; E-35 cierre de período; arriendos E-57 como movimiento; aprobación humana.
- **P-23 (Contador):** lectura pura; facturación pendiente (frontera DIAN); cobros por estado.
- **Responsive:** finanzas = Familia A (tablas densas, 1ª columna sticky); saldos con moneda.

---

## Entregable: especificación de pantallas (4)

### P-20 — Caja / movimientos financieros (caja real derivada)

**1. Encabezado**
- Nombre: Finanzas — Caja. Ruta: `/app/erp/finanzas` (existe, extiende — `inv:63`).
- Rol: gerente (E-43, resuelve E-20), contador (lectura), comercial (solo registro del hecho E-08).
- Eventos: **E-20** (gate de caja), E-43 (lectura), E-08 (dinero), E-28 (cobro), E-30 (deducción), E-57 (arriendos).

**2. Wireframe estructural**
```
┌ Header: [Finanzas] [Periodo] [Rol: gerente] ──────────────────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Saldos (R05, servidor)]:                                              │
│  Caja disponible (derivada E-20) | Saldo por cuenta (materializado)   │
├──────────────────────────────────────────────────────────────────────┤
│ [Gates de caja bloqueados (R20) — "Requiere tu decisión"]             │
│  OC #codigo | proveedor | monto | [Resolver →] (navega cronograma)   │
├──────────────────────────────────────────────────────────────────────┤
│ [Movimientos financieros (Familia A)]                                  │
│  fecha | concepto | cuenta | tipo | socio/OC | monto | comprobante    │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Resolver gate E-20 | botón | E-20 | navega a P-09 (causa E-33) para liberar caja | gerente | si caja sigue insuficiente → gate sigue bloqueado | — | si no hay gate bloqueado |
| **Registrar pago OC** | botón primario | **E-20** | `movimientos_financieros` (tipo=**egreso**, concepto=compra, `ordenCompraId`, monto=monto_total−anticipo, `medioPago`, `comprobanteUrl`, `prioridadPago`) + `obligaciones_pendientes.estado→pagada` (si aplica) en un tx | **gerente** | modal R18 (pago irreversible) | monto + cuenta + comprobante | si `P20=false` (caja insuficiente) O sin OC aprobada en `aprobado_compras` |
| Registrar cobro | botón | E-28 | `movimientos_financieros` (tipo=ingreso) | gerente | — | monto + cuenta | — |
| Registrar arriendo | botón | E-57 | `movimientos_financieros` (tipo=egreso, concepto=arriendo) | gerente | — | monto | — |
| Ver comprobante | link | E-20/E-28 | abre `comprobanteUrl` | gerente | — | — | si no URL |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Caja disponible: $X — insuficiente para la OC #codigo" | P20 false (R16) |
| "Caja disponible: $X — gate liberado" | P20 true |
| "Saldo materializado reconciliado" | nota saldo por cuenta (sch_c:137) |
| "Requiere tu decisión: {N} gates de caja" | panel R20 |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Caja disponible | derivada `sch_c:215` (E-20) | currency (servidor) | E-20 |
| Saldo por cuenta | `cuentas_financieras.saldo_actual` | currency | E-43 (S-02) |
| Movimientos | `movimientos_financieros.fecha/concepto/cuentaId/tipo/monto/socioId/ordenCompraId/medioPago/comprobanteUrl/prioridadPago` | timestamp/texto/uuid/enum/currency/uuid/uuid/enum/texto/enum | E-08/E-20/E-28/E-57 |

**6. Máquina de estados del gate — E-20 (el gate de esta pantalla)**

`P20(m) = caja_disponible ≥ :monto_pago` con `caja_disponible = (Σ cuentas_financieras.saldo_actual) − (Σ obligaciones_pendientes WHERE tipo='por_pagar' AND estado IN ('pendiente','atrasada') OF (monto_total − monto_pagado))` (`sch_c:215`).

- Bloqueante (D1, `define:87`): el pago a proveedor no procede sin P20.
- **Acción de UI (corrección de reapertura, auditoría independiente):** el egreso del pago a proveedor se materializa con el botón "Registrar pago OC" (habilitado cuando `P20=true`), que escribe `movimientos_financieros` tipo=egreso con `ordenCompraId` en un tx con el estado de la OC (`aprobada→pagada`) y `obligaciones_pendientes→pagada`. No hay auto-materialización implícita: el pago es una decisión explícita del gerente.
- Rama negativa: fila `eventos` gate con payload + decisión del gerente, que **mueve cronogramas** (E-33, causa estructurada) para liberar caja — la UI deep-linkea a P-09 (B3-2).
- `saldo_actual` materializado = reconciliado (S-02/CF-17); `caja_disponible` siempre derivada en servidor (R05).

**7. Responsive + accesibilidad** — Familia A (tabla de movimientos densa, 1ª columna sticky); CTA en tercio inferior; moneda formateada.

**8. Aspectos de código React** — `SaldoPanel` (servidor), `GatesBloqueadosPanel` (R20), `MovimientosTable`. API: `GET /api/erp/finanzas` (deriva caja), `POST /api/erp/finanzas/movimientos`. **Nunca** calcular caja en cliente.

---

### P-21 — Obligaciones y cobros

**1. Encabezado**
- Nombre: Finanzas — Obligaciones y cobros. Ruta: `/app/erp/finanzas/obligaciones` (nuevo — `inv:64`).
- Rol: gerente, comercial, contador (lectura).
- Eventos: E-56 (nacimiento automático), E-27 (notificación), E-28 (cobro), E-29 (atraso), E-30 (deducción).

**2. Wireframe estructural**
```
┌ Header: [Obligaciones] [Filtros: estado/proyecto] ────────────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Lista (Familia A)]                                                    │
│  obligacion | proyecto | hito | origen | monto | vencimiento | estado │
│  (pendiente | atrasada | pagada | ...) | [Cobrar] [Notificar]         │
│  atrasoDias | notificadoGerente (badges)                               │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Cobrar | botón | E-28 | `obligaciones_pendientes.estado→pagada` + movimiento ingreso + (si aplica) `facturas` (DIFERIDO A3-C4) | gerente | — | monto ≤ pendiente | si estado=pagada |
| Notificar | botón | E-27 | `fechaNotificacion` + `notificadoGerente` al superar holgura (12 días, sch_c:223) | sistema (auto) | — | — | — |
| Ver detalle | fila click | — | modal con origen/hito/periodicidad/deduccionDiseno3d | todos | — | — | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Obligación nacida del hito {hito}" | origen=hito (E-56) |
| "Atrasada {N} días — aviso enviado al gerente" | E-29 (holgura 12) |
| "Deducción por diseño 3D aplicada" | E-30 |
| "Facturación DIAN — frontera" | tooltip (A3-C4) |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Obligación | `obligaciones_pendientes.origen/hitoId/periodicidad/fecha_vencimiento/estado/monto_total/monto_pagado` | enum(5)/uuid/enum/date/enum/currency/currency | E-56 |
| Atraso | `obligaciones_pendientes.atrasoDias/notificadoGerente` | int/bool | E-29 |
| Deducción | `obligaciones_pendientes.deduccionDiseno3d` | currency | E-30 |
| Notificación | `obligaciones_pendientes.fechaNotificacion` | timestamp | E-27 |

**6. Máquina de estados del gate** — Sin gate. Estados de obligación (aditivo +atrasada, `sch_c:139`). E-56 es sistema (nacimiento por hito, `inv:176`).

**7. Responsive + accesibilidad** — Familia A; badges de atraso con color + texto (no solo color).

**8. Aspectos de código React** — `ObligacionesTable`, `CobrarModal`. API: `GET /api/erp/finanzas/obligaciones`, `POST /api/erp/finanzas/obligaciones/[id]/cobrar` (tx: estado + movimiento + evento).

---

### P-22 — Compensación y comisiones (+ cuenta por socio)

**1. Encabezado**
- Nombre: Finanzas — Compensación. Ruta: `/app/erp/finanzas/compensacion` (nuevo — `inv:65`).
- Rol: gerente (aprueba/paga), contador (lectura), socio (ve su saldo E-58 — diseñador/desarrollador/carpintero/auxiliar/instalador).
- Eventos: E-31, E-32, E-35, E-57, E-58.

**2. Wireframe estructural**
```
┌ Header: [Compensación] [Período] [Rol] ───────────────────────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [Cálculo del período (R05, servidor, deshabilitado para edición)]     │
│  por socio: rol | días | comisiones (5 tipos) | arriendos | bruto     │
│  cuenta por socio (E-58) | deducciones                                │
├──────────────────────────────────────────────────────────────────────┤
│ [Acciones humanas]: [Aprobar liquidación] [Registrar pago E-31/E-57]  │
│ [Ver detalle de comisión → desfase (E-33→E-35, auditable)]            │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Aprobar liquidación | botón | E-31 | `liquidaciones_compensacion` (estado=aprobada) | gerente | modal R18 | — | si cálculo no cerrado |
| Registrar pago | botón | E-31/E-57 | `movimientos_financieros` (tipo=egreso, socioId) | gerente | — | monto | — |
| Cerrar período | botón | E-35 | `comisiones_proyecto` (cierre) + `liquidaciones_compensacion` (período) | gerente | — | — | si ya cerrado |
| Ver comisión | link | E-35 | `comisiones_proyecto.desfaseId → desfases_cronograma` (causa) | gerente | — | — | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Cálculo automático — no editable" | R05 (cálculo servidor) |
| "Comisión ajustada por desfase de cronograma" | E-33→E-35 (sch_c:141) |
| "Cuenta por socio: $X" | E-58 (solo el propio socio, `inv:127`) |
| "Retención diseñador — DECISION_PENDIENTE" | DP-01 (parametros vacío) |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Liquidación | `liquidaciones_compensacion.socioId/período/bruto/deducciones/neto/estado` | uuid/enum/currency/currency/currency/enum | E-31 |
| Comisión | `comisiones_proyecto.tipo (5)/desfaseId/monto` | enum/uuid/currency | E-35/E-31 |
| Saldo socio | `movimientos_financieros.socio_id` + `liquidaciones_compensacion` (derivada E-58, sch_c:201) | derivado | E-58 |
| Parámetros | `parametros.comision_desarrollador_pct=5` · `comision_carpintero_pct=5` · `bruto_diseno_3d=130000` · `holgura_cobro_dias=12` | numeric | E-31/E-35 (sch_c:223) |

**6. Máquina de estados del gate** — Sin gate. E-58 = vista derivada de solo lectura para el socio (aislamiento por `socioId`); el socio solo ve SU cuenta (guard, `inv:127`).

**7. Responsive + accesibilidad** — Familia A para gerente; vista simple de saldo para socio (Familia B); moneda formateada.

**8. Aspectos de código React** — `CalculoLiquidacion` (servidor, read-only), `CuentaSocio` (guard rol+socioId). API: `GET /api/erp/finanzas/compensacion`, `POST /api/erp/finanzas/compensacion/aprobar`.

---

### P-23 — Dashboard del contador (facturación pendiente)

**1. Encabezado**
- Nombre: Finanzas — Contador. Ruta: `/app/erp/finanzas/contador` (nuevo — `inv:66`).
- Rol: contador (lectura estricta — `logica:390-391`). Eventos: E-28 (estado cobros), contratos pendientes de facturar.

**2. Wireframe estructural**
```
┌ Header: [Dashboard contador] [Filtros: período] ──────────────────────┐
├──────────────────────────────────────────────────────────────────────┤
│ [KPI de lectura]: obligaciones pagadas / pendientes | por período     │
│ [Facturación pendiente (frontera DIAN, A3-C4)]:                       │
│  contratos firmados sin factura → "pendiente de facturar" (badge)    │
│ [Cobros por estado (E-28)]:                                           │
└──────────────────────────────────────────────────────────────────────┘
```

**3. Elementos interactivos (TABLA)**

| Etiqueta | Tipo | Evento | Transición | Guard | Rama negativa | Validación | Deshabilitado |
|---|---|---|---|---|---|---|---|
| Ver detalle de cobro | fila click | E-28 | modal lectura | contador | — | — | — |
| Exportar reporte | botón | — | CSV lectura | contador | — | — | — |

**4. Elementos de texto (TABLA)**

| Texto | Cuándo |
|---|---|
| "Vista de solo lectura" | header (R07, `inv:130`) |
| "{N} contratos pendientes de facturar" | frontera DIAN (A3-C4) |
| "Facturación DIAN — se activa por E-28" | tooltip (sch_c:189) |

**5. Mapeo de datos (TABLA)**

| Campo | entidad.columna | Formato | Fuente |
|---|---|---|---|
| Cobros | `obligaciones_pendientes.estado/monto_total` (agregado) | agregado servidor | E-28 |
| Facturación pendiente | contratos firmados sin `facturas` (DIFERIDO) | agregado frontera | A3-C4 |
| KPIs | derivados de `movimientos_financieros` | agregado | E-43 (lectura) |

**6. Máquina de estados del gate** — Sin gate. Todo de lectura.

**7. Responsive + accesibilidad** — Familia B (dashboard); KPIs con texto + número.

**8. Aspectos de código React** — `ContadorDashboard` (solo `GET`, guard rol=contador). API: `GET /api/erp/finanzas/contador`. DP-04 (login contador, `inv:H-B2-2-04`) — B4-2 valida.

---

## Cobertura de eventos de la familia (4/4 pantallas, gate E-20 ejecutado aquí)

| Evento | Pantalla(s) | Tipo |
|---|---|---|
| **E-20** | **P-20** (resuelve, D1 bloqueante) + P-13 (dispara, B3-3) | **GATE** |
| E-43 | P-20 (lectura) | sistema (lectura) |
| E-08 | P-20 (dinero) + F-08/P-04 (B3-1, registro del hecho) | híbrido |
| E-56 | P-21 (nacimiento por hito, automático) | **sistema** |
| E-27 | P-21 (envía) + F-07 (B3-5, cliente ve) | **sistema** |
| E-28 | P-21/P-20 (cobro) + F-07 (B3-5, online) | híbrido |
| E-29 | P-21 (atraso + aviso gerente) | híbrido |
| E-30 | P-21/P-20 (deducción diseño 3D) | **sistema** |
| E-31 | P-22 (aprueba/paga) | **sistema** (regla) + humano |
| E-32 | P-22 (micro cuenta autogenerada) | **sistema** |
| E-35 | P-22 (cierre de período, comisiones 5 tipos) | **sistema** |
| E-57 | P-20/P-22 (arriendos) | híbrido |
| E-58 | P-22 (saldo por socio, lectura) | **sistema** (lectura) |

---

## Hallazgos

| ID | Tipo | Descripción | Fuente |
|---|---|---|---|
| H-B3-4-01 | `DECISION_PENDIENTE` | P-23 contador: login propio vs vista sin sesión (H9/DP-04) — B4-2 (roles×gates) debe resolverlo | `inv:H-B2-2-04`; `logica:390-391` |
| H-B3-4-02 | `DECISION_PENDIENTE` | `base_comision_tamano` (DP-06): ¿valor_total o subtotal con IVA? Bloquea el cálculo exacto de E-35 en P-22 | `sch_c:DP-06`; `sch_c:224` |
| H-B3-4-03 | NOTA | `facturas` es frontera (A3-C4): P-21/P-23 la muestran como estado "pendiente de facturar" sin escritura hasta facturación DIAN | `sch_c:189,267` |
| H-B3-4-04 | NOTA | E-20 resuelve en P-20 con deep-link a P-09 (E-33): el gerente libera caja moviendo cronogramas con causa estructurada (`define:87`) | `sch_c:215`; `inv:166` |
| H-B3-4-05 | `DECISION_PENDIENTE` | Transparencia por rol (H8/DP): qué ve el comercial de caja/cronograma interno (inv:H-B2-2-03) — toca visibilidad de P-20/P-21 | `inv:H-B2-2-03` |

---

## Notas para el Orquestador

- **Contrato cumplido (met:110-123):** 4 pantallas × 8 secciones; gate E-20 especificado con predicado completo (`sch_c:215`); caja derivada en servidor (R05).
- **Para B4-1 (determinismo de gates):** E-20 es el gate del conjunto — verificar que `caja_disponible` se derive siempre en servidor y que la rama negativa (fila `eventos` gate + decisión gerente) sea persistente.
- **Para B4-2 (roles×gates):** resolver DP-04 (contador), DP-06 (base comisión) y la transparencia del comercial en P-20/P-21.
- **Prohibido cumplido:** solo escribió `d3_ui_b3_4_finanzas_compensacion.md`.

## Registro

- Fecha: 2026-08-04 · Pase B3-4 (ola 4 — finanzas + compensación).
- Archivo de salida: `arnes/diagnostico/pasadas/d3_ui_b3_4_finanzas_compensacion.md`.
- Conteo: **4 pantallas** · gate E-20 ejecutado · 5 hallazgos (3 DECISION_PENDIENTE, 2 notas).
