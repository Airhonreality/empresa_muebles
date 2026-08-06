# Diseño de Pantalla P-02 — Nueva Cotización / Proyecto (Veta de Oro)

**Fecha:** 2026-08-05
**Estado:** Propuesta para aprobación del Supervisor
**Dependencias:** P-01 aprobado, decisiones C1-C4, M-06 L1
**Artefactos base:** `disenio_p01_kanban_comercial.md`, `destilacion_cotizador_contrato.md`, `glosario_h07.md`

---

## 1. Visión General

P-02 es el **modal de creación de proyecto** que se abre desde:
- Botón `[Nuevo +]` en header del Kanban (P-01)
- Botón `[+ Añadir Lead]` en columna `activa` del Kanban

Crea un proyecto en estado `activa` (draft) y redirige al cotizador (P-04) para continuar editando.

**Estructura:** Modal centrado, responsive, `"use client"`.

**Patrones técnicos (M-06 L1):**
- `useSmartSearch` (HybridClientSelector — búsqueda clientes + crear on-the-fly)
- `useDebounce` (búsqueda cliente, 300ms)
- `COP` formatter + `MoneyInput` (si se añaden costos iniciales)
- Design tokens + primitivas `components/veta/` (Modal, Input, Select, Button, Combobox)

---

## 2. Layout del Modal

```
┌────────────────────────────────────────────────────────────────┐
│  Nueva Cotización / Proyecto                            [×]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─ DATOS BÁSICOS ──────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  Nombre del proyecto *                                   │ │
│  │  [________________________________________________]      │ │
│  │  💡 Ej: "Cocina Integral Casa López"                     │ │
│  │                                                          │ │
│  │  Cliente *                                               │ │
│  │  [HybridClientSelector ▼]                    [+ Nuevo]  │ │
│  │     ┌─ Buscar cliente...                                 │ │
│  │     │ 👤 María López (310 555 0123)  ← reciente         │ │
│  │     │ 👤 Carlos Ruiz (320 444 1122)  ← frecuente        │ │
│  │     │ 👤 Ana Torres (300 777 8899)                       │ │
│  │     │ ────────────────────────                          │ │
│  │     │ [Crear nuevo cliente]                              │ │
│  │     └────────────────────────                            │ │
│  │                                                          │ │
│  │  Tipo de proyecto *                                      │ │
│  │  [▼ proyecto_a_medida ▼]                                 │ │
│  │     proyecto_a_medida   — Cocinas, closets, muebles a medida │
│  │     producto_fijo       — Prefabricados catálogo (tipo producto) │
│  │     servicio_tecnico    — Visita, medición, diseño 3D sin fabricación │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─ UBICACIÓN Y ENTREGA ────────────────────────────────────┐ │
│  │                                                          │ │
│  │  Dirección de obra *                                     │ │
│  │  [________________________________________________]      │ │
│  │  💡 Calle, número, barrio, ciudad, referencia           │ │
│  │                                                          │ │
│  │  Fecha estimada de entrega                               │ │
│  │  [DatePicker ____________________]  (opcional)          │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─ CONFIGURACIÓN INICIAL (opcional) ───────────────────────┐ │
│  │  ☑ Aplicar plantilla de costos estándar                   │ │
│  │     Costos operativos: [MoneyInput $500.000]              │ │
│  │     Imprevistos instalación: [MoneyInput $0]              │ │
│  │     Descuento comercial: [MoneyInput $0]                  │ │
│  │     Ajuste arbitrario: [MoneyInput $0]                    │ │
│  │     IVA: [☑] 19%                                          │ │
│  │     Garantía: [2] años                                    │ │
│  │                                                          │ │
│  │  ℹ Se pueden ajustar luego en el cotizador (P-04)        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ──────────────────────────────────────────────────────────── │
│                                                                │
│  Estado inicial:  🟡 Activa  (fijo si viene de columna Kanban) │
│  Comercial asignado:  [Usuario actual]  (auto, editable admin)│
│                                                                │
│  ──────────────────────────────────────────────────────────── │
│                                                                │
│  [Cancelar]                                    [Crear y abrir] │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes Detallados

### 3.1 HybridClientSelector (Reutilizable — M-06 L1)

**Comportamiento idéntico al legacy `HybridClientSelector` + `useSmartSearch`:**

```
┌─────────────────────────────────────────┐
│  [Buscar cliente...              ▼]     │
├─────────────────────────────────────────┤
│  👤 María López (310 555 0123)          │  ← Recientes (localStorage)
│  👤 Carlos Ruiz (320 444 1122)          │  ← Frecuentes (localStorage)
│  👤 Ana Torres (300 777 8899)           │  ← Matches fuzzy (Levenshtein)
│  ─────────────────────────────────────  │
│  [+ Crear nuevo cliente]                │  ← Abre CrearClienteModal
└─────────────────────────────────────────┘
```

**Crear nuevo cliente (modal anidado):**
```
┌─────────────────────────────────────────┐
│  Nuevo Cliente                      [×] │
├─────────────────────────────────────────┤
│  Nombre *          [________________]   │
│  Documento         [________________]   │
│  Teléfono *        [________________]   │
│  Email             [________________]   │
│  Dirección         [________________]   │
│  Barrio            [________________]   │
│  Ciudad            [Bogotá ▼]           │
│  ─────────────────────────────────────  │
│  [Cancelar]            [Guardar]        │
└─────────────────────────────────────────┘
```
- `POST /api/erp/clientes` → retorna cliente creado → auto-selecciona en selector padre.

---

### 3.2 Select Tipo Proyecto

| Value | Label | Descripción | Comportamiento |
|---|---|---|---|
| `proyecto_a_medida` | **Proyecto a medida** | Cocinas, closets, muebles a medida | Crea espacios/variantes vacíos en P-04 |
| `producto_fijo` | **Producto fijo (prefabricado)** | Ítem de catálogo publicado | Crea 1 espacio = producto, vínculo `proyecto_origen_id` |
| `servicio_tecnico` | **Servicio técnico** | Visita, medición, diseño 3D sin fabricación | No crea espacios, solo visita + diseño |

---

### 3.3 Configuración Inicial (Opcional — Checkbox)

**Por defecto:** Checkbox **desmarcado** → crea proyecto con ceros en costos, IVA=19%, garantía=2 años.

**Si marcado:** Muestra campos editables (todos `useAutoSave` NO — solo valores iniciales para el `POST`):

| Campo | Tipo | Default | Validación |
|---|---|---|---|
| Costos operativos | MoneyInput | 500.000 | ≥ 0 |
| Imprevistos instalación | MoneyInput | 0 | ≥ 0 |
| Descuento comercial | MoneyInput | 0 | ≥ 0 |
| Ajuste arbitrario | MoneyInput | 0 | (negativo permitido) |
| IVA aplica | Checkbox | true | — |
| % IVA | Number | 19 | 0-100 |
| Garantía años | Number | 2 | 1-10 |

**Rationale:** El comercial puede pre-cargar costos típicos si ya los conoce, pero no es obligatorio. P-04 permite editar todo después.

---

### 3.4 Estado Inicial + Comercial Asignado

| Campo | Valor | Editable |
|---|---|---|
| **Estado** | `activa` (fijo) | No — viene de columna Kanban o default |
| **Comercial** | Usuario actual (`currentUser.id`) | Solo `admin` puede cambiar |

---

## 4. Flujo de Datos y Acciones

### 4.1 Submit: "Crear y abrir"

```typescript
// Client
const handleSubmit = async (data) => {
  const res = await fetch('/api/erp/proyectos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre_proyecto: data.nombre,
      cliente_id: data.clienteId,
      tipo_proyecto: data.tipoProyecto,
      estado: 'activa',
      direccion_obra: data.direccionObra,
      fecha_entrega_estimada: data.fechaEntrega || null,
      costos_operativos: data.costosOperativos || 0,
      imprevistos_instalacion: data.imprevistos || 0,
      descuento_comercial: data.descuento || 0,
      ajuste_arbitrario: data.ajuste || 0,
      aplica_iva: data.aplicaIva !== false,
      porcentaje_iva: data.pctIva || 19,
      garantia_anios: data.garantia || 2,
      comercial_id: data.comercialId, // currentUser o admin override
    })
  })
  const proyecto = await res.json()
  router.push(`/erp/cotizador/${proyecto.id}`)
}
```

### 4.2 Server: `POST /api/erp/proyectos`

1. Valida: `nombre_proyecto` requerido, `cliente_id` existe, `comercial_id` es usuario actual o admin.
2. Inserta en `proyectos` (UUID, timestamps auto).
3. **Si `tipo_proyecto = 'producto_fijo'`:** Crea 1 `espacio_variantes` con `nombre_espacio = nombre_proyecto`, `activa=true`, `visible_pdf=true`, vincula `proyecto_origen_id` en catálogo (lógica F1).
4. **Si `tipo_proyecto = 'servicio_tecnico'`:** No crea espacios. Crea `cita` tipo `visita_tecnica` (F1).
5. Registra evento en `eventos` (`tipo_evento='proyecto_creado'`, `contexto='proyectos'`, `actor_id=currentUser`).
6. Retorna `{id, ...proyecto}`.

---

## 5. Validaciones

| Regla | Dónde | Error |
|---|---|---|
| Nombre proyecto requerido | Client + Server | "El nombre del proyecto es obligatorio" |
| Cliente requerido | Client + Server | "Seleccione o cree un cliente" |
| Dirección obra requerida | Client + Server | "La dirección de obra es obligatoria" |
| Cliente existe | Server | "Cliente no encontrado" |
| Comercial válido | Server | "Usuario no autorizado" |
| Tipo proyecto válido | Server (enum) | "Tipo de proyecto inválido" |
| Costos ≥ 0 | Client (MoneyInput) + Server | "Valor inválido" |
| % IVA 0-100 | Client + Server | "Porcentaje IVA inválido" |
| Garantía 1-10 años | Client + Server | "Garantía inválida" |

---

## 6. Estados de Pantalla

| Estado | Qué muestra |
|---|---|
| **Inicial** | Formulario vacío, cliente selector enfocado |
| **Buscando cliente** | Spinner en selector, resultados fuzzy |
| **Creando cliente** | Modal anidado "Nuevo Cliente" |
| **Enviando** | Botón "Creando..." disabled, spinner |
| **Éxito** | Toast "Proyecto creado" + redirect a P-04 |
| **Error** | Toast error + formulario habilitado |

---

## 7. Accesibilidad (a11y)

- **Modal:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`, focus trap, Escape cierra.
- **HybridClientSelector:** `role="combobox"`, `aria-autocomplete="list"`, `aria-controls`, navegación teclado (↑↓ Enter).
- **Inputs:** `aria-required`, `aria-describedby` para hints, `inputmode="decimal"` en MoneyInput.
- **Focus visible:** tokens `--focus-ring` en todos los interactivos.
- **Reduced-motion:** desactiva animaciones modal.

---

## 8. Checklist de Aprobación (Supervisor)

- [ ] Modal centrado, responsive (max-w-md en mobile, max-w-lg en desktop)
- [ ] Sección Datos Básicos: Nombre*, HybridClientSelector, Tipo proyecto*
- [ ] HybridClientSelector: fuzzy search + recientes + frecuentes + [+ Crear nuevo]
- [ ] Crear cliente modal anidado (campos completos, POST /api/erp/clientes)
- [ ] Tipo proyecto: 3 opciones con descripciones claras
- [ ] Sección Ubicación: Dirección obra*, Fecha entrega opcional
- [ ] Sección Configuración Inicial: checkbox opcional → campos costos/IVA/garantía
- [ ] Estado inicial fijo `activa`, comercial asignado = usuario actual
- [ ] Botones: Cancelar (cierra sin guardar), Crear y abrir (POST + redirect)
- [ ] Validaciones client + server (tabla §5)
- [ ] Accesibilidad: focus trap, ARIA, teclado, reduced-motion
- [ ] Integración P-01: se abre desde `[Nuevo +]` y `[+ Añadir Lead]` (estado pre-seleccionado)

---

## 9. Próximos Pasos (tras aprobación)

1. **Iniciador** escribe `plan_t-079-P02.md` (detalle implementación P-02)
2. **Agente Código** implementa:
   - `HybridClientSelector` (componente reutilizable M-06 L1)
   - `CrearClienteModal` (anidado)
   - `NuevoProyectoModal` (P-02)
   - API `POST /api/erp/proyectos` + `POST /api/erp/clientes`
   - Tests: crear proyecto 3 tipos, crear cliente, validaciones
3. **QA** verifica: `tsc`, `eslint`, `next build`, tests, E2E contra `dev-local`

---

## 10. Relación con P-01 / P-03 / P-04

| Flujo | Qué pasa |
|---|---|
| **P-01 → P-02** | Click `[Nuevo +]` o `[+ Añadir Lead]` → abre P-02. Si desde columna, `estado` pre-seleccionado. |
| **P-02 → P-04** | Submit exitoso → `router.push('/erp/cotizador/' + newId)` → abre cotizador con proyecto draft. |
| **P-03 (Solo Lectura)** | No usa P-02. Acceso directo por URL con `?readonly=true`. |

---

**¿Apruebas este diseño P-02 (Nueva Cotización / Proyecto)?**
Si sí → Iniciador escribe `plan_t-079-P02.md`.
Si ajustes → indícalos y re-itero.

Luego pasamos a **P-03 (Detalle Solo Lectura)** para completar el core comercial F2.