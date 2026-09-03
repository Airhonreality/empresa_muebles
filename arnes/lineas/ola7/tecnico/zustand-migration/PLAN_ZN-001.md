# Plan ZN-001: Fase 0 corregida — store Zustand 5 de cotizador (solo lectura) + selectors reactivos

**ID de tarea**: ZN-001
**Zona**: datos (`lib/data/stores/`)
**Tipo**: andamiaje / configuración
**Riesgo**: bajo
**Estado**: aprobado por Supervisor (2026-09-02)

## Objetivo

Existirá un store Zustand 5 del cotizador (solo lectura) y sus selectores reactivos, tipados sin `any`, que compilan con `tsc --noEmit = 0` y pasan una verificación ejecutable. Sin cablear a ninguna pantalla todavía (eso es Fase 1 de ZU_03).

## Contexto de la corrección

La implementación previa fue rechazada dos veces: 10 errores de compilación, `import create from 'zustand'` inválido en Zustand 5, currying absurdo en `porVariante`, `state` fuera de alcance, revert `return true` sin revertir, y selectors leyendo campos inexistentes. Este plan corrige la causa raíz: Fase 0 = solo lectura, import named, fuente única de tipos, cero `any`.

## Archivos afectados (en orden de implementación)

- `lib/data/stores/types.ts`: modificar — fuente única de estado (`CotizadorState`) + `cotizadorInitialState()`; limpiar imports sin uso.
- `lib/data/stores/useCotizadorStore.ts`: reescribir — Zustand 5 named import, estado `CotizadorState`, acciones de lectura/hidratación.
- `lib/data/stores/selectors.ts`: reescribir — selectores reactivos con `useShallow`, tipados, sin `any`.
- `lib/data/stores/useCotizadorStore.test.ts`: crear — verificación ejecutable del store.
- `arnes/lineas/ola7/tecnico/zustand-migration/PLAN_ZN-001.md`: crear — este plan.

## Fuera de zona (NO tocar)

`app/`, `components/`, `lib/data/store.ts`, `lib/data/mock-store.ts`, `lib/data/DataStoreProvider.tsx`, `lib/data/contracts.ts`. Nada de `crearItemOptimistic`/`createMockStore`/`notify` (Fase 2).

## Criterios de aceptación (mecánicamente verificables)

1. `npx tsc --noEmit` → 0 errores (baseline previo: 10).
2. Ningún `: any` en `lib/data/stores/` (grep: `(state: any)|: any[]`).
3. `useCotizadorStore.ts` usa `import { create } from 'zustand'` (named) y no hay `import create from 'zustand'`.
4. Los campos que consumen los selectors (`items`, `jornadasMap`, `gruposExpandidos`) existen en `CotizadorState` de `types.ts` y en el store.
5. El `State` del store NO redefine un tipo reducido divergente: usa `CotizadorState` (fuente única).
6. `DATABASE_URL='postgres://test:test@localhost:5432/no_connect_placeholder' npx tsx lib/data/stores/useCotizadorStore.test.ts` pasa (getState/setState, hidratar, avisarCambio, resetear).
7. `git status` sin untracked `tsc-*.txt` ni `env.local.bak_pooler` en la raíz.

## Verificación

- `npx tsc --noEmit`: criterios 1, 2, 3, 4, 5.
- `DATABASE_URL=... npx tsx lib/data/stores/useCotizadorStore.test.ts`: criterio 6.
- `git status` + `Remove-Item` de basura: criterio 7.

## Notas para QA

- Los selectors son hooks de React: NO se prueban con tsx sin renderer. El test cubre la capa de datos del store (la fuente de los campos que consumen). La coherencia store↔selector se verifica por lectura cruzada (criterios 4 y 5).
- El archivo `types.ts` es compartido con futuras fases (Comercial/Finanzas usan tipos del mismo archivo); no romper sus exports.
