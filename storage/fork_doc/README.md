# Veta de Oro — Fork Master Context

**Project**: Veta de Oro (Agnostic Seed fork)  
**Business Domain**: High-end furniture design & manufacturing, Bogotá  
**Customer Segment**: Interior designers, architects, commercial projects (50k-500k COP per project)  
**ERP Scope**: Commercial web + operational ERP for manufacturing & project management

---

## Business Model

Veta de Oro operates two integrated layers:

1. **Customer-Facing Web**: Public e-commerce, portfolio showcase, lead capture funnel, consultation booking, SEO-optimized for organic discovery
2. **Internal ERP**: End-to-end project management from quote → production → installation → payment tracking

Revenue is project-based (design + manufacturing + installation). Timeline: 4-12 weeks per project. Payment model: 3 tranches (50% anticipo, 25% mid-project, 25% final).

---

## ERP Subsystems (Level 2: Hexagonal Model)

| Subsystem | Purpose | Key Roles | Entry Route |
|-----------|---------|-----------|------------|
| **Comercial** | Lead capture, quotation, contract management | Sales team, Designers | `/app/erp/comercial`, `/app/erp/cotizador` |
| **Producción** | Manufacturing workflow, task management, supply chain | Workshop, Logistics | `/app/erp/taller`, `/app/ficha/:id` |
| **Finanzas** | Payment tracking, accounting, bank reconciliation | Finance, Admin | `/app/erp/finanzas` |
| **Kronos** | Cross-departmental task scheduling and calendar | All departments | `/app/erp/calendar` |

Plus: **Administración** (user profiles, suppliers, catalog) and **Veta Pública** (customer portal, home, catalog).

---

## Strategic Goals

- ✅ **Centralize Operations**: Replace scattered spreadsheets with integrated ERP
- ✅ **Reduce Quote-to-Production Cycle**: Automate design → production handoff via zaps
- 🎯 **Real-Time Visibility**: Operarios see project context (client, space, deadlines); Admin sees cash flow
- 🎯 **Scalability**: Handle 2-3× current project volume without hiring
- 🎯 **Quality Automation**: Enforce state machine rules; prevent invalid orders entering production

---

## Technical Stack

- **Engine**: Agnostic Seed (schema-driven UI + serverless zap orchestration)
- **Storage**: Local JSON (development) or Supabase/GitHub (production)
- **Frontend**: React + Next.js + specialized components per subsystem
- **Integrations**: Adapters for Notion (CMS), Whatsapp (messaging), Wompi (payments), Llm (content)

---

## Success Metrics (for ERP)

1. **Process Efficiency**: Quote generation < 2 hours (was 1-2 days)
2. **On-Time Delivery**: 95% of projects meet installation deadline
3. **Cash Flow Predictability**: Automated abono tracking; zero overdue payments
4. **Operational Visibility**: Operarios see full project context within 30 seconds of opening task

---

## Documentation Structure

This fork follows a **Hexagonal Architecture** model for documentation:

```
Fork (Business Context)
  ├─ Subsystems (Business Functions: Comercial, Producción, Finanzas, Kronos)
  │   ├─ Cells (Operational Modules: Quoter, Kanban, etc.)
  │   └─ Zaps (Workflow Automation)
  └─ Shared (Adapters, Conventions, Cross-System Flows)
```

**Key Documents**:
- `ARQUITECTURA_HEXAGONAL.md` — Model explanation with examples
- `FLUJOS_TRANSVERSALES.md` — Happy path (Lead → Quote → Production → Payment)
- `SUBSISTEMA_0X_*/README.md` — Subsystem-level specs with traceability matrices
- `TEMPLATE_SUBSISTEMA.md`, `TEMPLATE_CELULA.md` — Reusable design templates

---

## Architecture Snapshots

Auto-generated architectural reference (updated via `agno docs all`):
- `storage/docs/arbol_de_schemas.md` — Entity relationship overview
- `storage/docs/arbol_de_zaps.md` — Workflow automation inventory
- `storage/docs/arbol_de_rutas.md` — Navigation & route structure
- `storage/docs/arbol_de_modulos.md` — Component inventory

---

## Governance

- **Source of Truth for Schemas**: `storage/db/schema_definitions.json`
- **Source of Truth for Workflows**: `storage/db/scripts.json` (zaps)
- **Source of Truth for Routes**: `storage/db/page_routes.json`
- **Fork Harness**: `storage/AGENTS.md` + `storage/progreso/INDEX.md`

**Coherence Rule**: `block.context === schema.data.name === data_file_name_without_json` (from CLAUDE.md)

---

## Quick Links

- **Business Context**: This file (README.md)
- **Architecture Model**: `ARQUITECTURA_HEXAGONAL.md`
- **Main Workflows**: `FLUJOS_TRANSVERSALES.md`
- **Project Goals**: `MANIFEST GOAL.MD`
- **Subsystems**:
  - `SUBSISTEMA_01_COMERCIAL_SALES/`
  - `SUBSISTEMA_02_PRODUCCION_MANUFACTURING/`
  - `SUBSISTEMA_03_FINANZAS_ACCOUNTING/`
  - `SUBSISTEMA_04_KRONOS_CALENDAR/`
- **Design Templates**: `TEMPLATE_SUBSISTEMA.md`, `TEMPLATE_CELULA.md`

---

**Maintained by**: Architects & Development Team  
**Last Updated**: 2026-07-04  
**Model**: Hexagonal Architecture (Fork > Subsystems > Cells > Shared)
