# P-14 — Recepción de material (triple verificación, gate E-21)

**Fecha:** 2026-08-10 · **Estado:** propuesta · **Fase:** F4 · **Ruta:** `/app/erp/compras/[ordenCompraId]/recepcion` · **Roles:** taller, gerente

**Contexto de apertura:** ver `disenio_P13_orden_compra.md`. A diferencia de P-13, esta pantalla introduce entidades que **no existen todavía** en `lib/data/` — requiere un paso de datos previo (mismo patrón que B2-0/B3-0) antes de repartir código.

---

## 1. Entidades que consume

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `ordenes_compra` | §7 | id, codigo_orden, proveedor_id, estado | OC en estado `pagada` pendiente de recepción |
| `items_orden_compra` | §7 **[nueva — no materializada]** | id, orden_compra_id, producto_catalogo_id, cantidad_esperada, recibido_cantidad, sin_defectos | Checklist de recepción por ítem |
| `recepciones_material` | §7 **[nueva — no materializada]** | id, orden_compra_id, proyecto_id (nullable), check_pedido_bien, check_despacho_bien, check_material, estado, created_at | Triple verificación (E-21) |
| `reprocesos` | §8 | id, proyecto_id, origen, descripcion | Recepción defectuosa dispara reproceso (solo si la OC es de proyecto) |

**Paso de datos previo (obligatorio antes de código, no lo hace esta pantalla sola):**
- `lib/data/contracts.ts`/`mock-store.ts`/`fixtures.ts`/`drizzle-impl.ts`: agregar `ItemOrdenCompra`, `RecepcionMaterial` + dominios `itemsOrdenCompra`/`recepcionesMaterial` en el store (crear/porOrdenCompra), con round-trip test en `mock-store.test.ts` — mismo contrato que exige `checklist_progreso_pantallas.md`.
- `lib/data/contracts.ts`: extender `OrigenReproceso` con `'recepcion'` (hoy: `'schema' | 'calidad' | 'instalacion' | 'garantia'`).

---

## 2. Estados que transiciona

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| OC `pagada` | Taller registra recepción | `recepciones_material.estado = pendiente` (se crea al llegar el pedido) | — | — |
| `pendiente` | Marca los 3 checks (pedido/despacho/material) todos OK | `recibido_verificado` → OC pasa a `recibida_verificada` | **E-21** | Los 3 checks = true |
| `pendiente` | Algún check falla | `recibido_defectuoso` → OC permanece en `pagada` | E-21 (rama negativa) | ≥1 check = false, exige descripción del defecto |
| `recibido_defectuoso` (OC de proyecto) | Confirmar defecto | — | E-54 | Crea `reprocesos(origen='recepcion')` |

**Predicado E-21:** `recepcionCompleta(r) = r.checkPedidoBien ∧ r.checkDespachoBien ∧ r.checkMaterial`. Si es verdadero → `ordenes_compra.actualizarEstado('recibida_verificada')`. Si es falso → la OC no avanza; si es de proyecto, se ofrece crear reproceso.

---

## 3. Vocabulario H07

| Label | Código | Entidad |
|---|---|---|
| "Recepción" / "Recibo de material" | — | `recepciones_material` (**nunca "recepción" a secas sin contexto** — nombre canónico `recepciones_material`, no `recepciones`) |
| "Pendiente" | `pendiente` | `recepciones_material.estado` |
| "Recibido verificado" | `recibido_verificado` | `recepciones_material.estado` |
| "Recibido con defecto" | `recibido_defectuoso` | `recepciones_material.estado` |
| "Pedido correcto" / "Despacho correcto" / "Material correcto" | `check_pedido_bien` / `check_despacho_bien` / `check_material` | `recepciones_material` |
| "Recibida verificada" | `recibida_verificada` | `ordenes_compra.estado` |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Solo se puede registrar recepción de una OC en estado `pagada` | Store | Test: OC `solicitada` → rechaza |
| R2 | `recibido_verificado` exige los 3 checks en `true` simultáneamente, no parcial | Store | Test: 2/3 checks → sigue `pendiente` |
| R3 | `recibido_defectuoso` exige una descripción no vacía del defecto | Cliente + store | Test: check=false sin descripción → rechaza |
| R4 | Recepción defectuosa de una OC de proyecto ofrece crear reproceso; OC operativa no (no hay proyecto al cual reprocesar) | UI condicional | — |
| R5 | Al pasar a `recibido_verificado`, la OC transiciona automáticamente (no requiere doble clic) | Store, misma transacción mock | Test: verificar OC.estado tras marcar 3 checks |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `ChecklistRecepcion` | Client | 3 checkboxes (pedido/despacho/material) + textarea de defecto condicional |
| `TablaItemsOC` | Client | Ítems esperados vs. recibidos, cantidad + `sinDefectos` por ítem |
| `CrearReprocesoDesdeRecepcion` | Client (`Modal`) | Solo visible si `recibido_defectuoso` y OC de proyecto |
| `BadgeEstadoRecepcion` | Client | — |

**Patrones M-06 L1:** mismo patrón de checklist que P-17 (calidad, `puedeEmitirVeredictoCalidad`), reutiliza `Modal` de creación de reproceso ya existente en P-17/P-18.

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace |
|---|---|---|---|---|---|
| 1 | Cargar pantalla | Mount | `store.ordenesCompra` (la OC) + `store.itemsOrdenCompra.porOrdenCompra()` + `store.recepcionesMaterial.porOrdenCompra()` | — | — |
| 2 | Iniciar recepción | Click "Registrar recepción" | `store.recepcionesMaterial.crear({ordenCompraId, proyectoId})` | Estado `pendiente` | — |
| 3 | Marcar checks | Toggle checkboxes | `store.recepcionesMaterial.actualizarChecks(id, {...})` | Si los 3 = true → recalcula y transiciona OC | E-21 |
| 4 | Reportar defecto | Un check en false + submit descripción | `store.recepcionesMaterial.actualizarChecks(id, {..., estado: 'recibido_defectuoso'})` | — | E-21 (rama negativa) |
| 5 | Crear reproceso | Click "Crear reproceso" (solo defecto + proyecto) | `store.reprocesos.crear({proyectoId, origen: 'recepcion', descripcion})` | — | E-54 |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores en `app/erp/compras/` | `eslint` |
| CA-3 | Predicado E-21: 3/3 checks → OC `recibida_verificada`; 2/3 → OC sigue `pagada` | `lib/modules/f4/gates.ts` test |
| CA-4 | Round-trip test de `itemsOrdenCompra`/`recepcionesMaterial` en `mock-store.test.ts` | `npx tsx lib/data/mock-store.test.ts` |
| CA-5 | Recepción defectuosa de OC operativa no ofrece botón de reproceso | Test UI |

---

## 8. Verificación de integridad (pre-entrega)

- [x] `items_orden_compra`/`recepciones_material` citadas en `REGISTRO_DE_ENTIDADES.md` §7 (naming canónico confirmado: `recepciones_material`, no `recepciones`)
- [x] Todo estado en §2 existe en `glosario_h07.md` B.10
- [x] Toda regla en §4 tiene verificación mecánica
- [ ] Pendiente al abrir código: paso de datos previo (§1) antes de repartir esta pantalla a un lote de UI — no paralelizar con P-13/P-15 hasta que `lib/data/` esté extendido y verificado (mismo criterio que bloqueó el lote anterior hasta B3-0)
