# Plan: cotizador sobre TanStack Query — server-state con lectura escopada, mutation optimista e ítems encadenables

**ID de tarea:** (pendiente de asignar en ledger)  
**Fecha:** 2026-09-05  
**Zona:** server-state del ERP (`lib/data/actions` + `lib/data/queries` + `app/erp/cotizador/**`) — una sola zona lógica de estado de servidor; cruza `lib/data` y `app/erp/cotizador` por precedente de ZN-002/ZN-003 (misma tarea única planificada por la línea técnica).  
**Tipo:** Lógica de negocio / contrato + integración de librería nueva  
**Riesgo:** alto · **Frena al humano:** sí (checkpoint de dependencia nueva aprobado por Supervisor 2026-09-05 en `estado.md` §"DECISIÓN DE ARQUITECTURA CORREGIDA"; este plan es el siguiente checkpoint antes de ejecutar)

**Depende de:** decisión vigente `estado.md` (TanStack Query como server-state ERP, zustand → UI local, público → RSC). Supera la Vía A de `zustand-migration/` (ver `ZU_03` §SUPERACIÓN).

**Estado de decisiones (checkpoint Supervisor, 2026-09-05):**
- **DEC-1 ✓** — `crearItemAction` idempotente con id cliente-generado (patrón Linear, precedente `proyectos.crear`, `estado.md:188`).
- **DEC-7 ✓** — `crearEspacioAction` TAMBIÉN idempotente con id cliente (robustez total: evitar recodificar después). Ambas escrituras de alta frecuencia del cotizador, mismas reglas.
- **DEC-2 ✓** — `QueryClientProvider` ERP-wide en `app/erp/layout.tsx`; root público intacto.
- **DEC-1b ✗** — descartada (mantener id servidor + bloquear edición en vuelo NO resuelve T2/T3).

---

## 0. Contexto y evidencia que exige el cambio

Síntomas en campo (2026-09-05): esperas ~5 s por interacción, filas fantasma que se sobreescriben al default al confirmar, imposibilidad de encadenar agregados, 1 caso de 3 filas revertidas.

Causa raíz verificada en código:
- Cada mutación pasa por el DataStore: `await ServerAction → notify() → version++` y el líder long-poll además re-fetchea **las 64 tablas** (`fetchSnapshotAction`, `DataStoreProvider.tsx:154`) → `applySnapshot` reemplaza `data` completo → re-render global de todos los `useDataStore()` (`page.tsx:115-119,121,149`).
- El cotizador tiene **doble caché**: Zustand rehidratado por `CotizadorSincronizador` (`layout.tsx:14`, `hidratador.ts:43-60`) en cada versión; el render real de ítems sale de selectores Zustand (`useSelectPorVariante`, `selectors.ts:44-50`), mientras las escrituras van al DataStore.
- `crearItemOptimistic` inserta `temp-<timestamp>-<rand>` (`useCotizadorStore.ts:61`), y al confirmar **pisa** toda fila temp (swap) — si el usuario editó la cantidad de una fila temp en vuelo, su edición muere (`useCotizadorStore.ts:87-93`). La rehidratación por snapshot compite con el swap (doble escritura de conflicto).
- `usePendingGuard` bloquea el SmartSearch mientras la Server Action vuela (`page.tsx:1331-1357`): no se pueden encadenar agregados.

El insert de `crearItemAction` es un INSERT plano `~ms` (`core.ts:347-359`). El costo no es la acción: es el **round-trip completo + snapshot de 64 tablas + re-render global + doble caché** que la acompaña.

---

## 1. Arquitectura destino

```text
ANTES (double-cache, version-based, full-snapshot)
  Servidor: core.ts (Server Actions) ── SEO por mutación ──► DataStoreProvider (long-poll 64 tablas, LISTEN/NOTIFY, BroadcastChannel)
                                                                  │ notify() version++
                                                                  ▼
  page.tsx ── useDataStore() ──► re-render global por versión
       └── CotizadorSincronizador ──► Zustand (2ª caché) ──► useSelectPorVariante (render real de items)

DESPUÉS (query-based, escopado, mutation optimista)
  Servidor: core.ts (escrituras)  +  lecturas-cotizador.ts (NUEVA: obtenerSnapshotCotizadorAction, ~10 SELECTs escopados al proyecto)
  Cliente:
    queryClient (QueryClientProvider en app/erp/layout.tsx)
       └── useQuery(['cotizador', proyectoId]) ─► CotizadorSnapshot (1 sola read action)
              ├── slices derivados por useMemo: itemsPorEspacio, espacios, jornadasMap, cliente, contratos, hitos,
              │                                        catalogo, parametros, acabados, artefactosPorEspacio ──► props estables → EspacioGroupMemo ✓
              └── useMutation(SC action) ─► onMutate optimista (helpers puros) / onError rollback / onSettled invalidación selectiva
    CotizadorSnapBridge (en layout, reemplaza CotizadorSincronizador):
         seeds QueryClient desde el DataStore SSR en el 1er montaje (cero flash)
         y en cada version++ (store.subscribe) → invalidateQueries(['cotizador', proyectoId])
         → es lo único que queda del long-poll en esta pantalla (reactividad multi-usuario preservada ≤4s)
```

Principios:
1. **Una sola fuente de verdad por pantalla**: el cotizador deja de leer del DataStore con `useDataStore()`/`version`. Sus lecturas salen de `useQuery` sobre `obtenerSnapshotCotizadorAction`; sus escrituras salen de `useMutation` a las Server Actions. El DataStore/persiste para las otras ~43 pantallas (fuera de alcance).
2. **Reactividad multi-usuario se conserva vía invalidation bridge**: `store.subscribe` (cambio de versión global) → invalidar `["cotizador", proyectoId]`. Lo que hoy provoca re-render de todo, ahora provoca UNA refetch escopada (~10 SELECTs) cuya identidad de datos deduplica los re-renders. No regresión vs. hoy (hoy también re-renderiza todo), y la escritura local ya no dispara refetch de 64 tablas.
3. **Mutaciones optimistas con helpers puros** (Linear): el id de ítems **y variantes** es **cliente-generado permanente** (mismo patrón ya aprobado para `proyectos.crear`, `estado.md:188`); `crearItemAction` y `crearEspacioAction` pasan a idempotentes (`.onConflictDoNothing` — DEC-1 + DEC-7) → editar una fila/variante recién creada en vuelo NO se pierde, los reintentos/doble-submit no duplican, y no existe swap temp→confirmado que pise ediciones.
4. **Escrituras locales no llaman `notify()`** (van directo a la Server Action + `setQueryData`): se elimina el refetch de 64 tablas por mutación. La propagación a otras pestañas/usuarios sigue por la DB (trigger NOTIFY del SQL, que dispara el leader). La caché del DataStore local queda stale de items hasta el próximo snapshot — no hay otra pantalla que lea items, aceptado y documentado.
5. **`null` de una action = no-op** (éxito sin cambio → refetch/invalidación); **excepción = error** (`onError`). Se normaliza en el `mutationFn`. `VarianteNoEliminableError` se serializa como `Error` genérico por el RPC: `onError` distingue por `message` (documentado `core.ts:441-467`).
6. **Debounce inputs**: `useDebouncedInput` se conserva; el commit 500ms/blur dispara `useActualizarItemMutation` (optimista). Desaparece la doble escritura actual (`actualizarItem` sin optimismo, `page.tsx:1288-1290`) y el re-render global por commit.
7. **Calculables derivados**: `jornadasMap` pasa de `useState+useEffect` a `useMemo` sobre la query; `gruposExpandidos` sigue siendo estado local de UI (no va a zustand ni a la cache). Zustand queda fuera de esta pantalla.

QueryKeys (`lib/data/queries/queryKeys.ts`):
- `['cotizador', proyectoId]` → el snapshot completo de la pantalla (un solo nodo de cache).
- Claves derivadas solo como helpers (los slices se derivan por `select`/`useMemo`, no como queries independientes — una cache para coherencia de página).
- Mutaciones funcionalmente independientes pueden usar keys separadas fuera del cotizador (catalogo, parametros) solo si se tocan distinto modulo; por ahora todo invalida bajo el prefijo.

---

## 2. Decisiones de diseño explícitas (requieren confirmación del Supervisor — ver §9)

- **DEC-1 ✓:** `crearItemAction` acepta `id?` cliente-generado y hace `INSERT ... ON CONFLICT (id) DO NOTHING` (idempotente). Replica el patrón ya aprobado por el arnés para `proyectos.crear` (`estado.md:188`, "id PERMANENTE desde el inicio, mismo patrón que Linear"). **Confirmado por Supervisor.**
- **DEC-1b ✗:** mantener id de servidor + máscara de inputs de filas en vuelo — descartada por no resolver el encadenado/edición.
- **DEC-2 ✓:** `QueryClientProvider` montado en `app/erp/layout.tsx` (wrapper client `components/erp/query-provider.tsx`), no en el root público. Config: `staleTime: 0` para datos colaborativos del cotizador, `refetchOnWindowFocus: false` (el long-poll manda), `retry: 1`, `gcTime` default. **Confirmado por Supervisor.**
- **DEC-7 ✓:** `crearEspacioAction` acepta `id?` y `INSERT ... ON CONFLICT (id) DO NOTHING` (idempotente), mismas reglas que DEC-1 (robustez por encima del ahorro de alcance — decisión del Supervisor de no recodificar después).
- **DEC-3:** Cotizador sale del path de snapshot para lecturas; el puente `CotizadorSnapBridge` (en `[proyectoId]/layout.tsx`) reemplaza a `CotizadorSincronizador`: seedea la cache desde el snapshot SSR del DataStore en el primer montaje (cero flash inicial) y en cada `version++` invalida `['cotizador', proyectoId]`.
- **DEC-4:** se adapta `hidratarSliceCotizador` → `mapSnapshotCotizador(store, proyectoId)` para el seed inicial (mezcla de hidratador + cliente/contratos/hitos/artefactos/acabados).
- **DEC-5:** helpers puros de optimistic merge/rollback en `lib/data/queries/optimistic.ts` (testeables con `tsx`, sin React ni DB).
- **DEC-6:** `usePendingGuard` se retira de los flujos de ítems (el encadenado es el objetivo); el estado de las mutations (`isPending`) alimenta spinners de `Button`. Se conserva el guard en flujos sin optimismo hasta migrarlos (B3).

---

## 3. Fases

### Fase A — Fundación (sin tocar la pantalla, commits estables)

1. `package.json`: +`@tanstack/react-query@^5` (React 19 compatible). `npm install`.
2. `lib/data/actions/core.ts`: `crearItemAction` y `crearEspacioAction` ganan `id?: string` y `INSERT ... ON CONFLICT (id) DO NOTHING` (DEC-1, DEC-7). `lib/data/drizzle-impl.ts` y `lib/data/mock-store.ts`: `items.crear` y `espacios.crear` pasan el `id` opcional (paridad `DATA_IMPL=mock`).
   - **Entregable clave:** doble invocación con el mismo id → 1 fila, tanto para ítems como para variantes (mock-store.test.ts + verificación runtime dev-local).
3. `lib/data/actions/lecturas-cotizador.ts` (`'use server'`): `obtenerSnapshotCotizadorAction(proyectoId): Promise<CotizadorSnapshot>` con proyecto, cliente, contratos, hitos, espacios, items (por espacío), artefactos (por espacío), catalogo, parametros, acabados (~10 SELECTs reusando las queries ya existentes de `lib/modules/**/queries.ts`; escopado, jamás `fetchSnapshotAction`).
4. `lib/data/queries/`: `types.ts` (CotizadorSnapshot + slices), `queryKeys.ts`, `optimistic.ts`, `optimistic.test.ts` (helpers puros), `useCotizadorQueries.ts` (hooks `useCotizadorSnapshot` + slices + mutations), `CotizadorSnapBridge.tsx`.
5. `components/erp/query-provider.tsx` (wrapper client) + montaje en `app/erp/layout.tsx`.
6. Tests: `optimistic.test.ts` ≥ 8 casos (insert temp→replace, patch, remove, rollback de cada, orden/`!anulado`).

**Verificación A:** tsc/eslint/build(mock) + `optimistic.test.ts` + mock-store.test.ts con caso idempotencia. El cotizador sigue exactamente igual (nada de queries consumido todavía).

### Fase B — Migración de la pantalla (sub-pasos, cada uno compila y es commiteable)

- **B1 (lecturas):** `app/erp/cotizador/[proyectoId]/page.tsx` reemplaza las lecturas de ítems/espacios/jornadas por `useCotizadorSnapshot` + slices `useMemo` (itemsPorEspacio, jornadasMap). Los 2 consumos de `useSelectPorVariante` (`page.tsx:978,1258`) pasan a props estables del parent → `EspacioGroupMemo` efectivo. Se quita la dependencia `version` de memos (`:121,:149`) para estas colecciones.
- **B2 (ítems, el núcleo del problema):** migraciones de ítems a mutations:
  - `crear`: `useCrearItemMutation`. El cliente genera el id (uuid) y llama a `crearItemAction` con ese id. `onSelect` cierra el SmartSearch **inmediatamente** y la fila aparece vía `onMutate` (sin bloqueo → encadenado). Se retira `usePendingGuard` de este flujo y se elimina `crearItemOptimistic` del código de la pantalla.
  - `actualizar` (cantidad/precio/grupo/esReferencial/fuente): `useActualizarItemMutation` vía `useDebouncedInput` (el commit debounced → mutation optimista; se replica el recálculo de `totalLinea` local como `calcularTotalLinea`).
  - `eliminar`: `useEliminarItemMutation` (soft/hard según `eliminarItemAction`).
  - TEST manual: el caso reportado (editar cantidad de fila recién creada en vuelo) debe persistir 5/5.
- **B3 (variantes/espacios/proyecto):** mutations para crear/renombrar/duplicar/eliminar/marcarActiva variante-espacio, actualizarJornadas, actualizar parámetros financieros del proyecto, artefactos, notasReunion. Con DEC-7 confirmada, `crearEspacio` (presets y nuevo) también cierra el SmartSearch/modal al instante y encadena como los ítems; `usePendingGuard` se retira de los flujos de creación (queda solo donde no haya optimismo todavía, si quedara alguno).
- **B4 (independencia de versión total):** catalogo/parametros/clientes/contratos/hitos/acabados/artefactos como slices de la misma snapshot (fuera del DataStore). `useDataStore()` y `store.getVersion()` desaparecen del page. `layout.tsx` cambia `CotizadorSincronizador` por `CotizadorSnapBridge`.
- **B5 (cero deuda):** grep de `useCotizadorStore`/`CotizadorSincronizador` en `app/**` = 0. Los archivos de zustand-migration (types/useCotizadorStore/selectors/hidratador/sincronizador) quedan sin consumidores → marcados `@deprecated` (la eliminación física + retiro de `zustand` del package.json se hace en limpieza con aprobación del Supervisor, fase C, porque la dep fue exigida por el dev previo y otros módulos del repo podrían referenciarla — verificar con grep global antes).

**Verificación B:** en cada sub-paso tsc/eslint/mock build; al final QA runtime completo (ver §6 matriz T1–T5).

### Fase C — Verificación en campo y limpieza

1. QA runtime del Supervisor contra `dev-local` (datos reales, 2 pestañas): correr T1–T5 con mediciones pegadas al plan.
2. `git status` limpio de archivos basura; commits por sub-fase.
3. Registrar en `estado.md`: resultado de la matriz antes/después + cierre (o apertura de follow-ups).
4. Deprecar/eliminar archivos muertos de zustand con aprobación; actualizar `ZU_03`, `m07`, `INDEX.md` si aplica.
5. Checkpoint final Supervisor + push a `dev` (Production Branch — tratar cada push con cuidado, AGENTS.md).

---

## 4. Archivos afectados

### Crear
- `lib/data/actions/lecturas-cotizador.ts` — `obtenerSnapshotCotizadorAction`
- `lib/data/queries/types.ts` — tipos `CotizadorSnapshot` + slices
- `lib/data/queries/queryKeys.ts` — claves de cache
- `lib/data/queries/optimistic.ts` — helpers puros merge/rollback
- `lib/data/queries/optimistic.test.ts` — tests (node:assert + tsx)
- `lib/data/queries/useCotizadorQueries.ts` — hooks `useQuery`/`useMutation` del cotizador
- `lib/data/queries/CotizadorSnapBridge.tsx` — bridge de invalidación/seed
- `components/erp/query-provider.tsx` — `QueryClientProvider` client wrapper

### Modificar
- `package.json` (+`@tanstack/react-query@^5`) y `package-lock.json`
- `lib/data/actions/core.ts` — `crearItemAction` y `crearEspacioAction` idempotentes con `id?` cliente (DEC-1, DEC-7)
- `lib/data/mock-store.ts` — `items.crear` y `espacios.crear` con id cliente (paridad mock)
- `lib/data/drizzle-impl.ts` — passthrough de id en `items.crear` y `espacios.crear`
- `lib/data/mock-store.test.ts` — caso idempotencia de ítem
- `app/erp/cotizador/[proyectoId]/page.tsx` — migración de lecturas y escrituras (Fase B)
- `app/erp/cotizador/[proyectoId]/layout.tsx` — SnapBridge en vez de CotizadorSincronizador
- `app/erp/layout.tsx` — montar QueryProvider
- `lib/data/stores/{types,useCotizadorStore,selectors,hidratador}.ts` y `CotizadorSincronizador.tsx` — marcar `@deprecated` (sin consumidores al final de B)
- `arnes/estado.md` + `arnes/INDEX.md` — registro del plan y de la matriz

### Eliminar (Fase C, con aprobación Supervisor)
- Archivos zustand sin consumidores tras verificación global de grep + `zustand` del package.json (solo si el grep global confirma 0 usuarios del paquete)

---

## 5. Matriz de evaluación (antes/después)

| # | Métrica | Antes (baseline) | Después (objetivo) | Cómo se mide |
|---|---|---|---|---|
| T1 | Agregado individual: percepción hasta fila visible | ~5 s (round-trip + snapshot 64 tablas + re-render) | <150 ms (onMutate síncrono) | QA runtime dev-local, 10 intentos, cronómetro |
| T2 | Encadenado: 5 agregados seguidos | Imposible (SmartSearch bloqueado por guard) | 5/5 sin espera; filas al instante | QA runtime |
| T3 | Edición en vuelo: cantidad editada en fila recién creada persiste al confirmar | Se pierde (swap pisa el default) | Persiste 5/5 | QA runtime, repetición del bug reportado |
| T4 | Refetch de snapshot completo por mutación local | 1 `fetchSnapshotAction` (64 tablas) por mutación | 0 (mutation + invalidación escopada; DB trigger sigue para cross-user) | Contador/`console.count` en `fetchSnapshotAction` (dev) + network panel |
| T5 | Reactividad cross-user (2ª pestaña / otro usuario edita) | ≤4 s (long-poll) | ≤4 s (vía SnapBridge invalidación) | QA runtime 2 pestañas |
| T6 | Re-render global del page por mutación de ítem | Sí (dependencia de `version` en memos + rehidratación zustand) | No (identidad de datos; EspacioGroupMemo efectivo) | React Profiler + grep estructural (`getVersion`=0 en page) |
| T7 | Duplicación por doble-submit/reintento | Posible (INSERT plano no idempotente) | 0 (onConflictDoNothing) | mock-store.test + QA doble click |
| T8 | Tipos / estilo | 0/0 | 0/0 | `npx tsc --noEmit`, `npx eslint .` |
| T9 | Helpers optimistas | — | 100% de casos puros | `npx tsx lib/data/queries/optimistic.test.ts` |
| T10 | Build | sin errores no-DB | sin errores no-DB | `DATA_IMPL=mock npx next build` |

---

## 6. Criterios de aceptación (mecánicamente verificables)

1. `npx tsc --noEmit` → exit 0.
2. `npx eslint .` → exit 0.
3. `npx tsx lib/data/queries/optimistic.test.ts` → todas las pruebas OK (≥8 casos).
4. `npx tsx lib/data/mock-store.test.ts` → OK, incluidos los casos nuevos: `items.crear` y `espacios.crear` llamados 2 veces con el mismo id devuelven 1 fila cada uno.
5. `DATA_IMPL=mock npx next build` → sin errores no-DB.
6. `grep -r "useCotizadorStore" app/` → 0 resultados.
7. `grep -r "CotizadorSincronizador" app/ lib/` → 0 resultados.
8. `grep -n "getVersion" app/erp/cotizador/[proyectoId]/page.tsx` → 0 (el page no depende de la versión global).
9. `grep -n "useDataStore" app/erp/cotizador/[proyectoId]/page.tsx` → 0.
10. El layout monta `CotizadorSnapBridge`, no `CotizadorSincronizador` (inspección).
11. Tras Fase B, reproducción del caso reportado (editar cantidad de fila en vuelo) persiste el valor 5/5 en QA runtime dev-local.
12. T1≤150ms, T2=5/5, T4=0, T5≤4s con mediciones pegadas al plan.
13. Checklist F10 (`checklist_progreso_pantallas.md`): punto 1 (sin `getDataStore` en app; el page usa queries, el bridge es `lib/`), punto 2 (cero trigger manual), punto 4 (memos sin `version`; sin `Math.random` en ids de fila optimista — id real uuid del cliente), punto 5 (round-trip de ítem en mock-store.test.ts).

## 7. Verificación (comandos)

- `npx tsc --noEmit` — criterios 1, 8, 9
- `npx eslint .` — criterio 2
- `npx tsx lib/data/queries/optimistic.test.ts` — criterio 3
- `DATABASE_URL='postgres://test:test@localhost:5432/no_connect_placeholder' npx tsx lib/data/mock-store.test.ts` — criterio 4
- `DATA_IMPL=mock npx next build` — criterio 5
- `grep`/`rg` de criterios 6-9
- QA runtime (Supervisor, `npm run dev` + `.env.local` de dev-local): criterios 10-13 + matriz §5

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Page de 2173 líneas: quiebre de rendimiento/regresiones | Fases con cada sub-paso compilando y commiteable; QA en cada fase; backup commit antes de B1 |
| Cambio de contrato (`crearItemAction` idempotente) | `DATA_IMPL=mock` con paridad exacta + test de idempotencia; afecta solo al cotizador (única pantalla que crea items) |
| Fallback inicial (loading) si el seed del bridge falla | Seed desde snapshot SSR; si no hay, skeleton breve; bloque de error no rompe la página |
| Estancamiento cross-screen (otras 43 pantallas siguen en DataStore) | Fuera de alcance, documentado como follow-up; la escritura por action directa no degrada otras pantallas (la DB trigger las refresca) |
| `VarianteNoEliminableError` serializado como Error genérico | `onError` distingue por `error.message` (constante exported en `lib/data/errors.ts`) |
| DoS de invalidación (cada versión global invalida el cotizador) | Mismo costo que hoy (hoy re-renderiza todo); identidad de datos deduplica renders; mejora en follow-up con invalidación por namespace |

## 9. Decisiones del checkpoint (RESUELTAS 2026-09-05)

1. **DEC-1 ✓** — `crearItemAction` idempotente con id cliente (patrón Linear ya aprobado para proyectos).
2. **DEC-1b ✗** — descartada (mantener id servidor + bloquear edición en vuelo no cumple T2/T3).
3. **DEC-7 ✓** — `crearEspacioAction` también idempotente con id cliente (mismas reglas que ítems; robustez total elegida por el Supervisor).
4. **DEC-2 ✓** — `QueryClientProvider` ERP-wide en `app/erp/layout.tsx`; el root `/app/layout.tsx` queda sin provider, público intacto.

Sin decisiones abiertas en este plan.

## 10. Notas para el rol Código

- `crearItemAction` y `crearEspacioAction` NO tocan el schema Drizzle (no DDL): agregan parámetro `id?` y `ON CONFLICT (id) DO NOTHING`, con los gates/reglas existentes intactos (p. ej. P-27 en `core.ts:492-507`, guardia de integridad de `eliminarEspacioAction`). Si `id` se recibe, usarlo; si no, autogenerado como hoy.
- `obtenerSnapshotCotizadorAction`: escopo estricto al proyecto; reusar `lib/modules/**/queries.ts` existentes; prohibido `fetchSnapshotAction`. Orden de las columnas de tiempos: usar `updatedAt` para identidad.
- El `select`/slices deben ser derivaciones puras y memoizadas (`useMemo`) con deps correctas; `!anulado` siempre aplicado en items contractuales (regla `selectors.ts:47`).
- El caso T3 (edición en vuelo) es el criterio rey de B2: si no persiste, la Fase B no está terminada aunque compile.
- No escribir nada fuera de los archivos listados en §4. No tocar `app/(publico)/**`, ni otras pantallas ERP, ni `lib/db/schema.ts`.