# P-22 — Obligaciones (Cobros, Pagos, Comisiones, Nómina)

**Fecha:** 2026-08-07 · **Estado:** propuesta · **Fase:** F6 · **Ruta:** `/app/erp/obligaciones` · **Roles:** gerente, finanzas, comercial (notificación)

---

## 1. Entidades que consume

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `obligaciones_pendientes` | §9 | id, descripcion, origen, monto_total, monto_pagado, fecha_vencimiento, estado, persona_id, cliente_id, proveedor_id, proyecto_id, contrato_id, hito_id, base_calculo, porcentaje, tipo_comision, cantidad_modulos, desfase_id, periodicidad, deduccion_diseno_3d | Tabla unificada: todos los tipos de deuda |
| `movimientos_financieros` | §9 | id, monto, fecha, obligacion_id | Pagos/cobros asociados |
| `proyectos` | §3 | id, nombre_proyecto, cliente_id | Contexto |
| `clientes` | §3 | id, nombre | Cliente deudor |
| `proveedores` | §7 | id, nombre | Proveedor acreedor |
| `personas` | §1 | id, nombre | Beneficiario de comisión/nómina |
| `contratos` | §4 | id, codigo_contrato | Contrato origen (hitos) |
| `hitos_pago` | §4 | id, tipo, monto_o_porcentaje, razon, fecha_limite | Hito que origina la obligación |
| `parametros_compensacion` | §9 | id, clave, valor_numeric, unidad | % comisión, bruto diseño 3D, etc. |

---

## 2. Estados que transiciona

| Estado origen | Acción | Estado destino | Evento | Validación |
|---|---|---|---|---|
| `pendiente` | Registrar pago/cobro | `parcial` o `pagado` | E-28 (cobro) / E-20 (pago) | `monto_pagado + monto ≤ monto_total` |
| `pendiente` | Vencer sin pago | `atrasada` (derivado) | E-29 | Sistema: `fecha_vencimiento < hoy` |
| `parcial` | Completar pago | `pagado` | E-28 / E-20 | `monto_pagado = monto_total` |
| `atrasada` | Alerta automática | — | — | Sistema notifica a finanzas/gerente (NO al cliente sin permiso comercial) |
| `atrasada` | Comercial autoriza notificar cliente | — | E-27 | Comercial click "Notificar cliente" |
| — | Comercial notifica manualmente | — | E-27 | Acción explícita del comercial |

---

## 3. Vocabulario H07

| Label | Código | Entidad |
|---|---|---|
| "Pendiente" | `pendiente` | `obligaciones_pendientes.estado` |
| "Parcial" | `parcial` | `obligaciones_pendientes.estado` |
| "Pagado" | `pagado` | `obligaciones_pendientes.estado` |
| "Atrasada" | `atrasada` | `obligaciones_pendientes.estado` |
| "Cobro cliente" | `contrato_hito` | `obligaciones_pendientes.origen` |
| "Pago proveedor" | `proveedor` | `obligaciones_pendientes.origen` |
| "Comisión" | `comision` | `obligaciones_pendientes.origen` |
| "Nómina" | `nomina` | `obligaciones_pendientes.origen` |
| "Diseño 3D" | `diseno_3d` | `obligaciones_pendientes.origen` |
| "Arriendo" | `arriendo` | `obligaciones_pendientes.origen` |

---

## 4. Reglas de negocio

| # | Regla | Validación |
|---|---|---|
| R1 | `origen='contrato_hito'`: monto_total viene del hito. `origen='comision'`: columnas `base_calculo, porcentaje, tipo_comision` requeridas | Servidor |
| R2 | Alerta de vencimiento: sistema notifica a finanzas/gerente. NO al cliente sin acción explícita del comercial (E-27 manual) | Servidor |
| R3 | Pago registrado → `movimientos_financieros` + `monto_pagado += monto` en misma tx | Servidor, atómico |
| R4 | Liquidación de comisiones (`origen='comision'`): estado `pagado` solo tras aprobación de gerente + finanzas | Servidor: doble checkpoint |
| R5 | `deduccion_diseno_3d`: se descuenta del primer hito (anticipo) si E-08 ya fue pagado. No toca `contratos.valor_total` | Servidor |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `ObligacionesDashboard` | Server + Client | Filtros: por origen, estado, proyecto, persona |
| `ObligacionFila` | Client | `obligacion, onPagar, onNotificar` |
| `RegistrarPagoModal` | Client (Radix Dialog) | `obligacion, cuentas[]` — MoneyInput, selector cuenta |
| `AlertaVencimientoBadge` | Client | `obligacion`: badge rojo si `atrasada`, amarillo si `fecha_vencimiento ≤ 3 días` |
| `NotificarClienteBtn` | Client | Visible solo para `comercial`. Deshabilitado sin permiso |
| `ComisionDetalle` | Client | Panel con `base_calculo, porcentaje, monto, desfase_id` |
| `AprobarLiquidacionBtn` | Client | Visible solo gerente/finanzas. Doble checkpoint (ambos deben aprobar) |

**Patrones M-06 L1:** MoneyInput COP, Familia A, Suspense, Toast, Badge `material`, SmartSearch (proyecto/persona)

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Trace |
|---|---|---|---|---|
| 1 | Cargar obligaciones | Mount | `GET /api/erp/obligaciones?filtros` | — |
| 2 | Registrar pago/cobro | Submit modal | `POST /api/erp/movimientos` + `PATCH obligacion.monto_pagado` | E-28 / E-20 |
| 3 | Sistema detecta vencimiento | Cron/tigger al cargar | `obligacion.estado→atrasada` (derivado). Alerta a finanzas/gerente | E-29 |
| 4 | Comercial notifica cliente | Click "Notificar" | `POST /api/erp/notificaciones {obligacion_id, cliente_id}` | E-27 |
| 5 | Aprobar liquidación | Gerente + finanzas aprueban | `PATCH obligacion {estado:'pagado'}` + `movimientos_financieros` | E-31 + E-35 |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | Pago registrado atómicamente (movimiento + obligación en misma tx) | Test: fallo post-movimiento → rollback |
| CA-3 | Alerta NO notifica al cliente automáticamente | Test: `GET /api/notificaciones?cliente_id=X` → vacío sin acción comercial |
| CA-4 | Alerta SÍ notifica a finanzas/gerente | Test: `GET /api/alertas?rol=finanzas` → incluye vencimiento |
| CA-5 | Doble checkpoint liquidación: gerente + finanzas | Test: solo gerente aprueba → estado sigue `pendiente` |
| CA-6 | `origen='comision'` requiere `base_calculo` y `porcentaje` | Test: POST sin base_calculo → 422 |
