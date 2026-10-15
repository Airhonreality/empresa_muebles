# Estado — línea `auditoria_cascadas`

**Abierta:** 2026-10-15. **Estado:** abierta (plan escrito, sin ejecutar).
**Origen:** bug de producción al eliminar un espacio del cotizador (`hallazgo_2026-10-15_cascada_espacios.md`).

## Qué se sabe

- El borrado en cascada de esta aplicación es **manual, en código** (`lib/data/actions/core.ts`), no declarativo: 119 FK, **115 `NO ACTION`**, 2 `CASCADE`, 2 `SET NULL` (medido el 2026-10-15 sobre la base real).
- El bug de espacios fue un hueco de esa cascada manual (`espacio_variante_acabados` faltaba), ya arreglado y desplegado (`e7961a1`).
- Hay **huecos latentes** confirmados: `eliminarProyectoAction` también omite `espacio_variante_acabados`; `eliminarEspacioAction` no cubre `grupos_item` ni `portafolio` (hoy con 0 filas → aún no reproducen).
- El problema es **general**, no de este caso: cualquier schema con FKs `NO ACTION` y borrados a mano tiene la misma fragilidad ante tablas nuevas.

## Qué está bloqueado

- Nada de código. La ejecución de la auditoría (clasificar las 119 relaciones, escribir la migración idempotente, el test de cobertura) depende de una **decisión de diseño del Supervisor**: opción A (cascada en la BD), B (manual + test) o C (híbrido, recomendado). Ver `plan_auditoria_cascadas.md` §6.
- Aplicar cualquier `ALTER TABLE` sobre producción requiere checkpoint (mismo protocolo que la migración 0027).

## Próxima acción permitida

1. Checkpoint del Supervisor sobre la opción A/B/C.
2. Con la opción elegida: ejecutar el censo de las 119 FK (§5 del plan) y producir la lista de huecos de cobertura.
3. Registrar la ejecución como tarea del ledger (creada: `t-180`).

## Referencias

- `hallazgo_2026-10-15_cascada_espacios.md` — el caso concreto y su evidencia.
- `plan_auditoria_cascadas.md` — diagnóstico, metodología repetible, opciones y criterios de aceptación.
