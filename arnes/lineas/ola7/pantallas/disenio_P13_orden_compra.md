# P-13 — Orden de compra (crear + aprobar, guard E-18, dispara E-20)

**Fecha:** 2026-08-10 · **Estado:** propuesta · **Fase:** F4 · **Ruta:** `/app/erp/compras` · **Roles:** comercial, gerente, finanzas

**Contexto de apertura:** F4 (Compras) nunca tuvo diseño ni código — hallazgo de la consolidación del lote F5/F6/F-02/F-03/F-07 (POC-18). El plan maestro reservaba P-13/P-14/P-15 con numeración que quedó desactualizada frente a los `disenio_PXX.md` reales; este documento reemplaza esa fila del plan.

---

## 1. Entidades que consume

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `ordenes_compra` | §7 | id, codigo_orden, proyecto_id (nullable), proveedor_id, monto_total, anticipo_monto, estado, mecanica_pago, fecha_recepcion_esperada, tiempo_entrega_dias | Crear + listar + transicionar |
| `proveedores` | §7 | id, nombre, nit, telefono_comercial, direccion_despacho, ciudad, medio_pago, dias_entrega_default, transportadora, tarifa_flete | Selector de proveedor + alta rápida |
| `proyectos` | §3 | id, nombre_proyecto, estado | OC de proyecto (nullable si es operativa) |
| `verificaciones` | §6 | id, proyecto_id, tipo_gate, veredicto | Guard E-18: predicado `P18` ya existe en `lib/modules/f3/gates.ts` |
| `registros_gate_caja` | §9 | — (solo lectura, badge informativo) | Muestra si una OC ya fue bloqueada por caja al entrar a `en_pago` (ver P-21) |

**Dato de consolidación (no redundante, informa el diseño):** `store.ordenesCompra.crear()` y `store.proveedores.crear()` ya existen en `lib/data/contracts.ts`/`mock-store.ts` (construidos en el lote F5/F6 para que P-21/P-23 pudieran leer OC/proveedores) — nadie los llama todavía desde ninguna pantalla. Esta pantalla es la que los activa. No requiere ampliar `lib/data/` salvo el guard E-18 (nuevo, ver §4).

---

## 2. Estados que transiciona

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| — | "Nueva orden de compra" | `solicitada` | E-19 | Proveedor + ≥1 concepto + monto > 0 |
| `solicitada` | "Aprobar" | `aprobada` | — | Rol gerente/finanzas |
| `aprobada` | "Enviar a pago" | `en_pago` | E-20 (dispara la cola de P-21) | — |
| `solicitada` / `aprobada` | "Rechazar" | `rechazada` | — | Motivo obligatorio |
| Cualquiera antes de `pagada` | "Cancelar" | `cancelada` | — | Modal de confirmación (mismo patrón R18 de P-23) |
| `en_pago` → `pagada` → `recibida_verificada` | — | — | E-20 / E-21 | Fuera de esta pantalla: P-21 (caja) paga, P-14 (recepción) verifica |

**Predicado E-18 (guard, nuevo):** `puedeCrearOrdenCompra(proyecto, verificaciones) = proyecto.proyectoId === null (OC operativa, sin guard) ∨ P18(proyecto, verificaciones)` — reutiliza el predicado `P18` ya implementado y testeado en `lib/modules/f3/gates.ts` (schema aprobado por el verificador único). Una OC operativa (reposición de herramienta, `proyectoId=null`) nunca pasa por este guard.

---

## 3. Vocabulario H07

| Label | Código | Entidad |
|---|---|---|
| "Orden de compra" | — | `ordenes_compra` (**nunca "OC" en la UI** — decisión H07 2026-08-05) |
| "Solicitada" | `solicitada` | `ordenes_compra.estado` |
| "Aprobada" | `aprobada` | `ordenes_compra.estado` |
| "En pago" | `en_pago` | `ordenes_compra.estado` |
| "Pagada" | `pagada` | `ordenes_compra.estado` |
| "Recibida verificada" | `recibida_verificada` | `ordenes_compra.estado` |
| "Rechazada" | `rechazada` | `ordenes_compra.estado` |
| "Cancelada" | `cancelada` | `ordenes_compra.estado` |
| "Anticipo + saldo" / "Pago único" / "Subcontratación" | `anticipo_saldo` / `unico` / `subcontratacion` | `ordenes_compra.mecanica_pago` |
| "Compra operativa" | `origen='operativa'` (proyecto_id null) | `ordenes_compra` |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Guard E-18: OC de proyecto solo si `P18(proyecto, verificaciones)` es verdadero | Cliente (deshabilita botón con razón) + store (rechaza si no cumple) | Test: `crear({proyectoId: sinSchema})` → null |
| R2 | OC operativa (`proyectoId=null`) nunca exige E-18 | Store | Test: `crear({proyectoId: null})` → OK sin verificación |
| R3 | `mecanicaPago='anticipo_saldo'` exige `anticipoMonto` > 0 y ≤ `montoTotal` | Cliente + store | Test: anticipo > total → rechaza |
| R4 | Transición `solicitada→aprobada→en_pago` solo gerente/finanzas | Store (según `usuarioActual().rol`) | Test: rol `taller` intenta aprobar → rechaza |
| R5 | Proveedor nuevo se puede crear inline desde el formulario de OC (no exige salir a otra pantalla) | UI | Modal `NuevoProveedorModal` reutilizable |

---

## 5. Componentes UI

| Componente | Tipo | Props | Entidad asociada |
|---|---|---|---|
| `TablaOrdenesCompra` | Client | Lista filtrable por estado/proveedor, columnas: código, proveedor, proyecto (o "Operativa"), monto, estado, badge de bloqueo de caja si aplica | `ordenes_compra` |
| `NuevaOrdenCompraModal` | Client (`Modal`) | Selector proyecto (opcional, "Compra operativa" si vacío) + `SmartSearch` de proveedor + `MoneyInput` monto + mecánica de pago + fecha esperada | `ordenes_compra` |
| `NuevoProveedorModal` | Client (`Modal`) | Formulario mínimo: nombre, NIT, teléfono, ciudad | `proveedores` |
| `BadgeEstadoOC` | Client | `estado: EstadoOrdenCompra` | — |
| `AccionesOC` | Client | Aprobar / Enviar a pago / Rechazar / Cancelar según estado + rol | — |

**Patrones M-06 L1 usados:** `SmartSearch` (selector proveedor), `MoneyInput`, `Modal`, `useDataStore()`, mismo patrón de confirmación R18 que P-23 (`cuentasCobroProveedor.anular`) para "Cancelar".

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace E-XX |
|---|---|---|---|---|---|
| 1 | Cargar pantalla | Mount | `store.ordenesCompra.listar()` + `store.proveedores.listar()` + `store.proyectos.listar()` | — | — |
| 2 | Crear OC | Submit `NuevaOrdenCompraModal` | Guard E-18 en cliente → `store.ordenesCompra.crear(...)` | Estado inicial `solicitada` | E-19 |
| 3 | Crear proveedor inline | Submit `NuevoProveedorModal` | `store.proveedores.crear(...)` | Selecciona el nuevo proveedor en el form de OC | — |
| 4 | Aprobar | Click "Aprobar" | `store.ordenesCompra.actualizarEstado(id, 'aprobada')` | — | — |
| 5 | Enviar a pago | Click "Enviar a pago" | `store.ordenesCompra.actualizarEstado(id, 'en_pago')` | Aparece en la cola de P-21 (caja) | E-20 (disparo) |
| 6 | Rechazar/Cancelar | Click + confirmación | `store.ordenesCompra.actualizarEstado(id, 'rechazada'\|'cancelada')` | — | — |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores en `app/erp/compras/` | `eslint app/erp/compras/` |
| CA-3 | Guard E-18 bloquea OC de proyecto sin schema aprobado, no bloquea OC operativa | `lib/modules/f4/gates.ts` test dedicado |
| CA-4 | Ninguna OC se crea sin proveedor válido | Test: `crear({proveedorId: ''})` → rechaza en UI |
| CA-5 | Label "OC" no aparece en ningún string de la pantalla | `grep -ri '\bOC\b' app/erp/compras/` = 0 resultados (fuera de comentarios de código) |
| CA-6 | `/erp/compras` reachable desde `ERP_NAV` | Nav-owner de este lote agrega el ítem |

---

## 8. Verificación de integridad (pre-entrega)

- [x] `ordenes_compra`/`proveedores` existen en `REGISTRO_DE_ENTIDADES.md` §7
- [x] Todo estado en §2 existe en el REGISTRO y en `glosario_h07.md` B.9
- [x] Todo label en §3 existe en `glosario_h07.md`
- [x] Guard E-18 reutiliza `P18` ya verificado en `lib/modules/f3/gates.ts` (no se reinventa)
- [ ] Pendiente al codificar: nuevo módulo `lib/modules/f4/gates.ts` con `puedeCrearOrdenCompra` + test dedicado (mismo patrón que `f4f5f6/gates.ts`)
