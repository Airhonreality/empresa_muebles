# Diseño de Pantalla P-03 — Detalle Cotización (Solo Lectura) (Veta de Oro)

**Fecha:** 2026-08-05
**Estado:** Propuesta para aprobación del Supervisor
**Dependencias:** P-04 aprobado, P-01/P-02 aprobados, decisiones C1-C4
**Artefactos base:** `disenio_p04_cotizador.md`, `disenio_p01_kanban_comercial.md`, `glosario_h07.md`

---

## 1. Visión General

P-03 es la **vista de solo lectura** del cotizador. Permite a roles `taller`, `finanzas`, `supervisora_qa`, `compras` (y `comercial`/`admin` en modo consulta) ver el detalle completo de una cotización **sin poder editar**.

**Estructura de página:** `/app/erp/cotizador/[proyectoId]/page.tsx` **misma ruta que P-04** — diferencia por query param `?readonly=true` o por rol del usuario.

**Patrón:** **Un solo componente `CotizadorPage`** que renderiza `CotizadorClient` con prop `readonly={true/false}`. Evita duplicación de código.

**Patrones técnicos (M-06 L1):**
- Mismos que P-04 pero **sin edición**: sin `useAutoSave`, sin `MoneyInput` editable, sin drag-drop, sin botones de acción de escritura.
- `useSmartSearch` (solo para navegación entre proyectos si se incluye header)
- `Suspense` + loading states
- Design tokens + primitivas `components/veta/` (Card, Badge, Table, Collapse, Button ghost)

---

## 2. Diferencias P-04 vs P-03 (Matriz)

| Componente / Función | P-04 (Editor) | P-03 (Solo Lectura) |
|---|---|---|
| **Header Proyecto** | Inputs editables + auto-save | **Display only** (texto formateado) |
| **Cliente** | HybridClientSelector | **Display**: nombre + teléfono + email |
| **Estado** | Select (transiciones válidas) | **Badge** estado actual (no editable) |
| **Configuración Taller** | Editable params físicos | **Read-only**: muestra params + tarifas calculadas |
| **Transiciones** | Read-only (igual) | **Read-only** (igual) |
| **EspacioCard** | 11 strips editables | **11 strips colapsables, solo lectura** |
| **ItemRow (Tabla)** | Editable (MoneyInput, cantidad, referencial) | **Display**: descripción, und, cant, precio, total, badges referencial |
| **Mano de Obra** | DayCounters editables | **Display**: jornadas + tarifas + subtotal |
| **Presupuesto Adicional** | Editable (toggle, fuente, grupo) | **Display**: agrupado por grupo, badge referencial |
| **Resumen Grand Totals** | Calculado en vivo | **Display** idéntico (mismo cálculo) |
| **ContratoModal** | Editable + generar | **Solo si existe contrato**: muestra datos + hitos (read-only) |
| **Acciones (Footer)** | Guardar, Generar Contrato, PDF, Activar Producción | **[Volver al Kanban]** + **[Abrir en Editor]** (si rol permite) |
| **Auto-save** | Sí (800ms) | **No** |
| **Drag-drop / Reorder** | Sí (espacios, variantes, items) | **No** |

---

## 3. Layout P-03 (Solo Lectura)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER (sticky)                                                             │
│ [← Volver]  Cotizador — Solo Lectura  |  Nombre Proyecto  |  [Abrir Editor]│
├──────────────────┬────────────────────────────────────────────┬─────────────┤
│                  │                                            │             │
│  SIDEBAR IZQ     │           ÁREA CENTRAL                     │  PANEL DER  │
│  (280px)         │           (flex-1, min-w-0)                │  (320px)    │
│                  │                                            │             │
│  ┌────────────┐  │  ┌──────────────────────────────────────┐  │  ┌────────┐ │
│  │ Header     │  │  │ EspacioCard 1 (Cocina) — READ ONLY   │  │  │ RESUMEN│ │
│  │ Proyecto   │  │  │ ┌─ Collapse: Descripción             │  │  │        │ │
│  │  (display) │  │  │ ┌─ Collapse: Variantes (tabs)        │  │  │ Mat.   │ │
│  │            │  │  │ │  [V1 Activa] [V2]  (solo labels)   │  │  │ MO     │ │
│  │ Cliente    │  │  │ │  ┌─ Collapse: Items (tabla)        │  │  │ SubT   │ │
│  │ Estado 🟡  │  │  │ │  │ ItemRow × N  (display only)     │  │  │ Costos │ │
│  │ Tipo       │  │  │ │  │ [NO + Item]                     │  │  │ Imprev │ │
│  │ Dir.Obra   │  │  │ │  └─ Collapse: Imágenes            │  │  │ Desc.  │ │
│  │            │  │  │ │  ┌─ Collapse: Notas               │  │  │ Ajuste │ │
│  ├────────────┤  │  │ │  ┌─ Collapse: Colores             │  │  │ IVA    │ │
│  │ Config     │  │  │ │  ┌─ Collapse: Mano de Obra        │  │  │ TOTAL  │ │
│  │ Taller (ro)│  │  │ │  ┌─ Collapse: Presupuesto Adic.   │  │  │ TOT+IVA│ │
│  │ Transic.   │  │  │ │ EspacioCard 2 (Estudio) ...       │  │  └────────┘ │
│  └────────────┘  │  │  └────────────────────────────────────┘  │             │
│                  │  │                                            │             │
│                  │  │  [Footer: ← Volver al Kanban]             │             │
└──────────────────┴────────────────────────────────────────────┴─────────────┘
```

---

## 4. Componentes Específicos P-03 (Display Only)

### 4.1 Header Proyecto (Sidebar — Display)

| Campo | Formato Display |
|---|---|
| **Nombre proyecto** | Texto plano (heading) |
| **Cliente** | "Nombre (tel) • email" — link a `/erp/clientes/[id]` si existe |
| **Estado** | Badge color (tabla P-01) + label |
| **Tipo proyecto** | Badge muted + label descriptivo |
| **Dirección obra** | Texto multilínea |
| **Costos operativos** | COP formateado |
| **Imprevistos** | COP formateado |
| **Descuento** | COP formateado (rojo si > 0) |
| **Ajuste** | COP formateado (verde/rojo según signo) |
| **IVA** | "Sí (19%)" / "No" |
| **Garantía** | "2 años" |

### 4.2 Configuración Taller (Read-Only)

Igual que P-04 pero **inputs deshabilitados** (o mejor: labels con valores):

```
Costo hora taller:     $45.000/hora  (calculado)
├─ Arriendo mensual:   $12.000.000
├─ Horas mes:          240
├─ % Mantenimiento:    15%
├─ Costo hora operario: $15.000
└─ Factor logística:   1.3

Tarifas derivadas:
├─ Desarrollo:         $45.000
├─ Ensamblaje:         $60.000  (taller + operario)
└─ Instalación:        $58.500  (taller × 1.3)
```

### 4.3 ItemRow Display (Tabla Items)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Descripción                    Und    Cant    Precio ₽      Total ₽       │
├────────────────────────────────────────────────────────────────────────────┤
│ Tablero MDF 18mm               un      12     $85.000      $1.020.000     │
│ Bisagra 35mm soft-close        un      48     $12.500      $600.000      │
│ ☑ Referencial  Nevera Samsung  un       1   $1.200.000   $1.200.000  🟡  │
│ ☑ Referencial  Horno Bosch     un       1    $850.000     $850.000  🟡  │
└────────────────────────────────────────────────────────────────────────────┘
Leyenda: 🟡 = Referencial (no suma a total contractual)
```

- **Referenciales:** Badge amber "Referencial" + `fuente_referencial` en tooltip
- **Agrupación Presupuesto Adicional:** En Collapse 11, igual que P-04 pero sin botones `[+ Item ref]` ni "Anexar a catálogo"

### 4.4 Mano de Obra Display

```
┌────────────────────────────────────────────────────────────┐
│  Desarrollo técnico     Jornadas: 12.5    Tarifa: $45.000  │
│  Ensamblaje taller      Jornadas: 8.0     Tarifa: $60.000  │
│  Instalación obra       Jornadas: 6.0     Tarifa: $58.500  │
│                                                            │
│  Subtotal MO: $1.485.000  (read-only)                      │
└────────────────────────────────────────────────────────────┘
```

### 4.5 Contrato (Solo si existe)

Si `contrato` relacionado existe → muestra `ContratoDisplay` (no modal):
- Secciones 1-4: datos display
- Hitos: tabla read-only (orden, tipo, monto/%, razón, fecha límite, estado pago)
- Botón `[Ver PDF]` si `estado='firmado'`

Si **no existe** → muestra card: "Sin contrato generado" + `[Generar Contrato]` (solo si rol `comercial`/`admin` y estado proyecto permite).

---

## 5. Footer Acciones (Solo Lectura)

```
┌────────────────────────────────────────────────────────────┐
│  [← Volver al Kanban]                    [Abrir Editor ⚙] │
└────────────────────────────────────────────────────────────┘
```

| Botón | Visibilidad | Acción |
|---|---|---|
| **← Volver al Kanban** | Siempre | `router.back()` o `/erp/comercial` |
| **Abrir Editor** | Solo `comercial`/`admin` + estado ∈ {activa, enviada, en_contrato} | Navega a `/erp/cotizador/[id]` (sin `readonly`) |

---

## 6. Lógica de Routing (Un Solo Page)

```tsx
// /app/erp/cotizador/[proyectoId]/page.tsx
export default function CotizadorPage({ params }: { params: { proyectoId: string } }) {
  const { data: session } = useSession()
  const readonly = params.readonly === 'true' || 
                   !['comercial', 'admin'].includes(session?.user?.rol || '')
  
  return <CotizadorClient proyectoId={params.proyectoId} readonly={readonly} />
}
```

**URLs:**
- `/erp/cotizador/abc-123` → P-04 (editor) si rol `comercial`/`admin`
- `/erp/cotizador/abc-123?readonly=true` → P-03 forzado
- `/erp/cotizador/abc-123` → P-03 si rol `taller`/`finanzas`/etc.

---

## 7. Checklist de Aprobación (Supervisor)

- [ ] Mismo layout P-04 pero **todo display-only** (sin inputs editables)
- [ ] Header proyecto: todos los campos como labels formateados
- [ ] Config Taller: muestra params físicos + 3 tarifas calculadas (read-only)
- [ ] Transiciones: read-only (igual P-04)
- [ ] EspacioCard: 11 strips colapsables, sin botones de edición
- [ ] ItemRow tabla: display descripción, und, cant, precio, total + badge referencial
- [ ] Mano de Obra: jornadas + tarifas + subtotal (read-only)
- [ ] Presupuesto Adicional: agrupado por `grupo_referencial`, badges referencial
- [ ] Resumen Grand Totals: idéntico a P-04 (mismo cálculo)
- [ ] Contrato: si existe → display completo + hitos tabla; si no → card "Sin contrato" + botón condicional
- [ ] Footer: [Volver al Kanban] siempre + [Abrir Editor] condicional
- [ ] Routing: misma página, prop `readonly` controla vista
- [ ] Sin `useAutoSave`, sin `MoneyInput` editable, sin drag-drop
- [ ] Accesibilidad: focus visible, ARIA en tablas, reduced-motion

---

## 8. Próximos Pasos (tras aprobación)

1. **Iniciador** escribe `plan_t-079-P03.md` (detalle implementación P-03)
2. **Agente Código** implementa:
   - Prop `readonly` en `CotizadorClient` y sub-componentes
   - Versiones display-only de: `HeaderProyecto`, `ConfigTaller`, `ItemRow`, `ManoObra`, `PresupuestoAdicional`, `ContratoDisplay`
   - Routing condicional en `page.tsx`
   - Tests: vista read-only por rol, URL `?readonly=true`, botones condicionales
3. **QA** verifica: `tsc`, `eslint`, `next build`, tests, E2E contra `dev-local`

---

## 9. Completitud F2 Core Comercial

| Pantalla | Estado |
|---|---|
| **P-01 Kanban Comercial** | ✅ APROBADA |
| **P-02 Nueva Cotización** | ✅ APROBADA |
| **P-03 Detalle Solo Lectura** | 🔄 **ESTE DISEÑO — PENDIENTE APROBACIÓN** |
| **P-04 Cotizador Editor** | ✅ APROBADA |
| **P-05 Contrato (Modal)** | ✅ INCLUIDA EN P-04 |

**Tras aprobar P-03:** Core comercial F2 (P-01..P-05) **100% diseñado y aprobado**. Quedan F-02/F-03 (público) y F-08 (sub-diamante).

---

**¿Apruebas este diseño P-03 (Detalle Solo Lectura)?**
Si sí → Core comercial F2 completo. Iniciador escribe planes de implementación.
Si ajustes → indícalos y re-itero.