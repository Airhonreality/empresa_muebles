# Auditoría de segunda pasada — convergencia v2/v3

Fecha: 2026-08-06
Ejecución: 3 subagentes en paralelo + verificación mecánica del Supervisor.

## Alcance

Segunda pasada tras el diamante de validación E1/E2, para capturar decisiones que
pudieron quedar huérfanas entre worktrees y dentro del propio V3. Verificación con
evidencia en `lib/db/schema.ts` (567 líneas) y `arnes/estado.md` de V3.

## Tabla de hallazgos y veredictos

| id | Hallazgo | Evidencia | Veredicto |
|----|----------|-----------|-----------|
| P-01a | `proyectos.comercialId` NO existe en schema (solo `clienteId` FK; sin ref a empleados) | schema.ts:440-466 | **RESUELTO** — columna + FK→`personas` añadidas |
| P-01b | enum `tipoProyecto` real = `['personalizado','producto_fijo']` | schema.ts:8 | **CONSISTENTE** con decisión FL-4; el diseño que decía `proyecto_a_medida|servicio_tecnico` quedó desactualizado |
| P-02/P-03 | no registradas en `estado.md` F2 (siguen "DISEÑAR"/"Pendiente") | estado.md V3 | **OK** — pendiente de diseño, no es pérdida |
| P-18/P-33 | descritas en el diseño pero no formalizadas en `estado.md` V3 (eslabón E2) | — | **PENDIENTE** — portar cierre F2/F3 |
| S-06 | `estado.md` línea seed menciona "6 roles" | — | **CONFLICTO** contra F0: 7 roles canónicos |
| S-08 | enum `rolEmpleado` real = `['admin','comercial','taller','finanzas']` | schema.ts:6 | **RESUELTO** — ampliado a 7 (decisión Supervisor #2) |
| t-074/075 | consistente con F0/F1 (7 roles, eventos catálogo 61, append-only `parametros_historial`) | — | **APROBADO**; marcas=tabla riesgo medio vs D-08/D-11 |
| `.opencode/` | políticas de agentes del arnés | — | **PRESERVAR** en commit V3 |
| `TercerInput/` | ya registrado como ola futura | — | **OK** |
| `arnes/skills/` (clone-d) | 100% contaminación de otro proyecto (~110 archivos) | Test-Path V3 = False | **DESCARTAR** al eliminar |

## Detalle de conflictos nuevos sin decidir

- **comercialId**: `proyectos` solo referencia a `clientes`. El kanban necesita saber qué
  comercial es dueño del proyecto. No hay columna ni decisión de schema.
- **tipoProyecto**: el schema ya decidió `personalizado|producto_fijo`; el diseño P-01
  había propuesto 3 valores. El schema manda.
- **roles**: el contrato de F0/F1 declara 7 roles; el enum real solo tiene 4
  (`admin, comercial, taller, finanzas`). Los IDs de roles nuevos
  (`desarrollador`, `compras`, `supervisora_qa`) no están en el schema.

### Eslabón E2 portado

- **Cierre F2/F3** portado de clone-dev → `arnes/estado.md` V3 (con `base_semanas=4` convergido, `espacios_artefactos` en schema, P-06..P-12, predicados P18/P33).
- **`destilacion_f3_publico.md`** copiado de clone-dev → `arnes/planes/` V3 (eslabón E1).
- `plan_ola7_maestro.md`: V3 es estrictamente superior (agrega M-06 capa técnica); clone-dev no aporta nada.
- Los diseños P-01..P-04 y F3 existían en V3 (untracked) — no había pérdida.

## Decisiones Supervisor — resueltas

| # | Decisión | Resolución |
|---|----------|-----------|
| 1 | ¿Agregar `comercialId` a `proyectos`? | **SÍ** — columna `comercial_id` añadida con FK→`personas` (schema.ts:440-467), alineada con `comercial_vendedor_id` de F3 y con la deprecación de `rolEmpleado`→`personas_roles` (ola F8) |
| 2 | ¿Brecha de roles (4 vs 7)? | **Ampliar enum** — `rol_empleado` ahora `['admin','comercial','desarrollador','compras','taller','finanzas','supervisora_qa']` (schema.ts:6). Nota: `roles`/`personas_roles` sigue como modelo canónico de asignación; el enum queda como atajo tipado en `usuarios.rol_empleado` hasta deprecación F8 |
| 3 | ¿`arnes/skills/` de clone-dev? | **DESCARTAR** — contaminación confirmada; V3 no lo tiene |

Verificado: `npx tsc --noEmit` EXIT 0, `npx eslint lib/db/schema.ts` EXIT 0.