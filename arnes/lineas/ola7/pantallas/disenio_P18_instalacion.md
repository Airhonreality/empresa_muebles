# P-18 — Instalación (Gate E-25)

**Fecha:** 2026-08-07 · **Estado:** propuesta · **Fase:** F5 · **Ruta:** `/app/erp/instalaciones` · **Roles:** instalador, gerente, comercial

---

## 1. Entidades que consume

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `instalaciones` | §8 | id, proyecto_id, rango_fecha_inicio, rango_fecha_fin, estado, adelantada_por | Entidad central |
| `proyectos` | §3 | id, nombre_proyecto, estado, direccion_obra | Contexto |
| `modulos` | §8 | id, nombre_modulo, estado ('aprobado') | Módulos listos para instalar |

---

## 2. Estados que transiciona

| Estado origen | Acción | Estado destino | Evento | Validación |
|---|---|---|---|---|
| — | Programar instalación | `programada` | — | Rango ≤5 días (R40) |
| `programada` | Iniciar instalación | `en_curso` + `proyectos.estado→en_instalacion` | E-25 | Guard E-24 (P24 aprobado) |
| `en_curso` | Marcar instalada | `instalada` + `proyectos.estado→instalado` | E-25 | — |
| `en_curso` | Marcar fallida | `fallida` → `reprocesos` (E-54) | E-54 | R18 modal |

---

## 3. Vocabulario H07

| Label | Código |
|---|---|
| "Programada" | `programada` |
| "En curso" | `en_curso` |
| "Instalada" | `instalada` |
| "Fallida" | `fallida` |
| "En instalación" | `en_instalacion` (proyecto) |

---

## 4. Reglas de negocio

| # | Regla | Validación |
|---|---|---|
| R1 | Rango instalación ≤ 5 días (R40, timezone) | Servidor: `fecha_fin - fecha_inicio ≤ 5 días` |
| R2 | "Iniciar" deshabilitado si P24 no aprobado (R16 con razón) | `∃ verificaciones E-24 aprobado` |
| R3 | "Marcar instalada" → `proyectos.estado = 'instalado'` automático | Servidor |
| R4 | Adelanto: `instalaciones.adelantada_por → check_produccion.id` | FK al check que adelantó |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `InstalacionLista` | Client | Tabla de instalaciones programadas/en curso |
| `InstalacionForm` | Client | `proyecto, onProgramar` — datepicker de rango (R40 timezone) |
| `InstalacionAcciones` | Client | Botones "Iniciar" (con guard E-24), "Instalada", "Fallida" (R18 modal) |

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Trace |
|---|---|---|---|---|
| 1 | Programar | Submit `InstalacionForm` | `POST /api/erp/instalaciones` | — |
| 2 | Iniciar | Click "Iniciar" | `PATCH proyecto {estado:'en_instalacion'}` + `PATCH instalacion {estado:'en_curso'}` | E-25 |
| 3 | Marcar instalada | Click "Instalada" | `PATCH proyecto {estado:'instalado'}` + `PATCH instalacion {estado:'instalada'}` | E-25 |
| 4 | Fallida | Click "Fallida" (R18 modal) | `POST /api/erp/reprocesos {origen:'instalacion'}` | E-54 |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | R40: rango >5 días → error | Test: fecha_inicio Lunes, fecha_fin Domingo → 422 |
| CA-3 | Guard E-24: iniciar sin P24 → botón deshabilitado con razón | Playwright: botón `disabled` + texto razón |
| CA-4 | Marcar instalada → proyecto.estado = 'instalado' | Test: GET proyecto → estado = 'instalado' |
