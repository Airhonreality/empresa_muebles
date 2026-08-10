# P-02 — Nueva Cotización / Proyecto

**Fecha:** 2026-08-05 · **Estado:** propuesta · **Fase:** F2 · **Ruta:** `/app/erp/comercial/nuevo` · **Roles:** `admin`, `comercial`

---

## 1. Entidades que consume

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`). No redefinas schemas aquí.*

| Entidad | § del REGISTRO | Columnas usadas | Uso en esta pantalla |
|---|---|---|---|
| `proyectos` | §3 Comercial | id, estado, nombre_proyecto, cliente_id, direccion_obra, tipo_proyecto, fecha_entrega_estimada, costos_operativos, imprevistos_instalacion, descuento_comercial, ajuste_arbitrario, aplica_iva, porcentaje_iva, garantia_anios, comercial_id | POST: creación de proyecto con estado inicial `activa` |
| `clientes` | §3 Comercial | id, nombre, documento, telefono, email, direccion, barrio, ciudad | HybridClientSelector (búsqueda fuzzy + crear on-the-fly) |
| `personas` | §1 Cimientos F0 | id, nombre | Asignación de `comercial_id` (usuario actual o admin override) |
| `eventos` | §1 Cimientos F0 | tipo_evento, contexto, actor_id, proyecto_id | Registro `proyecto_creado` (E-XX) al crear proyecto |
| `espacio_variantes` | §3 Comercial | nombre_espacio, activa, visible_pdf, proyecto_origen_id | Auto-creación 1 espacio si `tipo_proyecto = 'servicio_tecnico'` es de P-27 (no se crea desde el flujo comercial) |
| `citas` | §3 Comercial | tipo, proyecto_id | Auto-creación 1 cita `visita_tecnica` si `tipo_proyecto = 'servicio_tecnico'` |

> **POC-12:** el tipo `producto_fijo` NO se ofrece en esta pantalla. Crear un producto fijo es responsabilidad del área diseño-desarrollo en **P-27 Catálogo** (`disenio_p27_catalogo_diseno_desarrollo.md`). El comercial crea proyectos `personalizado` / `servicio_tecnico` y consume el catálogo existente.

---

## 2. Estados que transiciona

*Cita los estados del REGISTRO DE ENTIDADES y del glosario H07.*

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| — (creación) | "Crear y abrir" | `activa` | E-XX `proyecto_creado` | `nombre_proyecto` requerido, `cliente_id` existe, `comercial_id` válido |

---

## 3. Vocabulario H07 (labels visibles)

*Cita del `glosario_h07.md`. Todo label de UI sale de aquí.*

| Label natural | Código interno | Entidad.campo |
|---|---|---|
| "Activa" | `activa` | `proyectos.estado` |
| "Proyecto a medida" | `proyecto_a_medida` | `proyectos.tipo_proyecto` |
| "Servicio técnico" | `servicio_tecnico` | `proyectos.tipo_proyecto` |
| "Nueva Cotización / Proyecto" | — | — (título del modal) |
| "Nombre del proyecto" | `nombre_proyecto` | `proyectos.nombre_proyecto` |
| "Cliente" | `cliente_id` | `proyectos.cliente_id` → `clientes` |
| "Tipo de proyecto" | `tipo_proyecto` | `proyectos.tipo_proyecto` |
| "Dirección de obra" | `direccion_obra` | `proyectos.direccion_obra` |
| "Fecha estimada de entrega" | `fecha_entrega_estimada` | `proyectos.fecha_entrega_estimada` |
| "Costos operativos" | `costos_operativos` | `proyectos.costos_operativos` |
| "Imprevistos instalación" | `imprevistos_instalacion` | `proyectos.imprevistos_instalacion` |
| "Descuento comercial" | `descuento_comercial` | `proyectos.descuento_comercial` |
| "Ajuste arbitrario" | `ajuste_arbitrario` | `proyectos.ajuste_arbitrario` |
| "IVA" | `aplica_iva` / `porcentaje_iva` | `proyectos.aplica_iva`, `proyectos.porcentaje_iva` |
| "Garantía" | `garantia_anios` | `proyectos.garantia_anios` |
| "Crear y abrir" | — | — (botón submit) |
| "Cancelar" | — | — (botón cierre) |
| "Nuevo Cliente" | — | — (título modal anidado) |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | `nombre_proyecto` requerido | Client + Server | Test: POST sin `nombre_proyecto` → 400 "El nombre del proyecto es obligatorio" |
| R2 | `cliente_id` requerido y debe existir en `clientes` | Client + Server | Test: POST con `cliente_id` inexistente → 400 "Cliente no encontrado" |
| R3 | `direccion_obra` requerida | Client + Server | Test: POST sin `direccion_obra` → 400 "La dirección de obra es obligatoria" |
| R4 | `comercial_id` debe ser usuario actual o admin | Server | Test: POST con `comercial_id` de otro usuario sin rol admin → 403 |
| R5 | `tipo_proyecto` debe ser valor válido del enum de creación comercial (`proyecto_a_medida`, `servicio_tecnico`). `producto_fijo` NO se ofrece aquí (POC-12) | Server (enum) | Test: POST con `tipo_proyecto='invalido'` → 400 "Tipo de proyecto inválido" |
| R6 | Costos (`costos_operativos`, `imprevistos_instalacion`, `descuento_comercial`) ≥ 0 | Client (MoneyInput min=0) + Server | Test: MoneyInput rechaza valor negativo; POST con valor negativo → 400 |
| R7 | `ajuste_arbitrario` permite negativo | — | Test: POST con ajuste negativo → OK |
| R8 | `porcentaje_iva` entre 0 y 100 | Client + Server | Test: POST con `porcentaje_iva=101` → 400 "Porcentaje IVA inválido" |
| R9 | `garantia_anios` entre 1 y 10 | Client + Server | Test: POST con `garantia_anios=0` → 400 "Garantía inválida" |
| R10 | Si `tipo_proyecto = 'servicio_tecnico'`, auto-crear 1 `cita` tipo `visita_tecnica` | Server, en misma transacción | Test: crear proyecto `servicio_tecnico` → 1 row en `citas` con FK correcta |
| R11 | Si `tipo_proyecto = 'proyecto_a_medida'`, no crear espacios ni citas (se crean en P-04) | Server | Test: crear proyecto `proyecto_a_medida` → 0 rows en `espacio_variantes`, 0 en `citas` |
| R12 | Configuración inicial es opcional: checkbox desmarcado por defecto → valores default (costos=0, IVA=19%, garantía=2) | Client | Test: formulario sin marcar checkbox → POST con defaults |
| R13 | Registrar `eventos` con `tipo_evento='proyecto_creado'`, `contexto='proyectos'`, `actor_id=currentUser` al crear | Server, en misma transacción | Test: POST exitoso → 1 row en `eventos` con tipo correcto |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada | Tokens D4 |
|---|---|---|---|---|
| `NuevoProyectoModal` | Client (`"use client"`) | `onClose: () => void, estadoPreSeleccionado?: string` | `proyectos`, `clientes` | Modal (`--color-primary`, `Fraunces`), centrado, responsive (max-w-md mobile, max-w-lg desktop) |
| `HybridClientSelector` | Client (reutilizable M-06 L1) | `onSelect: (cliente) => void, onCreateNew: () => void` | `clientes` | Combobox (`--radius-md`), `--focus-ring`, `Fraunces` |
| `CrearClienteModal` | Client (anidado en modal padre) | `onCreated: (cliente) => void, onClose: () => void` | `clientes` | Modal anidado, `--color-primary`, `Fraunces` |
| `SelectTipoProyecto` | Client | `value: TipoProyecto, onChange: (v) => void` | `proyectos.tipo_proyecto` | Select primitiva (`--radius-md`), `--focus-ring` |
| `DatePicker` | Client | `value: Date \| null, onChange: (d) => void` | `proyectos.fecha_entrega_estimada` | Input primitiva, `--radius-md` |
| `MoneyInput` | Client (M-06 L1) | `value: number, onChange: (n) => void, min?: number` | `proyectos.costos_operativos`, etc. | `--color-primary`, `Fraunces`, `inputmode="decimal"` |
| `ConfigInicialCheckbox` | Client | `checked: boolean, onChange: (b) => void` | `proyectos` (grupo costos/IVA/garantía) | Checkbox + Collapse, `--radius-md` |
| `EstadoInicialBadge` | Display | `estado: string` | `proyectos.estado` | Badge (`--color-warning` para `activa`) |
| `ComercialAsignado` | Display / Select (si admin) | `usuario: User, editable: boolean` | `personas` | Label / Select, `Fraunces` |

**Patrones M-06 L1 usados:** `useSmartSearch` (HybridClientSelector), `useDebounce` (búsqueda cliente, 300ms), `COP` formatter + `MoneyInput`, Suspense, primitivas `components/veta/` (Modal, Input, Select, Button, Combobox)

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace E-XX |
|---|---|---|---|---|---|
| 1 | Abrir modal | Click `[Nuevo +]` en P-01 header o `[+ Añadir Lead]` en columna Kanban | Render `NuevoProyectoModal`, foco en `HybridClientSelector` | Si viene de columna Kanban, `estadoPreSeleccionado` fijado | — |
| 2 | Buscar cliente | Usuario escribe en `HybridClientSelector` | `useDebounce` 300ms → fuzzy search (Levenshtein) + recientes (localStorage) + frecuentes (localStorage) | Dropdown con matches ordenados por relevancia | — |
| 3 | Crear nuevo cliente | Click `[+ Crear nuevo cliente]` en dropdown | Abre `CrearClienteModal` anidado | — | — |
| 4 | Guardar nuevo cliente | Click `[Guardar]` en `CrearClienteModal` | `POST /api/erp/clientes` → retorna cliente creado → auto-selecciona en `HybridClientSelector` padre | — | — |
| 5 | Marcar checkbox configuración inicial | Toggle `☑ Aplicar plantilla de costos estándar` | Muestra / oculta campos de costos, IVA, garantía editables | Valores default si desmarcado: costos=0, IVA=19%, garantía=2 | — |
| 6 | Submit "Crear y abrir" | Click `[Crear y abrir]` | POST `/api/erp/proyectos` con todos los campos del formulario | Server valida (R1-R13), inserta en `proyectos`, auto-crea `espacio_variantes`/`citas` según `tipo_proyecto`, registra `eventos` | E-XX `proyecto_creado` |
| 7 | Éxito | POST 200 → `{id, ...proyecto}` | Toast "Proyecto creado" + `router.push('/erp/cotizador/' + newId)` → abre P-04 con proyecto draft | — | — |
| 8 | Error | POST 4xx/5xx | Toast error + formulario habilitado (no cierra el modal) | — | — |
| 9 | Cancelar | Click `[Cancelar]` o tecla Escape | Cierra modal sin guardar | — | — |
| 10 | Estados de pantalla (UI) | — | Inicial: formulario vacío, cliente selector enfocado. Buscando cliente: spinner en selector. Creando cliente: modal anidado. Enviando: botón "Creando..." disabled + spinner. Éxito: Toast + redirect. Error: Toast + formulario habilitado | — | — |

---

## 7. Criterios de aceptación (verificables mecánicamente)

| # | Criterio | Comando / verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 errores | `tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores en archivos de esta pantalla | `eslint app/erp/comercial/nuevo/` |
| CA-3 | POST `/api/erp/proyectos` con datos válidos → 200 + redirect a P-04 | `curl -X POST /api/erp/proyectos -d '{...}'` → 200 |
| CA-4 | POST sin `nombre_proyecto` → 400 "El nombre del proyecto es obligatorio" | Test: POST sin campo requerido |
| CA-5 | POST sin `cliente_id` → 400 "Seleccione o cree un cliente" | Test: POST sin cliente |
| CA-6 | POST con `cliente_id` inexistente → 400 "Cliente no encontrado" | Test: cliente_id = UUID falso |
| CA-7 | Verificación servidor R1-R13: todos los errores documentados en §4 | `npx tsx __tests__/comercial/nuevo-proyecto.test.ts` → PASS |
| CA-8 | Modal centrado, responsive (max-w-md mobile, max-w-lg desktop) | Inspección visual + test de viewport |
| CA-9 | HybridClientSelector: fuzzy search + recientes + frecuentes + `[+ Crear nuevo]` | Test E2E: escribir "Mar" → ver matches |
| CA-10 | CrearClienteModal anidado: campos completos, POST `/api/erp/clientes` → auto-selecciona en padre | Test E2E: crear cliente desde modal |
| CA-11 | Tipo proyecto: solo opciones de creación comercial; `producto_fijo` ausente (POC-12, se crea en P-27) | `grep -c "producto_fijo" app/erp/cotizador/new/` = 0 |
| CA-12 | Configuración inicial: checkbox opcional → muestra/oculta campos costos/IVA/garantía | Test: toggle checkbox → campos visibles |
| CA-13 | Estado inicial fijo `activa`, comercial asignado = usuario actual | Test: `grep "activa"` en payload POST |
| CA-14 | Integración P-01: se abre desde `[Nuevo +]` y `[+ Añadir Lead]` (estado pre-seleccionado) | Test E2E: navegar P-01 → abrir modal |
| CA-15 | Accesibilidad: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, Escape cierra | `grep -c "aria-"` ≥ 5 en componente modal |
| CA-16 | HybridClientSelector: `role="combobox"`, `aria-autocomplete="list"`, navegación teclado (↑↓ Enter) | `grep "combobox\|aria-autocomplete"` en HybridClientSelector |
| CA-17 | Inputs: `aria-required`, `aria-describedby` para hints, `inputmode="decimal"` en MoneyInput | `grep "aria-required\|inputmode"` ≥ 3 |
| CA-18 | Focus visible: tokens `--focus-ring` en todos los interactivos | `grep "focus-ring"` en componentes de esta pantalla |
| CA-19 | Reduced-motion: desactiva animaciones modal | `grep "prefers-reduced-motion"` en CSS/componente |

---

## 8. Verificación de integridad (pre-entrega)

Antes de marcar el diseño como "aprobado", el Iniciador verifica:

- [ ] Toda entidad en §1 existe en el `REGISTRO_DE_ENTIDADES.md`
- [ ] Todo estado en §2 existe en el `REGISTRO_DE_ENTIDADES.md` y en `glosario_h07.md`
- [ ] Todo label en §3 existe en `glosario_h07.md`
- [ ] Toda regla en §4 tiene verificación mecánica (no "se ve bien")
- [ ] Todo componente en §5 usa tokens D4 y patrones M-06 L1
- [ ] Todo comportamiento en §6 traza a un evento E-XX del `diamante2_define_eventos.md`
- [ ] Los criterios de aceptación en §7 son ejecutables (no opinables)
