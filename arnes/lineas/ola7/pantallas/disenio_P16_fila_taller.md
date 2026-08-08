# P-16 — Fila del Taller (avance por módulo)

**Fecha:** 2026-08-07 · **Estado:** propuesta · **Fase:** F5 · **Ruta:** `/app/erp/taller` · **Roles:** desarrollador, gerente, comercial (visibilidad H8)

---

## 1. Entidades que consume

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `modulos` | §8 | id, nombre_modulo, tipo_modulo, estado, cantidad, horas_estimadas, proyecto_id, espacio_variante_id, padre_id | Fila principal: un módulo = una fila |
| `proyectos` | §3 | id, nombre_proyecto, cliente_id | Nombre del proyecto en la fila |
| `ordenes_trabajo` | §8 | id, proyecto_id, estado, tipo | Orden que agrupa módulos |
| `clientes` | §3 | id, nombre | Nombre del cliente en la fila |
| `pedidos_web` | §10 | id | Enganche de pedido web (E-44) |

---

## 2. Estados que transiciona

| Estado origen | Acción | Estado destino | Evento | Validación |
|---|---|---|---|---|
| `por_armar` | "Iniciar armado" | `en_armado` | E-22 | Módulo recibió insumos (E-21) |
| `en_armado` | "Completar armado" | `armado` | E-22 | — |
| `armado` | "Listo para calidad" | `en_calidad` | E-23 (automático) | Selección manual del desarrollador |
| — | "Enganchar pedido web" | — | E-44 | Pedido web existente |

---

## 3. Vocabulario H07

| Label | Código | Entidad |
|---|---|---|
| "Por armar" | `por_armar` | `modulos.estado` |
| "En armado" | `en_armado` | `modulos.estado` |
| "Armado" | `armado` | `modulos.estado` |
| "En calidad" | `en_calidad` | `modulos.estado` |
| "Fila del taller" | — | `modulos` |

---

## 4. Reglas de negocio

| # | Regla | Validación |
|---|---|---|
| R1 | Solo módulos con insumos recibidos (E-21) aparecen en `por_armar` | Handoff automático desde F4 |
| R2 | "Listo para calidad" es una acción manual del desarrollador: selecciona módulos → click → estado cambia a `en_calidad` y E-23 se dispara automáticamente | Servidor |
| R3 | El detalle de tareas de producción (capa 2) está DIFERIDO | No se implementa en F5 |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `FilaTallerTable` | Client | Tabla densa (Familia A): 1ª columna sticky (módulo) |
| `ModuloRow` | Client | `modulo, proyecto, onAvanzar, onListoCalidad` |
| `EnganchePedidoModal` | Client (Radix Dialog) | `moduloId, pedidos[], onEnganchar` |
| `BadgeEstado` | Client | `estado: ModuloEstado` |

**Patrones M-06 L1:** Familia A responsive, Loading+Suspense, Toast, Badge `material`, `Promise.all(proyectos, modulos, clientes)`

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Trace |
|---|---|---|---|---|
| 1 | Cargar taller | Mount | `GET /api/erp/taller` (modulos + proyectos + clientes en paralelo) | — |
| 2 | Avanzar módulo | Click "Avanzar" | `PATCH /api/erp/modulos/:id {estado: siguiente}` | E-22 |
| 3 | Listo para calidad | Seleccionar + click | `PATCH /api/erp/modulos/:id {estado: 'en_calidad'}` + E-23 auto | E-23 |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | Tabla muestra módulos agrupados por proyecto | Playwright: verifica agrupación |
| CA-3 | Avanzar estado: `por_armar → en_armado → armado → en_calidad` secuencial | Test: intentar saltar estado → error |
| CA-4 | "Listo para calidad" solo visible en estado `armado` | Test: botón no renderiza en `por_armar` |
