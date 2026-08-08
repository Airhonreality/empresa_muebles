# P-17 — Calidad: Veredicto (Gate E-24)

**Fecha:** 2026-08-07 · **Estado:** propuesta · **Fase:** F5 · **Ruta:** `/app/erp/calidad` · **Roles:** comercial vendedor (veredicto), desarrollador (push E-23), gerente (ve)

---

## 1. Entidades que consume

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `verificaciones` | §6 | id, proyecto_id, tipo_gate('calidad'), veredicto, verificador_id, creado_en | Gate E-24 |
| `citaciones_calidad` | §8 | id, proyecto_id, modulos_ids, estado, fecha | Push del desarrollador (E-23) |
| `proyectos` | §3 | id, nombre_proyecto, estado, verificador_id | Contexto |
| `modulos` | §8 | id, nombre_modulo, estado | Módulos en `en_calidad` |
| `reprocesos` | §6 | id, proyecto_id, origen('calidad'), modulo, estado | Rama negativa E-24 |

---

## 2. Estados que transiciona

| Estado origen | Acción | Estado destino | Evento | Validación |
|---|---|---|---|---|
| `en_calidad` | Comercial aprueba | `aprobado` (módulo) | E-24 | `P24 ∧ verificador_id = session.usuarioId` |
| `en_calidad` | Comercial rechaza | `en_calidad` (módulo, no cambia) + crea `reprocesos` | E-54 | `verificador_id = session.usuarioId` |

**Predicado P24:** `proyectos.estado='armado' ∧ ∃ citacion con estado='citada' ∧ ∃ verificaciones.tipo_gate='calidad' con veredicto='aprobado' ∧ verificador_id = proyectos.verificador_id ∧ creado_en ≥ citacion.fecha`

**Determinismo:** al aprobar E-24, `proyectos.estado` NO cambia (permanece `armado`). Solo E-25 lo saca.

---

## 3. Vocabulario H07

| Label | Código | Entidad |
|---|---|---|
| "Aprobado" | `aprobado` | `verificaciones.veredicto` |
| "Rechazado" | `rechazado` | `verificaciones.veredicto` |
| "En calidad" | `en_calidad` | `modulos.estado` |
| "Citación de calidad" | — | `citaciones_calidad` |

---

## 4. Reglas de negocio

| # | Regla | Validación |
|---|---|---|
| R1 | Solo el comercial vendedor (`proyectos.verificador_id`) puede emitir veredicto | Servidor: `session.usuarioId === proyecto.verificador_id` |
| R2 | Sin citación previa, el veredicto está deshabilitado (R16 con razón) | `∃ citacion.estado='citada'` |
| R3 | Rechazo → `reprocesos.origen='calidad'` automático (E-54, R18 con modal) | Servidor |
| R4 | `proyectos.estado` NO cambia al aprobar (determinismo anti-reapertura) | Test: estado antes = estado después de aprobar |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `CalidadPanel` | Client | Familia B: citaciones pendientes + veredictos |
| `CitacionCard` | Client | `citacion, modulos[]` — muestra módulos citados |
| `VeredictoAccion` | Client | `aprobado/rechazado`, deshabilitado con razón (R16) |
| `VeredictoModal` | Client (Radix Dialog, focus trap, R10 prominente) | `citacion, onVeredicto` |

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Trace |
|---|---|---|---|---|
| 1 | Cargar calidad | Mount | `GET /api/erp/calidad` (citaciones + verificaciones + modulos en paralelo) | — |
| 2 | Aprobar | Click "Aprobar" | `POST /api/erp/verificaciones {tipo_gate:'calidad', veredicto:'aprobado'}` | E-24 |
| 3 | Rechazar | Click "Rechazar" | `POST /api/erp/reprocesos {origen:'calidad'}` (R18 modal) | E-54 |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | P24: aprobar sin citación → botón deshabilitado (R16) | Playwright: botón `disabled` sin citación |
| CA-3 | Determinismo: aprobar E-24 → `proyectos.estado` sigue `armado` | Test: GET proyecto después de aprobar → estado = 'armado' |
| CA-4 | Verificador incorrecto → 403 | Test: POST con otro usuario → 403 |
