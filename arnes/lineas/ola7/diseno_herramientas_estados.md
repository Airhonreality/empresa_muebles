# Diamante — Máquina de estados de Herramienta (D-05)

**Fecha:** 2026-08-10 · **Estado:** ejecutado en Etapa 1 (dato + UI) — este documento es el registro de la resolución, no queda trabajo para Etapa 2 · **Origen:** auditoría de Javier, hallazgo D-05 (`backlog_auditoria_pantallas.md`)

## Goal

`app/erp/herramientas/page.tsx` (P-15) tenía una máquina de estados mal diseñada: desde `operativa`, dos botones ("Enviar a mantenimiento", "Reportar daño") llevaban a estados de "fuera de uso temporal" sin ninguna regla que los distinguiera (violación de Axioma 1, Independencia — dos acciones capturando la misma señal). Desde `reparacion`, solo existía "Reparación fallida" → `fuera_servicio`; no había camino de vuelta a `operativa`.

## Resolución (ejecutada)

- `EstadoOperativoHerramienta` colapsado de 5 a 4 valores: `'operativa' | 'reparacion' | 'fuera_servicio' | 'necesita_reposicion'` (`mantenimiento` eliminado — `lib/data/contracts.ts`).
- Fixture `herr02` migrado de `mantenimiento` a `reparacion` (`lib/data/fixtures.ts`).
- `app/erp/herramientas/page.tsx`: desde `operativa`, un solo botón "Enviar a reparación" → `reparacion`. Desde `reparacion`, dos botones: "Reparación exitosa" → `operativa` (nuevo) y "Reparación fallida" → `fuera_servicio` (existente). Filtro de estado y labels actualizados.

Estado resultante: `operativa ⇄ reparacion → fuera_servicio` (terminal) + `necesita_reposicion` (disparador ortogonal de E-45, sin cambios).

## Verificación

`tsc --noEmit` = 0, `eslint .` = 0 en el archivo tocado, 60/60 tests de `mock-store.test.ts` (incluye round-trip de personas/proveedores agregado en la misma etapa). Sin gaps pendientes — este diamante no pasa a Etapa 2.
