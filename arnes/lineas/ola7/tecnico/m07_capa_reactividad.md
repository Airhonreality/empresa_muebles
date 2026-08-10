# M-07 — Contrato de reactividad del subsistema de datos mock

**Fecha:** 2026-08-09 · **Estado:** aprobado (checkpoint Supervisor, decisión en línea) · **Fase:** F10 · **Riesgo:** medio

**Por qué existe este archivo:** `registro_hallazgos_poc4.md` (POC-10#2, POC-10#4) decidió el 2026-08-09 que "el data layer mock DEBE ser reactivo... regla cosificada en M-07" — pero M-07 nunca se creó como artefacto. La decisión quedó en prosa, sin dónde aterrizar, y el síntoma ("mutar y no se refleja en pantalla") se replicó en cada pantalla nueva de B1 (items, artefactos, kanban, y por último el renombrado de `nombreEspacio`, que llevó ~10 vueltas de debugging porque nadie tenía un chequeo mecánico que confirmara si la causa era el store o la UI). Este archivo cierra ese ciclo: la regla existe, tiene código que la implementa, y tiene un test que la prueba.

---

## 1. El contrato

**Regla única:** ninguna pantalla de `app/erp/` lee el store con `getDataStore()`. Toda lectura pasa por `useDataStore()` (`lib/data/index.ts`).

- `getDataStore()` sigue existiendo — es el singleton de bajo nivel que crea/memoiza la instancia del store. Pero llamarlo directamente en un componente no re-renderiza a nadie cuando el store muta: es exactamente el bug documentado en POC-10#2.
- `useDataStore()` envuelve `getDataStore()` con `useSyncExternalStore`, suscribiéndose al store. Cuando **cualquier** mutación ocurre —desde cualquier componente montado—, **todos** los componentes que llaman `useDataStore()` se re-renderizan automáticamente.
- Cada método mutador del store (`crear`, `actualizar`, `eliminar`, `actualizarEstado`, etc., en `lib/data/mock-store.ts`) llama `notify()` internamente antes de retornar. Ninguna pantalla necesita recordar llamar un `refresh()`/`onRefresh()` manual — por diseño, no puede olvidarlo, porque ya no existe ese paso.

**Prohibido en `app/**`:** `import { getDataStore } from '@/lib/data'`. Enforced por `eslint.config.mjs` (`no-restricted-imports`) — el build falla si alguien lo reintroduce.

## 2. Qué cambió (implementación, 2026-08-09)

| Archivo | Cambio |
|---|---|
| `lib/data/contracts.ts` | `DataStore` gana `subscribe(listener): unsubscribe` y `getVersion(): number` |
| `lib/data/mock-store.ts` | `listeners`/`version`/`notify()` internos; `notify()` al final de cada mutación de cada dominio (proyectos, clientes, espacios, items, artefactos, parámetros, contratos) |
| `lib/data/drizzle-impl.ts` | `subscribe`/`getVersion` como no-ops (no lanzan `notImplemented` — un componente puede montarse antes de leer datos reales) |
| `lib/data/index.ts` | nuevo `useDataStore()` (hook, `useSyncExternalStore`) |
| `lib/data/mock-store.test.ts` | **nuevo.** Round-trip por dominio (crear/leer/actualizar/eliminar) + contrato de `subscribe`/`getVersion`. Incluye el caso exacto reportado (renombrar `nombreEspacio` y leerlo de vuelta). `npx tsx lib/data/mock-store.test.ts` — no requiere `DATABASE_URL` (no toca `lib/db/`). |
| 6 pantallas (`comercial`, `cotizador/[proyectoId]`, `cotizador/new`, `cotizador/page`, `cotizador/ContratoModal`, `finanzas/parametros`) | `getDataStore()` → `useDataStore()`; se elimina todo `useState(0)`/`setTrigger`/`onRefresh` manual (ya no hace falta) |
| `eslint.config.mjs` | regla `no-restricted-imports` que bloquea `getDataStore` en `app/**` |

**Nota sobre memoización:** dos `useMemo` en `cotizador/[proyectoId]/page.tsx` (`espaciosBase`, `tarifas`) siguen memoizando por rendimiento, pero ahora dependen de `store.getVersion()` en vez de un `trigger` manual o de la referencia del store (que nunca cambia — esa referencia estable fue la causa de POC-10#2 y POC-10#4).

## 3. Qué NO se hizo (y por qué)

- **No se adoptó Zustand/React Query/SWR.** `useSyncExternalStore` es React puro (0 deps), resuelve el síntoma actual completo, y respeta la restricción del Diamante 4 de no añadir librerías sin checkpoint. Si al migrar a `DATA_IMPL=drizzle` el patrón síncrono deja de alcanzar (datos que vienen de una API real, con latencia), se reevalúa entonces — no antes.
- **No se dividió en hooks por dominio** (`useProyectos()`, `useEspacios()`, etc.). Un solo `useDataStore()` cubre las ~6 pantallas actuales sin la complejidad de mantener 8 hooks separados. Si el árbol de componentes crece lo suficiente para que el re-render global importe por rendimiento, se particiona entonces.
- **No se tocó `PLANTILLA_PANTALLA.md`/`PLANTILLA_QA.md`.** Esas plantillas gobiernan la banda de diseño F0–F9 (ya cerrada) y las verificaciones de gates a nivel DB — un concern distinto al patrón de código del prototipo mock de F10. La referencia viva para pantallas nuevas de F10 es este archivo + `plan_f10.md` §1.2.

## 4. Regla para pantallas nuevas (B2 en adelante)

Toda pantalla nueva de `app/erp/` que lea o mute el store:
1. Usa `useDataStore()`, nunca `getDataStore()` directo (el guante de eslint lo bloquea de todas formas).
2. No inventa su propio `trigger`/`refresh`/`onRefresh`. Si una mutación no se refleja, el bug está en el store (falta `notify()` en ese método) o en el componente que no llamó `useDataStore()` — no hay un tercer lugar donde buscar.
3. Si el dominio nuevo tiene un método mutador nuevo en `mock-store.ts`, ese método **debe** llamar `notify()` antes de retornar. El test de round-trip (`mock-store.test.ts`) es el lugar para probarlo — se espera que cada dominio nuevo agregue sus propios casos ahí antes de darse por "hecho" (criterio de `arnes/roles/qa.md`: tareas de tipo `datos` requieren round-trip verificado, no "se ve bien en el navegador").

## 5. Verificación

| # | Comando | Resultado (2026-08-09) |
|---|---|---|
| V-1 | `npx tsc --noEmit` | 0 errores |
| V-2 | `npx eslint .` | 0 errores, 0 warnings |
| V-3 | `DATA_IMPL=mock npx next build` | 14/14 rutas |
| V-4 | `npx tsx lib/data/mock-store.test.ts` | 12/12 pruebas OK, incluida la regresión de renombrar espacio |
| V-5 | `grep -r "getDataStore" app/` | 0 resultados (todas las pantallas usan `useDataStore`) |
