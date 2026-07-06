# Template: Subsistema {Name}

Copy this file to `SUBSISTEMA_0X_{NAME}/README.md` and fill in all sections.

---

## 1. Business Purpose

**Subsystem Name**: {Name}  
**Owned by**: {Team/Role}  
**Entry Routes**: {List of routes}

**In 2-3 sentences, explain what problem this subsystem solves for the business.**

Example: "Comercial subsystem manages the entire sales lifecycle from lead capture through contract negotiation and signature. It enables sales team to quickly quote projects, track prospect engagement, and generate professional proposals that feed into the production pipeline."

---

## 2. Key Schemas & Data Model

**Owned Schemas** (this subsystem is the source of truth):
- `{schema_name}` — {purpose}
- `{schema_name}` — {purpose}

**Referenced Schemas** (owned by other subsystems):
- `{schema_name}` (from {subsystem}) — {relationship}

**Relationships** (diagram or narrative):
```
{schema_a} ←→ {schema_b}
├─ {schema_c}
└─ {schema_d} ←→ {schema_e}
```

---

## 3. Main Workflows (Zaps)

| Zap Name | Trigger | Inputs | Outputs | Status |
|----------|---------|--------|---------|--------|
| `zap_{verb}_{noun}` | When {condition} | {schema.field} | {schema.field} updated | ✅/⏳/❌ |

---

## 4. Routes & Navigation

| Route | Title | Purpose | Component |
|-------|-------|---------|-----------|
| `/app/erp/{subsystem}/{entity}` | {Title} | {Purpose} | {Component.tsx} |

---

## 5. Cells (Operational Modules)

**Cells** are reusable UI modules within this subsystem. Each cell solves one user problem.

| Cell | Route | Context Schema | Purpose |
|------|-------|---|---------|
| [Cell_01_Name](CELLS/Cell_01_Name.md) | `/path` | `schema_a` | {Purpose} |

---

## 6. Traceability Matrix

**Business Requirement → Technical Implementation**

| Requirement | Schemas | Zaps | Routes | Status | Notes |
|---|---|---|---|---|---|
| {Requirement} | {schemas} | {zaps} | {routes} | ✅/⏳/❌ | {Any blockers?} |

---

## 7. Dependencies on Other Subsystems

| Dependency | Type | How Used |
|---|---|---|
| `{subsystem_name}` → schema `{entity}` | Read/Write | When {workflow}, we read {entity} |
| `{subsystem_name}` → zap `{zap_name}` | Trigger | We call this zap after {event} |

---

## 8. Known Issues & Roadmap

| Issue | Severity | Workaround | Fix |
|-------|----------|-----------|-----|
| {Issue description} | 🔴/🟠/🟡 | {Current workaround} | Scheduled for {when} |

---

## 9. Links

- **Architecture Model**: `ARQUITECTURA_HEXAGONAL.md`
- **Design Details**: `DISEÑO_DETALLE.md` (in this folder)
- **Traceability Matrix**: `ESQUEMAS_ZAPS_TRACEABILITY.md` (in this folder)
- **Cells**: `CELLS/` folder
- **Audit**: `storage/progreso/AUDITORIA_HOMEOSTASIS_ERP_*.md`

---

**Last Updated**: YYYY-MM-DD  
**Maintained by**: {Team}
