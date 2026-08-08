# P-23 — Cuentas de Cobro a Proveedores

**Fecha:** 2026-08-07 · **Estado:** propuesta · **Fase:** F6 · **Ruta:** `/app/erp/cuentas-cobro` · **Roles:** gerente, finanzas, compras

---

## 1. Entidades que consume

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `cuentas_cobro_proveedor` | §9 | id, proveedor_id, orden_compra_id, concepto, valor, estado, firma_digital, url_documento, fecha_emision, fecha_vencimiento, created_at | Registro de factura/recibo |
| `proveedores` | §7 | id, nombre, nit | Proveedor que emite la cuenta |
| `ordenes_compra` | §7 | id, codigo_orden, monto_total, estado | OC asociada |
| `obligaciones_pendientes` | §9 | id, origen='proveedor', monto_total, estado | Obligación de pago al proveedor |

---

## 2. Estados que transiciona

| Estado origen | Acción | Estado destino | Validación |
|---|---|---|---|
| — | Crear cuenta de cobro (concepto + valor + firma digital) | `emitida` | — |
| `emitida` | Adjuntar orden de compra | `vinculada` | OC existe y coincide proveedor |
| `emitida` / `vinculada` | Registrar factura electrónica (Aliado/correo) | — (solo `url_documento`) | URL válida |
| `vinculada` | Marcar como pagada | `pagada` | Existe `movimientos_financieros` asociado a la obligación |
| Cualquiera | Anular | `anulada` | R18 modal confirmación |

---

## 3. Vocabulario H07

| Label | Código | Entidad |
|---|---|---|
| "Cuenta de cobro" | — | `cuentas_cobro_proveedor` |
| "Emitida" | `emitida` | `cuentas_cobro_proveedor.estado` |
| "Vinculada" | `vinculada` | `cuentas_cobro_proveedor.estado` |
| "Pagada" | `pagada` | `cuentas_cobro_proveedor.estado` |
| "Anulada" | `anulada` | `cuentas_cobro_proveedor.estado` |

---

## 4. Reglas de negocio

| # | Regla | Validación |
|---|---|---|
| R1 | Factura electrónica NO se genera en el sistema — se recibe por correo o la emite el contador en Aliado. El sistema solo registra la URL | `url_documento` campo opcional |
| R2 | Al crear cuenta de cobro, se genera `obligaciones_pendientes.origen='proveedor'` automáticamente | Servidor, atómico |
| R3 | Vincular OC: `proveedor_id` de la cuenta debe coincidir con `proveedor_id` de la OC | Servidor |
| R4 | Firma digital requerida al crear la cuenta | Campo `firma_digital` no vacío |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `CuentasCobroLista` | Server + Client | Tabla con filtro por proveedor, estado |
| `CuentaCobroForm` | Client (Radix Dialog) | `onCreate`: concepto, valor (MoneyInput), firma digital, proveedor |
| `VincularOCModal` | Client | `cuenta, ocs_disponibles[]` — selector de OC del mismo proveedor |
| `FacturaElectronicaUpload` | Client | `onUpload`: adjunta URL del documento de Aliado/correo (NO genera factura) |
| `CuentaCobroDetalle` | Client | Ver cuenta + OC vinculada + obligación + historial de pagos |

**Patrones M-06 L1:** MoneyInput COP, Suspense, Toast, Radix Dialog, SmartSearch (proveedor)

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción |
|---|---|---|---|
| 1 | Cargar cuentas | Mount | `GET /api/erp/cuentas-cobro?filtros` |
| 2 | Crear cuenta | Submit `CuentaCobroForm` | `POST /api/erp/cuentas-cobro` → crea cuenta + `obligaciones_pendientes(origen='proveedor')` |
| 3 | Vincular OC | Submit `VincularOCModal` | `PATCH /api/erp/cuentas-cobro/:id {orden_compra_id}` |
| 4 | Adjuntar factura (Aliado) | Upload URL | `PATCH /api/erp/cuentas-cobro/:id {url_documento}` |
| 5 | Marcar pagada | Click "Pagada" | `PATCH /api/erp/cuentas-cobro/:id {estado:'pagada'}` (cuando la obligación asociada está `pagado`) |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | Crear cuenta → `obligaciones_pendientes` creada automáticamente con `origen='proveedor'` | Test: GET obligaciones después de POST cuenta → fila existe |
| CA-3 | Vincular OC con proveedor distinto → error | Test: cuenta proveedor A, OC proveedor B → 422 |
| CA-4 | Factura electrónica: solo se registra URL, no se genera documento | Test: campo `url_documento` acepta URL externa, no hay endpoint de generación |
| CA-5 | Firma digital requerida al crear | Test: POST sin firma → 422 |
