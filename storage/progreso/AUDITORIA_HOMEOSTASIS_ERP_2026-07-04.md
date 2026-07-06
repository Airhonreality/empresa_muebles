# Auditoría de Homeostasis del Subsistema ERP — 2026-07-04

**Fecha**: 2026-07-04  
**Auditor**: Arquitecto de Harnes Agnostico (Fable 5 + Agents)  
**Scope**: Coherencia entre requerimientos teleológicos, schemas, zaps e interfaces del fork Veta de Oro  
**Modelo aplicado**: Hexagonal Fork > Subsistemas > Células

---

## RESUMEN EJECUTIVO

El subsistema ERP implementa 4 subsistemas operativos (Comercial, Producción, Finanzas, Kronos) con un harnes de **39 schemas**, **24+ zaps** y **45+ componentes especializados**. Sin embargo, se identificaron **5 gaps críticos de homeostasis** donde la coherencia entre capas se rompe:

| Severidad | Cantidad | Subsistemas Afectados | Gap Tipo |
|-----------|----------|----------------------|----------|
| 🔴 CRITICAL | 1 | Comercial | Schema-UI estado mismatch |
| 🟠 HIGH | 2 | Comercial+Producción, Cotización | No workflow validation, Missing labor rates |
| 🟡 MEDIUM | 2 | Producción, Finanzas | Orphaned context, Partial payment unhandled |

**Conclusión**: El sistema es **coherente a nivel local** (cada componente funciona) pero **incoherente a nivel sistémico** (transiciones de estado, flujos multi-subsistema, y prereq. de negocio sin enforcement). La refactorización debe agregar **3 nuevas zaps de orquestación** y **4 campos de schema** para validar el flujo de entrada a estados críticos.

---

## GAP #1: ESTADO SCHEMA-UI MISMATCH (🔴 CRITICAL)

### Identidad
- **Subsistema**: Comercial
- **Severidad**: CRITICAL
- **Estado**: Detectado y documentado
- **Impacto en producción**: ALTO (state transitions unpredictable)

### Descripción del Problema

El schema `proyectos.estado` define un conjunto de opciones que no coincide con los estados implementados en la UI de `ComercialKanban`:

**Schema Definition** (`storage/db/schema_definitions.json`):
```json
{
  "name": "proyectos",
  "field": "estado",
  "type": "select",
  "options": ["Prospecto", "Cotizando", "Aprobado", "Producción", "Entregado"],
  "required": true
}
```

**UI Implementation** (`src/components/specialized/kanban/ComercialKanban.tsx:~20`):
```typescript
const STAGE_COLORS = {
  'activa': '#FFD700',
  'enviada': '#87CEEB',
  'en_contrato': '#90EE90',
  'pre_produccion': '#FFA500',
  'produccion': '#FF6347'
};
```

**Component Initialization** (`src/components/specialized/cotizador/CotizadorPro.tsx:~47`):
```typescript
headerLocal = { estado: 'activa', ... } // assumes 'activa' is valid
```

### Cadena de Fallos

1. **Usuario** mueve un proyecto desde "Prospecto" a "Cotizando" en el kanban de Comercial
2. **UI Component** intenta guardar `estado: 'enviada'` (nombre del stage del kanban)
3. **Base de datos** recibe valor fuera de enum → silent truncation o validation fail
4. **Zap `exportar_propuesta_pdf`** busca `proyectos.find(c => c.estado === 'activa')` → empty set
5. **Usuario** ve error "No hay cotización activa seleccionada" aunque el registro existe
6. **Reporting & Filtering** broken: dashboard reports can't group by estado correctly

### Raíz Causa

- **Schema source**: `storage/db/schema_definitions.json` es la fuente canónica pero la UI no la lee en tiempo de compilación
- **Component assumption**: Cada componente (`CotizadorPro`, `ComercialKanban`) asume un vocabulario local de estados
- **No normalization layer**: No hay traductor entre UI states y schema enums

### Ubicación en Código

| Archivo | Línea | Tipo | Problema |
|---------|-------|------|----------|
| `storage/db/schema_definitions.json` | ~826 | Source of Truth | Define estado options (stale?) |
| `src/components/specialized/kanban/ComercialKanban.tsx` | ~20-26 | UI Constant | STAGE_COLORS uses different vocab |
| `src/components/specialized/cotizador/CotizadorPro.tsx` | ~47 | Component Init | Assumes 'activa' is valid estado |
| `storage/db/scripts.json` | ~6 (exportar_propuesta_pdf) | Zap Logic | Queries for 'activa' estado |
| `src/components/specialized/kanban/ComercialCard.tsx` | ~101 | Rendering | Reads proyecto.estado directly |

### Impacto Sistémico

- ❌ **Data Integrity**: Invalid estados can be persisted
- ❌ **UI Consistency**: Kanban displays inconsistent estado values
- ❌ **Workflow Reliability**: Zaps query wrong enum values
- ❌ **Reporting**: Estado-based dashboards return incomplete data
- ⚠️ **Testing**: Hard to test estado transitions end-to-end

### Propuesta de Fix

**Opción A (Recommended)**: Alinear schema con UI
1. Update `schema_definitions.json` proyectos.estado options → `['activa', 'enviada', 'en_contrato', 'pre_produccion', 'produccion']`
2. Update all zaps to use new valores (e.g., `estado === 'activa'` ya estaría correcto)
3. Update doc strings to explain business meaning of each estado

**Opción B (Alternative)**: Add normalization layer
1. Keep schema as-is
2. Add normalization function `normalizeEstado(uiValue) → schemaValue`
3. Require all components to go through normalizer
4. Risk: Increases boilerplate; still error-prone if zaps bypass

**Opción C (Not Recommended)**: Hard-code mapper in every component
- Too error-prone, duplicates logic

**Recommendation**: Implement **Opción A** because:
- The UI estados are production-ready and tested
- Easier to maintain single enum in one place
- Zaps already use UI vocab locally
- No runtime overhead

### Aceptación Criteria

- [ ] Schema `proyectos.estado` enum matches all STAGE_COLORS keys from ComercialKanban
- [ ] Zap `exportar_propuesta_pdf` queries updated to use new enum
- [ ] All estado assignments (`headerLocal.estado = ...`) use values from schema enum
- [ ] E2E test: Move proyecto through all kanban stages → estado persists correctly
- [ ] Docs updated with business meaning of each estado

---

## GAP #2: NO WORKFLOW TRANSITION VALIDATION (🟠 HIGH)

### Identidad
- **Subsistema**: Comercial → Producción (transversal)
- **Severidad**: HIGH
- **Estado**: Detectado; no enforcement actual
- **Impacto en producción**: MEDIO-ALTO (orphaned data, downstream failures)

### Descripción del Problema

El flujo de negocio espera que cuando un `proyecto.estado` cambia a "produccion", se cumplan prerrequisitos:
1. Debe existir un contrato firmado (`contratos.estado == 'firmado'`)
2. Al menos un abono recibido (`abonos_contrato.numero_abono == '1'`)
3. Al menos un espacio debe estar marcado activo (`espacio_variantes.activa == true`)
4. Ese espacio debe tener items (`items_variante` con cantidad > 0)

**Realidad actual**: Ningún zap valida estos prereq. Un usuario puede:

```javascript
// Step 1: Create proyecto (estado='Prospecto')
proyecto = { id: 'p1', estado: 'Prospecto', ... }

// Step 2: Open CotizadorPro, add items, close without saving
// (espacio_variantes and items_variante still empty or inactive)

// Step 3: Click "Generate Contract" in UI
zap_generar_contrato(p1) {
  // ⚠️ NO CHECK: Are there active espacio_variantes?
  const items = itemsVariante.filter(item => item.variante_id === ev.id)
  // Returns [] if no active variant
  
  // ⚠️ NO CHECK: Is valor_total > 0?
  const contrato = { valor_total: 0, objeto_items: [] }
  // Contrato persisted with ZERO value
}

// Step 4: User marks "primer abono recibido" (1/3 payment)
zap_registrar_abono_y_activar(p1) {
  if (numero_abono === '1') {
    proyecto.estado = 'produccion'  // ⚠️ NO PRE-CHECK
    // Even though contrato.valor_total === 0
    // Even though no production can start
  }
}

// Step 5: Production kanban tries to create tareas_produccion
// Order has no items → tarea creation fails or is orphaned
// → Producción kanban displays broken state
```

### Cadena de Fallos Multi-subsistema

1. **Comercial**: User generates contrato without active variants
2. **Finanzas**: Contrato with valor_total=0 accepted (no validation)
3. **Comercial**: First abono triggers `zap_registrar_abono_y_activar` without pre-checks
4. **Proyecto.estado** moved to "produccion" despite prerequisites unmet
5. **Producción**: Tries to create ordenes_trabajo but has no reference items
6. **Kanban**: Displays estado='produccion' but tareas are empty
7. **Operario**: Confused; can't start work

### Ubicación en Código

| Archivo | Función | Problema |
|---------|---------|----------|
| `storage/db/scripts.json` | `zap_generar_contrato` (línea ~54) | No valida espacio_variantes.activa antes de calcular totales |
| `storage/db/scripts.json` | `zap_registrar_abono_y_activar` (línea ~63) | No pre-checa proyecto.estado legal o contratos.valor_total > 0 |
| `src/components/specialized/kanban/ComercialCard.tsx` | State transition UI | Allows drag-drop without calling validation zap |
| **MISSING** | `zap_validar_transicion_estado_proyectos` | **Does not exist** — should guard ALL estado writes |
| **MISSING** | `zap_validar_pagos_proyecto` | **Does not exist** — should verify payment prerequisites |

### Prereqs Not Enforced

#### Transition "Prospecto" → "Cotizando"
- ✅ No prereqs (always allowed)

#### Transition "Cotizando" → "Aprobado" (contract generation)
- ❌ **Missing Check**: `espacio_variantes.filter(ev => ev.proyecto_id === p.id && ev.activa).length > 0`
- ❌ **Missing Check**: `items_variante exists for active variant`
- ❌ **Missing Check**: `sum(items.total_linea) > 0` (non-zero quote)

#### Transition "Aprobado" → "Producción" (first payment received)
- ❌ **Missing Check**: `contratos.find(c => c.proyecto_id === p.id && c.estado === 'firmado')`
- ❌ **Missing Check**: `abonos_contrato.numero_abono === '1' received`
- ❌ **Missing Check**: `contratos.valor_total > 0`

#### Transition "Producción" → "Entregado" (project complete)
- ❌ **Missing Check**: `ordenes_trabajo all completed`
- ❌ **Missing Check**: `movimientos_financieros sum(abonos) >= contratos.valor_total`

### Impacto

- **Data Corruption**: Invalid estados reachable; downstream workflows assume prereqs met
- **Orphaned Records**: Production orders with no items; contracts with zero value
- **Operational Confusion**: Kanban shows estado='produccion' but no items to work on
- **Financial Tracking**: Payment workflows stuck (only abono #1 has a zap; #2 & #3 don't exist)
- **Compliance Risk**: No audit trail of invalid transitions

### Propuesta de Fix

#### Step 1: Create `zap_validar_transicion_estado_proyectos`
```javascript
// Execute BEFORE any proyecto.estado write
function zap_validar_transicion_estado(proyectoId, targetEstado) {
  const proyecto = api.query('proyectos').find(p => p.id === proyectoId)
  const currentEstado = proyecto.estado
  
  // State machine: define valid transitions
  const validTransitions = {
    'Prospecto': ['Cotizando', 'Cancelado'],
    'Cotizando': ['Aprobado', 'Cancelado'],
    'Aprobado': ['Producción', 'Cancelado'],
    'Producción': ['Entregado', 'Cancelado'],
    'Entregado': ['Garantía'],
    'Cancelado': []
  }
  
  if (!validTransitions[currentEstado]?.includes(targetEstado)) {
    api.notify.error(`Invalid transition: ${currentEstado} → ${targetEstado}`)
    return false
  }
  
  // Check prereqs per transition
  switch (targetEstado) {
    case 'Aprobado': // contract generation
      const variants = api.query('espacio_variantes')
        .filter(ev => ev.proyecto_id === proyectoId && ev.activa)
      if (variants.length === 0) {
        api.notify.error('Must have at least one active space variant')
        return false
      }
      const items = api.query('items_variante')
        .filter(iv => variants.map(v => v.id).includes(iv.variante_id))
      if (items.length === 0 || items.every(i => !i.cantidad)) {
        api.notify.error('Space must have items with quantity > 0')
        return false
      }
      break
      
    case 'Producción': // first payment received
      const contracts = api.query('contratos')
        .filter(c => c.proyecto_id === proyectoId)
      if (!contracts.some(c => c.estado === 'firmado')) {
        api.notify.error('Must have a signed contract')
        return false
      }
      if (!contracts.some(c => c.valor_total > 0)) {
        api.notify.error('Contract must have non-zero total value')
        return false
      }
      const abonos = api.query('abonos_contrato')
        .filter(a => contracts.map(c => c.id).includes(a.contrato_id) && a.numero_abono === '1')
      if (abonos.length === 0) {
        api.notify.error('First payment (abono 1) must be received')
        return false
      }
      break
  }
  
  return true
}
```

#### Step 2: Call validation BEFORE any transition
In `ComercialCard.tsx` → drag-drop handler:
```typescript
const handleStateChange = async (targetStage) => {
  const isValid = await api.executeZap('zap_validar_transicion_estado_proyectos', {
    proyectoId: proyecto.id,
    targetEstado: targetStage
  })
  if (!isValid) return // UI stays in place
  
  // Proceed with state change
  proyecto.estado = targetStage
  await api.mutation('proyectos', proyecto.id, proyecto)
}
```

#### Step 3: Add missing payment workflow zaps
```javascript
// For abono #2 (second payment)
function zap_registrar_abono_2() {
  if (numero_abono === '2') {
    api.notify.success('Second payment received')
    // Could trigger manufacturing inspection or shipping prep
  }
}

// For abono #3 (final payment)
function zap_registrar_abono_3() {
  if (numero_abono === '3') {
    // Sum all abonos; move contrato to "pagado"
    const contrato = api.query('contratos').find(c => c.id === contrato_id)
    const totalPaid = api.query('abonos_contrato')
      .filter(a => a.contrato_id === contrato_id)
      .reduce((sum, a) => sum + a.valor_abono, 0)
    
    if (totalPaid >= contrato.valor_total) {
      contrato.estado = 'pagado'
      api.mutation('contratos', contrato.id, contrato)
      api.notify.success('Contract fully paid')
    }
  }
}
```

#### Step 4: Schema changes
- Add `abonos_contrato.estado` field (enum: 'pending', 'received', 'applied')
- Add `abonos_contrato.fecha_recibida` timestamp

### Aceptación Criteria

- [ ] `zap_validar_transicion_estado_proyectos` exists and guards all 4 state machine transitions
- [ ] `ComercialCard.tsx` calls validation zap before any drag-drop estado change
- [ ] `zap_registrar_abono_2` and `zap_registrar_abono_3` exist in scripts.json
- [ ] All zaps (`generar_contrato`, `registrar_abono_*`) call validation pre-write
- [ ] Schema: `abonos_contrato.estado` field added with enum
- [ ] E2E test: Try to move proyecto to "Producción" without payment → blocked with error
- [ ] E2E test: Move through full flow with all prereqs → succeeds

---

## GAP #3: LABOR RATES MISSING & SILENT FAILURE (🟠 HIGH)

### Identidad
- **Subsistema**: Cotización
- **Severidad**: HIGH
- **Estado**: Known; workaround in place but fragile
- **Impacto**: MEDIO (PDF export globally blocked if rates missing)

### Descripción del Problema

El zap `exportar_propuesta_pdf` calcula mano de obra leyendo tarifas desde SKUs maestros en `productos_catalogo`:

```javascript
// exportar_propuesta_pdf (scripts.json:6, línea ~40-45)
const devService = productosCatalogo.find(p => p.sku === "SERV-DEV")
const assemblyService = productosCatalogo.find(p => p.sku === "SERV-ASSEMBLY")
const installService = productosCatalogo.find(p => p.sku === "SERV-INSTALL")

if (!devService || !assemblyService || !installService) {
  api.notify.error("Error estructural: No se encontraron las tarifas de Mano de Obra...")
  return // ⚠️ PDF export BLOCKED
}

const RATE_DEV = Number(devService.precio_publico || devService.precio_directo) || 185000
```

**Problemas**:

1. **Schema has no constraint**: `productos_catalogo.sku` is optional (not required)
   - Admin can delete "SERV-DEV" product for cleanup
   - No schema rule prevents this
   - No init zap ensures these SKUs exist

2. **Silent failure**: When SKUs missing:
   - User clicks "Export PDF"
   - Zap runs, finds no SKUs, shows generic error
   - User clicks retry → same error, stuck
   - No audit trail of what happened
   - No auto-recovery

3. **No fallback rates**: Zap assumes `precio_publico` and `precio_directo` are filled
   - If product exists but price is null → falls back to hardcoded 185000
   - Inconsistent with actual labor rates
   - No business logic to decide which price to use

4. **Implicit field semantics**: `espacio_variantes.visible_pdf` is optional boolean
   - Zap filters `ev.visible_pdf !== false`
   - If `visible_pdf = null` → included by accident
   - Should be explicit `true` or `false`, not nullable

### Ubicación en Código

| Archivo | Línea | Problema |
|---------|-------|----------|
| `storage/db/schema_definitions.json` | línea ~1450 (productos_catalogo.sku) | Field is optional; no constraint |
| `storage/db/scripts.json` | línea ~40-45 (exportar_propuesta_pdf) | No validation that SKUs exist |
| `storage/db/scripts.json` | línea ~75 (visible_pdf filter) | Nullable field used in business logic |
| `src/components/specialized/cotizador/CotizadorPro.tsx` | N/A | No pre-flight check before calling export zap |
| **MISSING** | N/A | No init zap to guarantee SERV-* SKUs on startup |

### Cadena de Fallos

1. **Admin** runs cleanup: "Remove unused products"
2. **Admin** deletes "SERV-DEV" product (mistake or legitimate cleanup)
3. **Comercial user** tries to export PDF for proyecto
4. **Zap** finds no SERV-DEV, error: "No se encontraron las tarifas"
5. **User** sees error, clicks retry multiple times
6. **System**: No way to recover; PDF export globally blocked
7. **Business Impact**: Proyectos stuck; can't send proposals to clients

### Impacto

- 🔴 **Single point of failure**: One missing SKU blocks all PDF exports
- 🔴 **No recovery path**: No auto-create or fallback mechanism
- 🟠 **Data quality issue**: visible_pdf null ambiguity
- 🟠 **Poor UX**: Generic error message; user doesn't know how to fix

### Propuesta de Fix

#### Step 1: Add schema constraints
Update `productos_catalogo` schema:
```json
{
  "key": "sku",
  "type": "text",
  "required": false,
  "label": "SKU (Product Code)"
  // If this product is a labor service, SKU must start with "SERV-"
}
```

Add enum constraint on special SKUs:
```json
{
  "key": "precio_publico",
  "type": "number",
  "required": false,
  "condition": "if sku in ['SERV-DEV', 'SERV-ASSEMBLY', 'SERV-INSTALL'] then required"
}
```

#### Step 2: Create init zap
```javascript
function zap_ensure_labor_rates() {
  const required = [
    { sku: 'SERV-DEV', nombre: 'Desarrollo Técnico', tasa: 185000 },
    { sku: 'SERV-ASSEMBLY', nombre: 'Ensamblaje', tasa: 185000 },
    { sku: 'SERV-INSTALL', nombre: 'Instalación', tasa: 185000 }
  ]
  
  for (const req of required) {
    const exists = api.query('productos_catalogo')
      .find(p => p.sku === req.sku)
    
    if (!exists) {
      api.mutation('productos_catalogo', null, {
        sku: req.sku,
        nombre: req.nombre,
        precio_publico: req.tasa,
        precio_directo: req.tasa,
        unidad_medida: 'dia'
      })
      api.notify.info(`Created missing labor rate SKU: ${req.sku}`)
    }
  }
}
```

Call this zap on app startup or via CLI:
```bash
agno adapter labor-rates bootstrap
```

#### Step 3: Update exportar_propuesta_pdf zap with fallback
```javascript
function exportar_propuesta_pdf(payload) {
  const defaultRates = {
    'SERV-DEV': 185000,
    'SERV-ASSEMBLY': 185000,
    'SERV-INSTALL': 185000
  }
  
  const devService = productosCatalogo.find(p => p.sku === 'SERV-DEV')
  const RATE_DEV = devService?.precio_publico ?? defaultRates['SERV-DEV']
  
  // Log warning if using fallback
  if (!devService) {
    api.notify.warning(
      `Labor rate "SERV-DEV" not found in catalog. Using default: $${RATE_DEV}`
    )
  }
  
  // Continue with export using RATE_DEV (either from catalog or fallback)
  // ...
}
```

#### Step 4: Fix visible_pdf field
Update `espacio_variantes.visible_pdf` schema:
```json
{
  "key": "visible_pdf",
  "type": "boolean",
  "required": false,
  "default": true,  // explicit default
  "label": "Visible en PDF de Cotización"
}
```

Update zap filter:
```javascript
const mySpaces = espacioVariantes
  .filter(ev => ev.proyecto_id === activeCotizacion.id && ev.visible_pdf !== false)
  // BEFORE: includes null/undefined
  
  // AFTER:
  .filter(ev => ev.proyecto_id === activeCotizacion.id && (ev.visible_pdf ?? true))
  // Treats null/undefined as true
```

Or validate on write:
```javascript
const formData = {
  ...ev,
  visible_pdf: ev.visible_pdf === true // Force to boolean
}
```

### Aceptación Criteria

- [ ] `zap_ensure_labor_rates` exists and can be called from CLI
- [ ] App startup calls `zap_ensure_labor_rates` (or it's part of bootstrap)
- [ ] Schema: `productos_catalogo` has explicit constraint that SERV-* SKUs required
- [ ] Zap: `exportar_propuesta_pdf` uses fallback rates with warning log if missing
- [ ] Schema: `espacio_variantes.visible_pdf` has explicit default = true
- [ ] E2E test: Delete SERV-DEV product → PDF export still works with fallback + warning
- [ ] E2E test: Modify visible_pdf to null → space still appears in PDF (uses default)

---

## GAP #4: PRODUCTION TASK CONTEXT ORPHANED (🟡 MEDIUM)

### Identidad
- **Subsistema**: Producción
- **Severidad**: MEDIUM
- **Estado**: Detected; operational impact confirmed
- **Impacto**: Visibility loss, wrong prioritization

### Descripción del Problema

Cuando un operario abre el kanban de producción, ve una tarjeta de tarea:

```
┌─────────────────────┐
│ Tarea: Ensamble marcos │
│                     │
│ (No client name)    │
│ (No project)        │
│ (No space)          │
│                     │
│ Status: In Progress │
└─────────────────────┘
```

El problema: `tareas_produccion` schema tiene relación a `espacio_variantes` pero:
1. Componente no la carga
2. No hay `proyecto_id` directo para rápido acceso al context
3. La cadena `tarea → orden → proyecto → cliente` existe pero no se hidrata

**Schema**:
```json
// tareas_produccion schema
{
  "name": "tareas_produccion",
  "fields": [
    { "key": "orden_trabajo_id", "type": "relation", "entity": "ordenes_trabajo" },
    { "key": "espacio_variante_id", "type": "relation", "entity": "espacio_variantes" },
    // ❌ MISSING: { "key": "proyecto_id", "type": "relation", "entity": "proyectos" }
    { "key": "descripcion", "type": "text" },
    { "key": "estado", "type": "select", "options": [...] }
  ]
}
```

**Component Logic** (`src/components/specialized/kanban/ProductionKanban.tsx:40-50`):
```typescript
const { data: allTasks } = useRelationData('tareas_produccion')
const { data: allProjects } = useRelationData('proyectos')

// BUG: No load of ordenes_trabajo or espacio_variantes
// BUG: allTasks has tarea.orden_trabajo_id but orden is NOT hydrated

const filteredTasks = allTasks.map(tarea => ({
  ...tarea,
  // ❌ tarea.orden is undefined → can't access orden.proyecto_id
  // ❌ Can't get cliente name, project name, space details
}))
```

**Result**: Task card displays incomplete info → operario confused about priority, project, or client.

### Ubicación en Código

| Archivo | Línea | Problema |
|---------|-------|----------|
| `storage/db/schema_definitions.json` | ~1022-1108 | tareas_produccion missing proyecto_id field |
| `src/components/specialized/kanban/ProductionKanban.tsx` | ~42-44 | Loads tareas_produccion pero no ordenes_trabajo |
| `src/components/specialized/kanban/ProductionCard.tsx` | ~10-30 | Tries to display proyecto name but data is undefined |

### Impacto

- 📉 **Operational Visibility**: Operarios can't see which project/client each task belongs to
- 📉 **Wrong Prioritization**: No info to decide which task is more urgent
- 📉 **Quality Control**: No traceability from task → project → client
- 🔴 **Data Integrity**: Orphaned task records with no project context

### Propuesta de Fix

#### Step 1: Add `proyecto_id` to tareas_produccion schema
```json
{
  "id": "tarea_proyecto_fk",
  "key": "proyecto_id",
  "type": "relation",
  "label": "Proyecto Relacionado",
  "config": {
    "relation": {
      "entity": "proyectos",
      "parent_key": "id"
    }
  },
  "required": false,
  "section": "Contexto"
}
```

#### Step 2: Populate proyecto_id when creating tarea
When `zap_generar_orden_compra` or `zap_crear_orden_trabajo` creates `tareas_produccion`:
```javascript
const tarea = {
  orden_trabajo_id: orden.id,
  proyecto_id: orden.proyecto_id, // ← Pass through
  espacio_variante_id: orden.espacio_variante_id,
  descripcion: `Ensamblaje ${espacio.nombre_espacio}`
}
```

#### Step 3: Update ProductionKanban component
```typescript
const { data: allTasks } = useRelationData('tareas_produccion')
const { data: allOrders } = useRelationData('ordenes_trabajo')
const { data: allProjects } = useRelationData('proyectos')
const { data: allSpaces } = useRelationData('espacio_variantes')
const { data: allClients } = useRelationData('clientes')

const hydratedTasks = allTasks.map(tarea => {
  const orden = allOrders.find(o => o.id === tarea.orden_trabajo_id)
  const proyecto = allProjects.find(p => p.id === tarea.proyecto_id || orden?.proyecto_id)
  const cliente = allClients.find(c => c.id === proyecto?.cliente_id)
  const espacio = allSpaces.find(es => es.id === tarea.espacio_variante_id)
  
  return {
    ...tarea,
    // Hydrated context
    projectName: proyecto?.nombre_proyecto,
    clientName: cliente?.nombre,
    spaceName: espacio?.nombre_espacio,
    // For sorting/filtering
    clientId: cliente?.id,
    projectId: proyecto?.id
  }
})
```

#### Step 4: Update ProductionCard to render context
```typescript
export function ProductionCard({ tarea }) {
  return (
    <Card>
      <CardHeader>
        <div>{tarea.descripcion}</div>
        <div className="text-sm text-gray-600">
          {tarea.clientName || '—'} / {tarea.projectName || '—'}
        </div>
      </CardHeader>
      <CardBody>
        <Badge>{tarea.spaceName}</Badge>
        <Status>{tarea.estado}</Status>
      </CardBody>
    </Card>
  )
}
```

### Aceptación Criteria

- [ ] Schema: `tareas_produccion.proyecto_id` field added as FK to proyectos
- [ ] Zaps creating tareas populate proyecto_id (either direct or from orden.proyecto_id)
- [ ] ProductionKanban hydrates all related records (ordenes, proyectos, clientes, espacios)
- [ ] ProductionCard displays: client name, project name, space name
- [ ] E2E test: Create tarea → kanban renders full context (not orphaned)
- [ ] E2E test: Filter/sort tareas by client → works correctly

---

## GAP #5: PARTIAL PAYMENT UNHANDLED (🟡 MEDIUM)

### Identidad
- **Subsistema**: Finanzas
- **Severidad**: MEDIUM
- **Estado**: Partially implemented (only abono #1 has workflow)
- **Impacto**: Payment state stuck; production delays

### Descripción del Problema

El flujo de pagos espera 3 abonos (pagos) en secuencia:
1. **Abono 1** (50%): Anticipo → triggers project production
2. **Abono 2** (25%): Mid-project → triggers installation prep
3. **Abono 3** (25%): Final → completes project

**Realidad actual**:
- ✅ Abono #1 tiene zap `zap_registrar_abono_y_activar` que mueve proyecto a "produccion"
- ❌ Abono #2 NO tiene zap; workflow frozen
- ❌ Abono #3 NO tiene zap; workflow frozen
- ❌ `abonos_contrato.estado` field missing (can't track payment state: pending/received/applied)
- ❌ No validation that `sum(abonos.valor_abono) >= contratos.valor_total`
- ❌ `contratos.estado` never moves from "firmado" to "pagado"

**Scenario**:
1. Client signs contract (50% due first)
2. Client pays first payment → zap triggers, proyecto moves to "produccion"
3. Taller starts work, orders supplies, installs in-progress
4. Client **doesn't pay** abono #2 → Nothing happens
5. Taller waits for clarity; proyecto stuck in "instalacion"
6. No alert, no escalation; no zap to remind about payment #2
7. Production cost grows; client satisfaction drops

### Ubicación en Código

| Archivo | Línea | Problema |
|---------|-------|----------|
| `storage/db/schema_definitions.json` | ~1304-1383 | abonos_contrato missing estado field |
| `storage/db/scripts.json` | ~63-65 | zap_registrar_abono_y_activar only handles numero_abono === '1' |
| **MISSING** | N/A | No zap for numero_abono === '2' |
| **MISSING** | N/A | No zap for numero_abono === '3' |
| **MISSING** | N/A | No zap to validate total paid >= contract total |
| **MISSING** | N/A | No zap to move contrato from "firmado" to "pagado" |

### Impacto

- 🔴 **Workflow Stuck**: Proyecto in "produccion" but can't proceed without payment #2
- 🟠 **No Visibility**: Admin can't see which projects are awaiting payment
- 🟠 **Partial Payment Untracked**: No way to know "paid so far: $50k of $100k"
- 🟠 **No Escalation**: Late payments undetected; no reminders

### Propuesta de Fix

#### Step 1: Add `estado` field to abonos_contrato
```json
{
  "id": "abono_estado",
  "key": "estado",
  "type": "select",
  "label": "Estado del Abono",
  "options": ["pendiente", "recibido", "aplicado"],
  "default": "pendiente",
  "required": false,
  "section": "Estado"
}
```

#### Step 2: Create zap for abono #2
```javascript
function zap_registrar_abono_2(payload) {
  const { abono_id, contrato_id } = payload
  
  const abono = api.query('abonos_contrato').find(a => a.id === abono_id)
  if (!abono || abono.numero_abono !== '2') return
  
  abono.estado = 'recibido'
  abono.fecha_recibida = new Date()
  api.mutation('abonos_contrato', abono_id, abono)
  
  // Trigger installation preparation (example)
  const contrato = api.query('contratos').find(c => c.id === contrato_id)
  const proyecto = api.query('proyectos').find(p => p.id === contrato.proyecto_id)
  
  api.notify.info(`Abono 2 recibido para proyecto ${proyecto.nombre_proyecto}. Preparando instalación.`)
  
  // Could trigger: set up shipping, notify installers, etc.
}
```

#### Step 3: Create zap for abono #3 + payment completion
```javascript
function zap_registrar_abono_3(payload) {
  const { abono_id, contrato_id } = payload
  
  const abono = api.query('abonos_contrato').find(a => a.id === abono_id)
  if (!abono || abono.numero_abono !== '3') return
  
  abono.estado = 'recibido'
  abono.fecha_recibida = new Date()
  api.mutation('abonos_contrato', abono_id, abono)
  
  // Validate total paid >= contract total
  const contrato = api.query('contratos').find(c => c.id === contrato_id)
  const allAbonos = api.query('abonos_contrato')
    .filter(a => a.contrato_id === contrato_id)
  
  const totalPaid = allAbonos
    .filter(a => a.estado === 'recibido')
    .reduce((sum, a) => sum + a.valor_abono, 0)
  
  if (totalPaid >= contrato.valor_total) {
    // Contract fully paid
    contrato.estado = 'pagado'
    api.mutation('contratos', contrato_id, contrato)
    
    const proyecto = api.query('proyectos').find(p => p.id === contrato.proyecto_id)
    api.notify.success(`Contrato ${proyecto.nombre_proyecto} totalmente pagado. ¡Instalación final autorizada!`)
    
    // Could trigger: mark ready for final installation, close project timeline, etc.
  } else {
    api.notify.warning(`Abono 3 recibido pero pendiente ${contrato.valor_total - totalPaid} en otros abonos`)
  }
}
```

#### Step 4: Create payment validation zap
```javascript
function zap_validar_pagos_proyecto(proyectoId) {
  const proyecto = api.query('proyectos').find(p => p.id === proyectoId)
  const contratos = api.query('contratos')
    .filter(c => c.proyecto_id === proyectoId && c.estado !== 'cancelado')
  
  for (const contrato of contratos) {
    const abonos = api.query('abonos_contrato')
      .filter(a => a.contrato_id === contrato.id)
    
    const totalPaid = abonos
      .filter(a => a.estado === 'recibido')
      .reduce((sum, a) => sum + a.valor_abono, 0)
    
    const pending = contrato.valor_total - totalPaid
    
    if (pending > 0) {
      api.notify.warning(`[${proyecto.nombre_proyecto}] Pendiente: $${pending.toLocaleString()}`)
      
      // Could trigger: send email reminder to client, log to admin dashboard, etc.
    }
  }
}
```

#### Step 5: Register zaps in system
Add to `scripts.json`:
- `zap_registrar_abono_2` with trigger: `cuando numero_abono == '2'`
- `zap_registrar_abono_3` with trigger: `cuando numero_abono == '3'`
- `zap_validar_pagos_proyecto` with scheduled trigger: `daily`

### Aceptación Criteria

- [ ] Schema: `abonos_contrato.estado` field added with enum [pendiente, recibido, aplicado]
- [ ] Zap: `zap_registrar_abono_2` exists and triggers when numero_abono = '2'
- [ ] Zap: `zap_registrar_abono_3` exists and triggers when numero_abono = '3'
- [ ] Zap: `zap_validar_pagos_proyecto` exists for daily payment validation
- [ ] Zap: When all abonos recibidos, `contratos.estado` moved to "pagado"
- [ ] E2E test: Register abono #1 → proyecto moves to "produccion"
- [ ] E2E test: Register abono #2 → system acknowledges mid-project payment
- [ ] E2E test: Register abono #3 → contrato moves to "pagado"; installation authorized
- [ ] E2E test: Validate total paid < total due → warning notification

---

## MATRIZ DE PRIORIDAD Y PROPIETARIO

| Gap # | Subsistema | Severidad | Tipo de Fix | Owner | Blocker? | Est. Hours |
|-------|-----------|-----------|------------|-------|----------|-----------|
| 1 | Comercial | 🔴 CRITICAL | Schema enum align | Dev | 🔴 YES | 4-6 |
| 2 | Comercial+Prod | 🟠 HIGH | 3 new zaps + state machine | Dev | 🟠 MAYBE | 8-12 |
| 3 | Cotización | 🟠 HIGH | Init zap + fallback + schema | Dev | 🟠 MAYBE | 4-6 |
| 4 | Producción | 🟡 MEDIUM | Schema field + component hydrate | Dev | ❌ NO | 3-4 |
| 5 | Finanzas | 🟡 MEDIUM | 3 new zaps + schema field | Dev | ❌ NO | 6-8 |

**Total estimated**: 25-36 engineering hours

**Critical Path**:
1. Fix Gap #1 (CRITICAL) → unblock UI state consistency
2. Fix Gap #2 (HIGH) → enforce workflow rules
3. Fix Gap #3 (HIGH) → ensure PDF exports resilient
4. Fix Gaps #4, #5 in parallel (MEDIUM) → operational visibility improvements

---

## PROXIMOS PASOS

### Immediate (Sesión Actual)
- ✅ Document all 5 gaps in audit (THIS DOCUMENT)
- ⏳ Register audit in `storage/progreso/current_state.md`
- ⏳ Create hexagonal documentation structure (Phase 2-6 del plan)

### Próxima Sesión (Implementación)
- [ ] Implement Gap #1 fix (schema enum align)
- [ ] Implement Gap #2 fix (transition validation zaps)
- [ ] Implement Gap #3 fix (labor rates fallback)
- [ ] Implement Gaps #4, #5 in parallel
- [ ] Run full E2E tests for each gap

### Sesión Post-Implementación
- [ ] Code review all gap fixes
- [ ] Update architecture snapshots (`agno docs all`)
- [ ] Test full Lead → Quote → Production → Payment flow end-to-end
- [ ] Update subsystem documentation with fixed state

---

## REFERENCIAS

- **Audit Source Documents**:
  - `src/adapters/AUDITORIA_HOMEOSTASIS_2026-07-03.md` (adapter subsystem audit)
  - `src/adapters/current_state.md` (adapter pipeline state)

- **Architecture Snapshots**:
  - `storage/docs/arbol_de_schemas.md`
  - `storage/docs/arbol_de_zaps.md`
  - `storage/docs/arbol_de_modulos.md`

- **Design References**:
  - `storage/fork_doc/DISENO_DETALLE_MODULO_PRODUCCION.md`
  - `storage/fork_doc/DISENO_DETALLE_MODULO_COTIZADOR.md`

- **Plan**:
  - `storage/progreso/REFACTORIZACION_HEXAGONAL_LOG.md` (execution log)
  - `~/.claude/plans/sparkling-cuddling-glacier.md` (implementation plan)

---

**Documento preparado por**: Arquitecto de Harnes (Fable 5 + Exploration Agents)  
**Fecha de documento**: 2026-07-04  
**Estado**: Ready for review & implementation planning
