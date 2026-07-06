# Modelo Hexagonal: Fork > Subsistemas > Células

**Aplicado a**: Veta de Oro ERP  
**Introducido**: 2026-07-04  
**Propósito**: Estructurar documentación y organizar coherencia sistémica en 4 niveles

---

## Concepto

La arquitectura hexagonal es un modelo de diseño que organiza un sistema complejo en capas concéntricas de responsabilidad:

```
┌─────────────────────────────────────────────────┐
│  NIVEL 0: FORK (Business Context)               │
│  Business model, strategic goals, governance    │
│  → storage/fork_doc/README.md                   │
│  → storage/fork_doc/ARQUITECTURA_HEXAGONAL.md  │
│  → storage/fork_doc/FLUJOS_TRANSVERSALES.md    │
└─────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────┐
│  NIVEL 1: SUBSISTEMAS (Business Functions)      │
│  Each subsystem: own schemas, zaps, cells       │
│  → storage/fork_doc/SUBSISTEMA_0X_{NAME}/      │
│     ├─ README.md                                │
│     ├─ DISEÑO_DETALLE.md                        │
│     ├─ ESQUEMAS_ZAPS_TRACEABILITY.md           │
│     └─ CELLS/                                   │
└─────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────┐
│  NIVEL 2: CÉLULAS (Operational Modules)         │
│  Reusable UI modules, each with spec template   │
│  → storage/fork_doc/SUBSISTEMA_0X_/CELLS/      │
│     Cell_01_XxxModule.md                        │
│     Cell_02_YyyComponent.md                     │
└─────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────┐
│  NIVEL 3: TRANSVERSAL (Cross-Cutting)           │
│  Adapters, naming conventions, error states     │
│  → storage/fork_doc/FLUJOS_TRANSVERSALES.md    │
│  → storage/fork_doc/ADAPTERS_INTEGRATION.md    │
│  → storage/fork_doc/CONVENCIONES_NOMBRADO.md   │
│  → storage/fork_doc/ERRORES_CONOCIDOS.md       │
└─────────────────────────────────────────────────┘
```

---

## NIVEL 0: FORK (Business Context)

**Purpose**: Answer "What is this project? Why does it exist? What are we trying to achieve?"

**Documents**:
- `README.md` — Business model, customer segment, revenue model, success metrics
- `ARQUITECTURA_HEXAGONAL.md` — This file; explain the layering model
- `FLUJOS_TRANSVERSALES.md` — Main workflows that span multiple subsystems

**Who reads this**: 
- New stakeholders, investors, decision-makers
- Architects planning new subsystems
- Anyone asking "what is the context for this ERP?"

---

## NIVEL 1: SUBSISTEMAS (Business Functions)

**Purpose**: Organize the system into independent business units. Each subsystem owns:
- A set of schemas (data model)
- A set of zaps (automation/workflows)
- A set of routes (UI entry points)
- A set of cells (operational modules)

**Example Subsystems** (Veta de Oro):
1. **COMERCIAL** (Sales): Lead capture, quotation, contracts
2. **PRODUCCIÓN** (Manufacturing): Work orders, tasks, supply management
3. **FINANZAS** (Accounting): Payments, movements, reconciliation
4. **KRONOS** (Scheduling): Calendar, tasks, deadlines

**Per Subsystem Structure**:
```
storage/fork_doc/SUBSISTEMA_01_COMERCIAL_SALES/
├── README.md                          # Overview + traceability matrix
├── DISEÑO_DETALLE.md                  # UI/UX specs, workflows, state diagrams
├── ESQUEMAS_ZAPS_TRACEABILITY.md     # Requirement → Schema/Zap/Route mapping
└── CELLS/                             # Operational modules
    ├── Cell_01_QuoterPro.md
    ├── Cell_02_CommercialKanban.md
    └── Cell_03_LeadFunnel.md
```

**README Contents**:
- Business purpose (2-3 sentences)
- Owned schemas (list with relationships)
- Main workflows (zap names + trigger conditions)
- Entry routes (paths and navigation)
- List of cells (UI modules)
- Dependencies on other subsystems
- Known issues / roadmap items
- Link to traceability matrix

**Traceability Matrix** (`ESQUEMAS_ZAPS_TRACEABILITY.md`):
```
| Business Requirement | Schemas | Zaps | Routes | Status |
|---|---|---|---|---|
| Quote calculation | proyectos, espacio_variantes, items_variante, productos_catalogo | generar_propuesta_pdf | /app/erp/cotizador | ✅ Implemented |
| Lead tracking | leads, clientes, configuracion_comercial | capturar_lead_embudo, actualizar_score_lead | / | ✅ Implemented |
| Contract management | contratos, abonos_contrato | generar_contrato, registrar_abono_* | /app/erp/comercial | ⚠️ Partial (abono #2,3 missing) |
```

**Who reads this**:
- Developers implementing features in this subsystem
- QA testing subsystem workflows
- Product managers understanding subsystem scope
- Auditors verifying requirement coverage

---

## NIVEL 2: CÉLULAS (Operational Modules)

**Purpose**: Document individual UI modules and their role. Each cell is a coherent piece of functionality that solves one user problem.

**Examples** (Veta de Oro):
- **Cell: QuoterPro** — Calculate quote for a project with variant comparison
- **Cell: CommercialKanban** — Visualize sales pipeline (Prospecto → Cotizando → Aprobado → Producción)
- **Cell: FichaProduccion** — View detailed manufacturing spec for one project
- **Cell: CalendarScheduler** — Multi-view task calendar (month/week/day/agenda)

**Per Cell Structure** (Template: `TEMPLATE_CELULA.md`):
```
# Cell: {Name}

## 1. Identity
- Subsystem: {parent}
- Route: {path}
- Component: {tsx file}
- Primary Context (schema): {entity}

## 2. Business Purpose
- Problem it solves (user story)
- Success criteria

## 3. Data Model
- Schemas involved (with relationships)
- Enum fields and valid values
- Data flow (input → processing → output)

## 4. Orchestration (Zaps)
- List of zaps triggered from this cell
- Zap payload shape (TypeScript interface)
- Trigger conditions

## 5. UI Components
- Component tree (TSX imports)
- Interaction flows (state diagram)
- Accessibility notes

## 6. Integration Points
- Dependencies on other cells
- External adapters used

## 7. Testing & Deployment
- Acceptance criteria
- Known issues and workarounds
```

**Who reads this**:
- Frontend developers building/maintaining this cell
- QA writing test scenarios for this module
- Anyone integrating with this cell from another subsystem

---

## NIVEL 3: TRANSVERSAL (Cross-Cutting)

**Purpose**: Document system-wide patterns, naming conventions, and cross-subsystem flows.

**Documents**:
- `FLUJOS_TRANSVERSALES.md` — Main workflows spanning multiple subsystems
  - Happy path: Lead → Quote → Contract → Production → Payment → Installation
  - Error paths: Cancellation, Rejection, Refund workflows
  - Data flows with zap triggers

- `ADAPTERS_INTEGRATION.md` — Map adapters to subsystems
  - Which subsystems use which adapters
  - What data flows through each adapter

- `CONVENCIONES_NOMBRADO.md` — Naming rules
  - Field naming (snake_case, prefixes for related entities)
  - Zap naming (zap_{verb}_{noun})
  - Route naming (/app/erp/{subsystem}/{entity})
  - Schema naming (plural, domain-meaningful)

- `ERRORES_CONOCIDOS_ROADMAP.md` — Known issues and backlog
  - Current gaps (from audit)
  - Workarounds (if temporary)
  - Scheduled fixes (with effort estimate)

**Who reads this**:
- Architects planning new subsystems (need naming consistency)
- Developers working across subsystems (need workflow understanding)
- Anyone asking "how do adapters fit in?"

---

## How to Use This Model

### When adding a new subsystem:
1. Copy `TEMPLATE_SUBSISTEMA.md` → new folder `SUBSISTEMA_0X_{NAME}/`
2. Fill in README (purpose, schemas, zaps, routes)
3. Create traceability matrix (requirement → implementation)
4. Document each cell (use `TEMPLATE_CELULA.md`)
5. Update NIVEL 3 docs (adapters, flows, conventions)

### When adding a new cell to an existing subsystem:
1. Copy `TEMPLATE_CELULA.md` → `SUBSISTEMA_0X_/CELLS/Cell_0N_{Name}.md`
2. Fill in identity, purpose, data model, zaps, UI components
3. Update subsystem README to link to new cell
4. Update traceability matrix if new schemas/zaps introduced

### When implementing a new workflow:
1. Identify which subsystem(s) it spans
2. Update `FLUJOS_TRANSVERSALES.md` if it crosses subsystems
3. Update zap documentation in affected subsystems
4. Update cell specs if UI behavior changes

---

## Coherence Checks

Use this hexagonal model to audit coherence:

**✅ Coherence Achieved If**:
1. Every schema in `schema_definitions.json` belongs to exactly one subsystem (from traceability matrix)
2. Every zap in `scripts.json` is documented in its subsystem's README + traceability matrix
3. Every route in `page_routes.json` maps to exactly one subsystem (metadata in route def)
4. Every cell has a documented business purpose and acceptance criteria
5. Cross-subsystem workflows are documented in `FLUJOS_TRANSVERSALES.md`
6. All naming (fields, zaps, routes) follows conventions in `CONVENCIONES_NOMBRADO.md`

**❌ Coherence Broken If**:
- A schema isn't assigned to any subsystem (orphaned)
- A zap isn't documented (hidden automation)
- A route doesn't map to a subsystem (navigation unclear)
- A cell exists but isn't linked from its subsystem
- Cross-subsystem workflows have no documented choreography
- Naming is inconsistent (some fields snake_case, others camelCase)

---

## Governance

- **Subsystem Changes**: Update subsystem README + traceability matrix
- **Schema Changes**: Update subsystem README + affected cell specs
- **Zap Changes**: Update subsystem README + affected cell specs
- **Cross-subsystem Changes**: Update `FLUJOS_TRANSVERSALES.md` + affected subsystem docs
- **New Adapters**: Update `ADAPTERS_INTEGRATION.md` + affected subsystems

All changes must maintain coherence: requirement → implementation must be traceable.

---

## Links

- **Level 0**: `README.md`, `FLUJOS_TRANSVERSALES.md`
- **Level 1**: `SUBSISTEMA_0X_{NAME}/` (4 subsystems)
- **Level 2**: `SUBSISTEMA_0X_/CELLS/` (12+ cells total)
- **Level 3**: `FLUJOS_TRANSVERSALES.md`, `ADAPTERS_INTEGRATION.md`, `CONVENCIONES_NOMBRADO.md`, `ERRORES_CONOCIDOS.md`
- **Templates**: `TEMPLATE_SUBSISTEMA.md`, `TEMPLATE_CELULA.md`

---

**Version**: 1.0  
**Approved**: 2026-07-04  
**Maintained by**: Architects & Development Team
