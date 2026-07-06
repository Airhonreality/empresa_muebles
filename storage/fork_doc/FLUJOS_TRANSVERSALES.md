# Flujos Transversales del ERP

**Purpose**: Document main workflows that span multiple subsystems, state transitions, and decision points.

---

## FLUJO 1: Lead → Project → Quote → Contract → Production (Happy Path)

### Overview
The main value stream: a prospect becomes a customer, receives a quote, signs a contract, enters production, and completes delivery.

### State Machine

```
┌─────────┐      ┌──────────┐      ┌──────────┐      ┌─────────────┐      ┌────────────┐      ┌─────────────┐
│ Prospect│ ───→ │ Proposal │ ───→ │ Contract │ ───→ │  Production │ ───→ │ Installation│ ───→ │  Warranty   │
└─────────┘      └──────────┘      └──────────┘      └─────────────┘      └────────────┘      └─────────────┘
  Lead capture    Quotation        Signature          Manufacturing        On-site work      6-12 month
  (Comercial)     (Comercial)      (Finanzas)         (Producción)        (Producción)       post-delivery
   
   leads→         proyectos→        contratos→        ordenes_trabajo→    tareas_prod→       warranty
   clientes       espacio_var       abonos             tareas_prod         movimientos        record
```

### Step-by-Step Flow

#### 1. COMERCIAL: Lead Capture
- **Actor**: Sales team or lead form (Veta Pública)
- **Schema**: `leads`, `clientes`
- **Zaps**: `capturar_lead_embudo`, `actualizar_score_lead`
- **Outcome**: Lead record created; email sent to team; added to CRM

```json
{
  "leads": {
    "nombre": "Juan García",
    "email": "juan@empresa.com",
    "telefono": "+57 300 123 4567",
    "origen": "web_form",
    "fecha_captura": "2026-07-04T10:00:00Z",
    "score_interes": 0
  }
}
```

#### 2. COMERCIAL: Lead to Project Conversion
- **Actor**: Salesperson
- **Action**: Create `proyecto` from `leads` record
- **Outcome**: Lead becomes `proyectos` record with `estado='Prospecto'`

#### 3. COMERCIAL: Quotation (Cotizador)
- **Actor**: Salesperson or Designer
- **Schema**: `proyectos`, `espacio_variantes`, `items_variante`, `productos_catalogo`
- **UI**: CotizadorPro cell
- **Workflow**:
  1. Add spaces (e.g., "Cocina", "Sala")
  2. For each space, select items from catalog
  3. Set quantity and custom prices
  4. Compare variants (alternative designs)
  5. Calculate totals: materials + labor + markup
- **Outcome**: Quote saved; proyecto.estado → "Cotizando"
- **Decision Point**: Cliente aprecia cotización?
  - ✅ YES → proceed to contract
  - ❌ NO → stay in "Cotizando" or archive

#### 4. COMERCIAL: PDF Export & Proposal
- **Actor**: Salesperson
- **Zap**: `exportar_propuesta_pdf`
- **Inputs**: `proyectos`, `espacio_variantes`, `items_variante`, labor rates (SERV-* SKUs)
- **Output**: PDF generated; email sent to client
- **Note**: Zap validates SERV-DEV/ASSEMBLY/INSTALL SKUs exist; uses fallback rates if missing (Gap #3 audit)

#### 5. FINANZAS: Contract Generation
- **Actor**: Salesperson or Admin
- **Zap**: `zap_generar_contrato`
- **Preconditions** (per Gap #2 audit):
  - ✅ At least one `espacio_variantes.activa = true`
  - ✅ Active space has items with `cantidad > 0`
  - ✅ Quote total > 0
- **Schemas**: `contratos`, `abonos_contrato`
- **Outcome**: Contract created with 3 abono records (50%, 25%, 25%)
- **Zap Call**: Fire `zap_validar_transicion_estado_proyectos('Prospecto' → 'Aprobado')` BEFORE creating contract

#### 6. FINANZAS: First Payment (Anticipo 50%)
- **Actor**: Client or Admin (payment entry)
- **Zap**: `zap_registrar_abono_y_activar`
- **Trigger**: When `abonos_contrato.numero_abono = '1'` recorded as received
- **Preconditions**:
  - ✅ `contratos.estado = 'firmado'` (signature collected)
  - ✅ Abono value = 50% of contract total
- **Outcome**: 
  - `abonos_contrato.estado = 'recibido'`
  - `proyectos.estado → 'Producción'` (fires transition validation zap)
  - `zap_crear_orden_trabajo` → creates `ordenes_trabajo` for each space
  - Email to production team: "Ready to start"

#### 7. PRODUCCIÓN: Work Order Creation
- **Zap**: `zap_crear_orden_trabajo` (triggered by abono #1 or explicit workflow)
- **Inputs**: Contract + spaces + items
- **Outputs**: `ordenes_trabajo`, `tareas_produccion`
- **Schemas**:
  - `ordenes_trabajo` (master work order per project)
  - `tareas_produccion` (tasks per team member)
- **State**: Each orden starts in "Pending"
- **Note**: Must include `proyecto_id` in tareas for context tracking (Gap #4 audit)

#### 8. PRODUCCIÓN: Manufacturing Workflow
- **Actor**: Workshop team
- **Cells**: FichaProduccion, ProductionKanban
- **States**: Pending → InProgress → Inspection → Ready → Shipped
- **Kanban Moves**: Drag-drop tasks through stages
- **Zaps**: Auto-create supply orders (compras_materiales), update inventory

#### 9. FINANZAS: Second Payment (Mid-Project 25%)
- **Trigger**: When work order reaches ~50% completion (or manual entry)
- **Zap**: `zap_registrar_abono_2` (currently MISSING, Gap #5)
- **Action**: Record segunda abono; prepare installation logistics
- **Outcome**: Installation scheduled; client notified

#### 10. FINANZAS: Third Payment (Final 25%)
- **Trigger**: When work order marked "Ready" or "Shipped"
- **Zap**: `zap_registrar_abono_3` (currently MISSING, Gap #5)
- **Precondition**: Validate `sum(abonos) >= contratos.valor_total`
- **Outcome**: `contratos.estado → 'pagado'`; installation authorized; warranty record created

#### 11. PRODUCCIÓN → FINANZAS: Installation & Cost Closure
- **Actor**: Installation team
- **Zap**: `zap_registrar_instalacion_completada`
- **Inputs**: Final inspection photos, signed handoff form
- **Outputs**: `movimientos_financieros` (record install labor cost)
- **Outcome**: `proyectos.estado → 'Entregado'`; warranty period begins

#### 12. FINANZAS: Warranty Period (6-12 months)
- **Schemas**: `warranty_records`, `movimientos_financieros`
- **Notifications**: Auto-remind customer before warranty expires
- **Support**: Log defect reports; trigger repairs if needed

---

## FLUJO 2: Cancelación & Refund (Error Path)

### Trigger Points
- Client cancels before contract signature
- Client cancels after first payment (abono #1 received)
- Client cancels after manufacturing started

### State Transitions

```
[Any State] --cancel--> CANCELADO --[Refund Decision]--> Refund Or Forfeit
```

### Rules by State

| Current State | Cancel Rules | Refund % | Process |
|---|---|---|---|
| Prospecto | Immediate | N/A | Delete lead; no refund |
| Cotizando | Immediate | N/A | Archive proyecto; send courtesy email |
| Aprobado | After signature rejection | N/A | Void contract; archive |
| Producción (no payment) | Forfeit abono #1 hold | 0% | Cancel ordenes; archive proyecto |
| Producción (abono #1 paid) | Halt work; prepare refund | 50% | Fulfill abono #1; withhold abono #2,3 |
| Instalación | Post-installation cancellation | 75% | Full refund minus warranty exclusion |

### Zaps
- `zap_cancelar_proyecto` → sets `proyecto.estado = 'Cancelado'`
- `zap_procesar_refund` → moves `movimientos_financieros` (debit abonos back to client)
- `zap_archivar_ordenes_trabajo` → cancels `ordenes_trabajo`

---

## FLUJO 3: Reconciliación Financiera (Cross-Subsystem)

### Purpose
Match real bank movements (from bank adapter or manual entry) against system obligations (contratos, abonos).

### Workflow

```
Bank Statement (Wompi adapter)
  ↓
[zap_importar_movimientos_banco]
  ↓
Movimientos Financieros records (pending reconciliation)
  ↓
[ConciliacionBancaria cell]
  ↓
Manual or Auto Match with Obligaciones Pendientes
  ↓
[zap_conciliar_movimiento] → Update abonos.estado to 'aplicado'
  ↓
Dashboard shows: "Accounts reconciled ✅"
```

### Schemas
- `movimientos_financieros` (bank-level: deposits, withdrawals, fees)
- `obligaciones_pendientes` (business-level: invoices, abonos due)
- `cuentas_financieras` (account master: banco, efectivo, billetera_digital)

### Key Zaps
- `zap_importar_movimientos_banco` ← called by Wompi adapter webhook
- `zap_conciliar_movimiento` ← when matching movement to obligation
- `zap_actualizar_saldo_cuenta` ← after reconciliation

---

## FLUJO 4: Replenishment (Producción → Compras → Finanzas)

### Trigger
Taller identifies material shortage during manufacturing.

### Flow

```
Workshop notices: "Herrajes agotados"
  ↓
Create Compras Material record (via ProductionKanban or direct form)
  ↓
[zap_generar_orden_compra] → grupos by supplier
  ↓
Send PO to supplier (email, Whatsapp, etc.)
  ↓
Supplier delivers
  ↓
[zap_registrar_recepcion_materiales] → update inventory
  ↓
Accounting enters invoice
  ↓
[zap_crear_obligacion] → obligaciones_pendientes
  ↓
Finance pays; reconcile
```

### Schemas
- `compras_materiales` (requisitions from workshop)
- `proveedores` (supplier contact)
- `productos_catalogo` (inventory master)
- `obligaciones_pendientes` (vendor payables)

---

## FLUJO 5: Timesheet → Cost Accrual (Equipo → Finanzas)

### Purpose
Track labor hours by team member per project; accrue project costs.

### Flow

```
Operario logs hours:
  entrada: 08:00
  salida: 17:00
  tarea_produccion_id: "orden-123"
  ↓
[zap_procesar_horas_laborales]
  ↓
Calculate: hours × hourly_rate → labor_cost
  ↓
[zap_crear_movimiento_costo_proyecto]
  ↓
Project P&L updated:
  Materials: $X
  Labor: $Y
  Markup: $Z
  ────
  Total: $X+Y+Z
```

### Schemas
- `registro_horas` (time entries by team member & task)
- `usuarios_equipo` (staff with hourly rates)
- `tareas_produccion` (which task were they working on?)
- `movimientos_financieros` (accrue labor cost)

---

## Decision Matrix: When to Fire Which Zap

| Condition | Zap(s) Fired | Outcome |
|-----------|----------|---------|
| User creates `leads` record | `capturar_lead_embudo`, `actualizar_score_lead` | Lead captured; score initialized |
| User generates `contratos` | `zap_validar_transicion_estado` (guard) | Validate prereqs; proceed or reject |
| User registers abono #1 | `zap_registrar_abono_y_activar` | Create ordenes_trabajo; move to Producción |
| User registers abono #2 | `zap_registrar_abono_2` (MISSING) | Log payment; prepare installation |
| User registers abono #3 | `zap_registrar_abono_3` (MISSING), `zap_validar_pagos_proyecto` | Validate total paid; move contrato to pagado |
| Operario marks tarea "Done" | `zap_actualizar_orden_estado` (auto-aggregate) | If all tareas done → orden marked Ready |
| Finance reconciles movement | `zap_conciliar_movimiento`, `zap_actualizar_saldo_cuenta` | Apply payment; update account balance |

---

## Error Recovery

| Error | Detection | Recovery |
|-------|-----------|----------|
| Abono amount ≠ expected % | `zap_validar_pagos_proyecto` (when #3 fires) | Alert admin; manual review; accept or reject |
| No SERV-* SKUs in catalog | `exportar_propuesta_pdf` pre-flight | Use fallback labor rates; log warning |
| Missing proyecto_id on tarea | `zap_crear_orden_trabajo` validation | Fail fast; don't create tarea; alert admin |
| Tarea estado ∉ valid enum | State validation guard (Gap #2) | Reject drag-drop; show error; don't persist |
| Bank movement not matched to obligation | Manual review in ConciliacionBancaria | Mark as "Deferred"; schedule follow-up |

---

## Performance Notes

- **Critical Path**: Abono #1 → Ordenes creation → ~seconds latency (user waits for confirmation)
- **Background**: Hourly cost accrual from timesheet (batch job, eventual consistency OK)
- **Daily**: Reconciliation job imports new bank movements; flags unmatched

---

## Links

- **Subsystem Details**: 
  - `SUBSISTEMA_01_COMERCIAL_SALES/README.md`
  - `SUBSISTEMA_02_PRODUCCION_MANUFACTURING/README.md`
  - `SUBSISTEMA_03_FINANZAS_ACCOUNTING/README.md`
- **Cell References**:
  - CotizadorPro → Quote calculation
  - ComercialKanban → Lead/Project pipeline
  - FichaProduccion → Manufacturing detail
  - ConciliacionBancaria → Bank reconciliation

---

**Version**: 1.0  
**Status**: Living document (updated as workflows change)  
**Last Updated**: 2026-07-04
