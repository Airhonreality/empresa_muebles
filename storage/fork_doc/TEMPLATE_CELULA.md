# Template: Cell {Name}

Copy this file to `SUBSISTEMA_0X_/CELLS/Cell_0N_{Name}.md` and fill in all sections.

---

## 1. Identity

- **Cell Name**: {Name}
- **Subsystem**: {Parent subsystem}
- **Route**: `/path/to/cell`
- **Component File**: `src/components/specialized/{subsystem}/{file}.tsx`
- **Primary Context Schema**: `{schema_name}` (entity this cell primarily operates on)
- **Data Type**: (CRUD interface, Dashboard, Workflow canvas, etc.)

---

## 2. Business Purpose

**User Story**:
"As a {role}, I want to {action}, so that {outcome}."

**Success Criteria**:
- [ ] User can {criterion 1}
- [ ] System {criterion 2}
- [ ] {Criterion 3}

---

## 3. Data Model

**Schemas Used**:
- `{schema_a}` (primary) — {purpose}
- `{schema_b}` (relation) — {how related}
- `{schema_c}` (reference) — {how referenced}

**Enum Fields** (valid values):
- `{schema_a}.{field}` → `['value1', 'value2', ...]`

**Data Flow**:
```
Input: {schema_a} record from URL param or parent
  ↓
Processing: {zap_name} or component logic
  ↓
Output: Updated {schema_a} + side effects ({zap_names})
```

---

## 4. Orchestration (Zaps)

| Zap | Trigger | Payload | Effect |
|-----|---------|---------|--------|
| `zap_{verb}_{noun}` | When user clicks {button}, submits {form} | `{ {field}: value }` | {schema} updated; {side_effect} |

**Zap Payload Interfaces**:
```typescript
interface ZapPayload {
  record: {
    id: string
    context: string
    data: {
      // ... fields from schema
    }
  }
}
```

---

## 5. UI Components

**Component Tree**:
```
{CellName}
├─ Header (title, action buttons)
├─ Filters / Controls (if applicable)
├─ Content Area
│  ├─ Table / Grid / Canvas
│  └─ Detail View (modal, panel, or inline)
└─ Footer (pagination, actions)
```

**Interaction Flows**:
```
[Load Cell]
  ↓
[Display {schema_a} data]
  ↓
[User selects record]
  ↓
[Show detail view / inline edit]
  ↓
[User submits change]
  ↓
[Call zap] → [Update schema] → [Refresh UI]
```

**State Management**:
- Active record: {schema_a} ID from URL or selection
- Filter state: {fields}
- Modal state: {fields}

---

## 6. Integration Points

**Dependencies on Other Cells**:
- {Cell_B.md} — We read data from {schema_x} which Cell_B owns

**Dependencies on Adapters**:
- {adapter_name} — We use it to {action}

**Backward Dependencies** (who depends on this cell):
- {Cell_C.md} — It reads our {schema_x} mutations

---

## 7. Testing & Deployment

**Acceptance Criteria** (E2E test scenarios):
- [ ] Load cell with {schema_a} record → displays all fields
- [ ] Click {action} button → modal opens with form
- [ ] Submit form → zap called → schema updated → list refreshed
- [ ] Error state: {error_condition} → shows error message with recovery option

**Known Issues & Workarounds**:
| Issue | Workaround | Status |
|-------|-----------|--------|
| {Description} | {Temporary workaround} | ⏳ Scheduled fix |

**Performance Notes**:
- Loads {schema_a} + relations → ~{N} records → {time}ms
- Filter/sort: client-side (first {N} records) or server-side?

---

## 8. Links

- **Subsystem**: [../README.md](../README.md)
- **Design Detail**: [../DISEÑO_DETALLE.md](../DISEÑO_DETALLE.md)
- **Architecture**: [../../ARQUITECTURA_HEXAGONAL.md](../../ARQUITECTURA_HEXAGONAL.md)

---

**Last Updated**: YYYY-MM-DD  
**Component Status**: Development / Stable / Maintenance  
**Maintained by**: {Developer}
