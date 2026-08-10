# P-24 — Pedidos web (admin) + enganche a producción

**Fecha:** 2026-08-10 · **Estado:** propuesta · **Fase:** F7 · **Ruta:** `/app/erp/pedidos-web` · **Roles:** comercial, gerente

**Contexto de apertura:** numeración heredada de `d3_ui_b3_5_cliente_documentacion.md` (pase histórico 2026-08-03), la única fuente que distilló F7 a 3 pantallas concretas (P-24/P-25/P-26). **P-25 (garantía: agenda + orden + check de completitud, E-36/E-37/E-61) ya está construida — es `disenio_P20_garantia.md`, verificado en el lote F5/F6 bajo numeración nueva.** No requiere trabajo nuevo. Este documento cubre solo P-24; P-26 tiene su propio documento.

---

## 1. Entidades que consume

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `pedidos_web` | §10 | id, cliente_id, estado, total_pedido, proyecto_id (nullable) **[campo nuevo, ver abajo]**, created_at | Listado admin de pedidos entrantes desde la tienda (F-02) |
| `ordenes_trabajo` | §8 | id, proyecto_id, pedido_web_id, tipo, estado | Enganche: crea la OT que conecta el pedido con producción |
| `clientes` | §3 | id, nombre, email | Identificar al cliente del pedido |
| `proyectos` | §3 | id, nombre_proyecto | Proyecto existente al que se engancha, o el que se crea desde el pedido |

**Paso de datos previo (pequeño):**
- `lib/data/contracts.ts`: agregar `proyectoId: string | null` a `PedidoWeb` (hoy no existe — sin este campo no hay forma de saber si un pedido ya fue enganchado ni a qué proyecto).
- `lib/data/contracts.ts`/`mock-store.ts`: agregar `pedidosWeb.listar()` (hoy solo existe `porCliente()`, insuficiente para una vista admin global) y `pedidosWeb.enganchar(id, proyectoId)` (marca `estado='enganchado'`, setea `proyectoId`, y llama `ordenesTrabajo.crear({proyectoId, tipo: 'produccion', pedidoWebId: id})` en la misma operación).
- No toca `ordenes_trabajo` — `pedidoWebId` en `OrdenTrabajo.crear()` ya existe desde el lote F5/F6, nunca se había usado.

---

## 2. Estados que transiciona

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| — | Cliente hace pedido desde F-02 (fuera de alcance F10: sin checkout real, ver `disenio_F02_tienda_web.md` R5) | `nuevo` | — | — |
| `nuevo` | Comercial revisa y selecciona/crea proyecto | `enganchado` | **E-44** | Proyecto válido (existente o recién creado) |
| `nuevo` | Comercial descarta (spam, duplicado, etc.) | `cancelado` | — | Motivo obligatorio |

**Nota de alcance:** dado que F-02 (tienda) es informativa (sin botón de compra, decisión explícita del lote F5/F6), en el prototipo F10 los `pedidos_web` en estado `nuevo` se originan como datos de fixture o se registran manualmente por el comercial (ej. pedido recibido por WhatsApp), no por un checkout real. Esta pantalla es admin-only; no hay contraparte de cliente creando pedidos todavía.

---

## 3. Vocabulario H07

| Label | Código | Entidad |
|---|---|---|
| "Pedido web" | — | `pedidos_web` |
| "Nuevo" | `nuevo` | `pedidos_web.estado` |
| "Enganchado" | `enganchado` | `pedidos_web.estado` |
| "Cancelado" | `cancelado` | `pedidos_web.estado` |
| "Enganchar a producción" | — | Acción E-44 |
| "Orden de trabajo" | — | `ordenes_trabajo` (nunca "OT" en la UI, mismo principio que "OC") |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Enganchar exige un `proyectoId` válido (existente o creado en el mismo flujo) | Store | Test: `enganchar(id, '')` → rechaza |
| R2 | Un pedido solo se engancha una vez — reintentar sobre uno ya `enganchado` no crea una segunda OT | Store | Test: 2do `enganchar()` sobre el mismo pedido → no-op, retorna la OT existente |
| R3 | `ordenes_trabajo.tipo` para el enganche es `'produccion'` (no `garantia`, no otro) | Store | Test: OT creada tiene `tipo='produccion'` |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `TablaPedidosWeb` | Client | Lista filtrable por estado, cliente, total |
| `EngancharPedidoModal` | Client (`Modal`) | Selector de proyecto existente (`SmartSearch`) o atajo "Crear proyecto nuevo" |
| `BadgeEstadoPedido` | Client | — |

**Patrones M-06 L1:** `SmartSearch` para selector de proyecto (mismo componente que P-13 usa para proveedor).

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace |
|---|---|---|---|---|---|
| 1 | Cargar pantalla | Mount | `store.pedidosWeb.listar()` + `store.clientes.listar()` + `store.proyectos.listar()` | — | — |
| 2 | Enganchar a proyecto existente | Submit modal (proyecto seleccionado) | `store.pedidosWeb.enganchar(id, proyectoId)` | Crea `ordenes_trabajo` | E-44 |
| 3 | Enganchar creando proyecto | Submit modal ("Crear proyecto nuevo") | `store.proyectos.crear(...)` → `store.pedidosWeb.enganchar(id, nuevoProyecto.id)` | Crea proyecto + OT | E-44 |
| 4 | Cancelar pedido | Click "Cancelar" + motivo | `store.pedidosWeb.actualizarEstado(id, 'cancelado')` | — | — |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores en `app/erp/pedidos-web/` | `eslint` |
| CA-3 | Enganche crea exactamente una `orden_trabajo` con `pedidoWebId` correcto | `lib/data/mock-store.test.ts` |
| CA-4 | Reenganchar un pedido ya enganchado no duplica la OT | Test dedicado |
| CA-5 | `/erp/pedidos-web` reachable desde `ERP_NAV` | Nav-owner del lote agrega el ítem |

---

## 8. Verificación de integridad (pre-entrega)

- [x] `pedidos_web`/`ordenes_trabajo` citadas en `REGISTRO_DE_ENTIDADES.md` §10/§8
- [x] Confirmado por lectura directa de `disenio_P20_garantia.md` que P-25 (histórico) ya está cerrado — no se re-diseña
- [ ] Pendiente al abrir código: el campo `proyectoId` nuevo en `PedidoWeb` + `listar()`/`enganchar()` — paso de datos chico, puede ir junto con el de P-15 (ambos tocan dominios distintos: `pedidos_web` vs `herramientas`, sin superficie compartida)
