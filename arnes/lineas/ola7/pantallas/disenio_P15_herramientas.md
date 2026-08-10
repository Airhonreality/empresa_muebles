# P-15 — Herramientas de taller (inventario + reposición, gate E-45)

**Fecha:** 2026-08-10 · **Estado:** propuesta · **Fase:** F4 · **Ruta:** `/app/erp/herramientas` · **Roles:** taller, gerente

**Contexto de apertura:** ver `disenio_P13_orden_compra.md`. Introduce una entidad nueva (`herramientas`), pero el flujo de reposición reutiliza `ordenes_compra.crear()` de P-13 sin cambios (OC operativa, `proyectoId=null`) — no requiere gate nuevo, solo el `origen='operativa'` ya soportado.

---

## 1. Entidades que consume

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `herramientas` | §7 **[nueva — no materializada]** | id, nombre, estado_operativo, valor, foto_url, proveedor_id (nullable), created_at | Inventario de herramientas del taller |
| `ordenes_compra` | §7 | id, codigo_orden, estado | Reposición: OC operativa vinculada a la herramienta que la disparó |
| `proveedores` | §7 | id, nombre | Proveedor sugerido para la reposición |

**Paso de datos previo (obligatorio antes de código):**
- `lib/data/contracts.ts`/`mock-store.ts`/`fixtures.ts`/`drizzle-impl.ts`: agregar `Herramienta` + dominio `herramientas` (listar, crear, actualizarEstado, `reponer(id)` → llama internamente a `ordenesCompra.crear({proveedorId, montoTotal, proyectoId: null, mecanicaPago: 'unico'})` y marca `necesita_reposicion` en la herramienta), con round-trip test.
- No requiere tocar `ordenes_compra` — el campo `proyectoId: string | null` y el patrón de OC operativa ya existen desde el lote F5/F6.

---

## 2. Estados que transiciona

| Estado origen | Acción del usuario | Estado destino | Gate / evento | Validación |
|---|---|---|---|---|
| — | Registrar herramienta nueva | `operativa` | — | Nombre + valor |
| `operativa` | Enviar a mantenimiento | `mantenimiento` | — | — |
| `mantenimiento` | Completar mantenimiento | `operativa` | — | — |
| `operativa` / `mantenimiento` | Reportar daño | `reparacion` | — | — |
| `reparacion` | Reparación fallida / obsoleta | `fuera_servicio` | — | — |
| Cualquiera | Marcar para reposición | `necesita_reposicion` | **E-45** | Dispara `ordenes_compra.crear` operativa |

**Predicado E-45:** no es un gate de bloqueo (no impide nada), es un disparador: `herramienta.estado = 'necesita_reposicion'` → crea automáticamente una OC operativa (`origen='operativa'`) que entra a la cola normal de P-13/P-21.

---

## 3. Vocabulario H07

| Label | Código | Entidad |
|---|---|---|
| "Operativa" | `operativa` | `herramientas.estado_operativo` |
| "Mantenimiento" | `mantenimiento` | `herramientas.estado_operativo` |
| "En reparación" | `reparacion` | `herramientas.estado_operativo` |
| "Fuera de servicio" | `fuera_servicio` | `herramientas.estado_operativo` |
| "Necesita reposición" | `necesita_reposicion` | `herramientas.estado_operativo` |
| "Compra operativa" | `origen='operativa'` | `ordenes_compra` (mismo label que P-13 §3) |

---

## 4. Reglas de negocio

| # | Regla | Validación | Verificación mecánica |
|---|---|---|---|
| R1 | Marcar `necesita_reposicion` crea automáticamente una OC operativa en `solicitada` | Store, misma operación | Test: `reponer(id)` → devuelve `Herramienta` + `OrdenCompra` con `proyectoId=null` |
| R2 | Una herramienta no puede tener dos OC de reposición abiertas simultáneamente (evita duplicar el pedido) | Store | Test: 2do `reponer()` sobre la misma herramienta con OC pendiente → rechaza o reutiliza la existente |
| R3 | `fuera_servicio` es terminal — no admite transición a `operativa` directa, solo vía reposición (nueva herramienta) | UI (oculta transición) | — |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `TablaHerramientas` | Client | Lista con `ImagePicker` de foto, estado, valor, filtro por estado |
| `NuevaHerramientaModal` | Client (`Modal`) | Nombre, valor (`MoneyInput`), foto |
| `AccionesHerramienta` | Client | Botones de transición según estado actual |
| `BadgeEstadoHerramienta` | Client | — |

**Patrones M-06 L1:** `ImagePicker` (ya existe, mismo patrón que P-27 catálogo), `MoneyInput`.

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Side effect | Trace |
|---|---|---|---|---|---|
| 1 | Cargar pantalla | Mount | `store.herramientas.listar()` | — | — |
| 2 | Registrar herramienta | Submit modal | `store.herramientas.crear(...)` | — | — |
| 3 | Cambiar estado | Click acción | `store.herramientas.actualizarEstado(id, estado)` | — | — |
| 4 | Marcar reposición | Click "Necesita reposición" | `store.herramientas.reponer(id)` | Crea OC operativa, visible en P-13 | E-45 |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `npx tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | `npx eslint .` = 0 errores en `app/erp/herramientas/` | `eslint` |
| CA-3 | `reponer(id)` crea OC operativa visible en `store.ordenesCompra.listar()` | `lib/data/mock-store.test.ts` |
| CA-4 | `/erp/herramientas` reachable desde `ERP_NAV` | Nav-owner del lote agrega el ítem |

---

## 8. Verificación de integridad (pre-entrega)

- [x] `herramientas` citada en `REGISTRO_DE_ENTIDADES.md` §7, estados en `glosario_h07.md` B.19
- [x] E-45 no reinventa mecánica de OC — reutiliza `ordenes_compra` operativa tal cual quedó definida en el lote F5/F6
- [ ] Pendiente al abrir código: paso de datos previo (§1), puede ir en paralelo con el de P-14 (entidades distintas, sin superficie compartida) pero ambos antes de repartir pantallas de UI
