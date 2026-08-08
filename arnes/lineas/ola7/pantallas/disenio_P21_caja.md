# P-21 — Caja (Gate E-20)

**Fecha:** 2026-08-07 · **Estado:** propuesta · **Fase:** F6 · **Ruta:** `/app/erp/caja` · **Roles:** gerente, finanzas

---

## 1. Entidades que consume

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `cuentas_financieras` | §9 | id, nombre, tipo, saldo_actual | Cuentas con saldo en tiempo real |
| `movimientos_financieros` | §9 | id, fecha, descripcion, tipo, monto, cuenta_origen_id, cuenta_destino_id, obligacion_id, orden_compra_id, socio_id, medio_pago, comprobante_url, prioridad_pago | Libro mayor completo |
| `obligaciones_pendientes` | §9 | id, descripcion, monto_total, monto_pagado, fecha_vencimiento, estado, origen | Obligaciones por pagar |
| `ordenes_compra` | §7 | id, codigo_orden, proveedor_id, monto_total, anticipo_monto, estado, mecanica_pago | OC que requieren pago |
| `registros_gate_caja` | §9 | id, orden_compra_id, fecha, monto_solicitado, saldo_disponible, bloqueado, decision, resolucion | Traza de bloqueos E-20 |
| `proveedores` | §7 | id, nombre | Nombre del proveedor en el panel |

---

## 2. Estados que transiciona

| Estado origen | Acción | Estado destino | Evento | Validación |
|---|---|---|---|---|
| OC `en_pago` | Gerente/finanzas autoriza | `pagada` → movimiento egreso | E-20 | `monto ≤ caja_disponible` |
| OC `en_pago` | Caja insuficiente | — (bloqueo) → `registros_gate_caja` | E-20 (rama negativa) | `monto > caja_disponible` |
| Bloqueo registrado | Gerente reordena prioridades / libera | Desbloqueado → reintenta pago | E-20 + E-33 | Decisión documentada en `decision` |

**Predicado E-20:** `caja_disponible = Σcuentas.saldo_actual − Σobligaciones.pendiente(monto_total − monto_pagado)`. Si `monto_OC > caja_disponible` → bloqueo.

---

## 3. Vocabulario H07

| Label | Código | Entidad |
|---|---|---|
| "Caja" | — | `cuentas_financieras` |
| "Saldo disponible" | — | `cuentas_financieras.saldo_actual` |
| "En pago" | `en_pago` | `ordenes_compra.estado` |
| "Pagada" | `pagada` | `ordenes_compra.estado` |
| "Bloqueado" | `bloqueado` | `registros_gate_caja` |
| "Autorizar pago" | — | Acción E-20 |

---

## 4. Reglas de negocio

| # | Regla | Validación |
|---|---|---|
| R1 | Pago autorizado → `movimientos_financieros` + `obligaciones_pendientes.monto_pagado += monto` en misma transacción | Servidor, atómico |
| R2 | Caja insuficiente → `registros_gate_caja.bloqueado=true`, OC sigue en `en_pago` | Servidor |
| R3 | Cola de pagos: orden automático por fecha de OC (FIFO). Reorden manual permitido (gerente/finanzas). Cada movimiento queda en `eventos` | Servidor + UI |
| R4 | `caja_disponible` se recalcula en cada consulta (SUM real, no campo materializado) | Servidor |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `CajaDashboard` | Server + Client | Saldo resumen + cuentas |
| `ColaPagosTable` | Client | Tabla de OC en `en_pago`, orden FIFO con drag-reorder |
| `PagoAccion` | Client | Botón "Autorizar" + monto + saldo disponible. Deshabilitado con razón si `monto > caja_disponible` (R16) |
| `LibroMayorTable` | Client | Historial completo de `movimientos_financieros` con filtros (fecha, cuenta, tipo) |
| `GateCajaLog` | Client | Lista de `registros_gate_caja` con decisión y resolución |
| `ReordenarModal` | Client (Radix Dialog) | Reorden manual de prioridad de pago |

**Patrones M-06 L1:** MoneyInput COP, Familia A responsive, Suspense, Toast, Badge `material`, `Promise.all(cuentas, movimientos, obligaciones, OC)`

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Trace |
|---|---|---|---|---|
| 1 | Cargar caja | Mount | `GET /api/erp/caja` (cuentas + OC en_pago + resumen en paralelo) | — |
| 2 | Autorizar pago | Click "Autorizar" | `POST /api/erp/caja/pagar {orden_compra_id}` → movimiento + actualiza obligación + OC→pagada | E-20 |
| 3 | Bloqueo por caja | Automático en servidor | `POST /api/erp/caja/bloqueo` → `registros_gate_caja` | E-20 (rama negativa) |
| 4 | Reordenar cola | Drag-drop en `ColaPagosTable` | `PATCH /api/erp/caja/cola {orden_ids[]}` | — |
| 5 | Liberar bloqueo | Gerente decide | `PATCH /api/erp/caja/bloqueo/:id {decision, resolucion}` | E-20 + E-33 |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | Pago autorizado: movimiento + obligación + OC en misma tx | Test: simular fallo post-movimiento → rollback total |
| CA-3 | Bloqueo: `monto=5000, caja=3000` → OC no pagada, registro_gate_caja creado | Test |
| CA-4 | `caja_disponible` recalculado en cada GET (no cache) | Test: GET antes y después de pago → saldo distinto |
| CA-5 | Reorden manual persiste y no rompe FIFO default | Playwright: drag row 3 → row 1 |
| CA-6 | Solo gerente/finanzas ven botón "Autorizar" | Test: POST con rol `taller` → 403 |
