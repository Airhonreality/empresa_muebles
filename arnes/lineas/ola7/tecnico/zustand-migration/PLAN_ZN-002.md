# Plan ZN-002: Fase 1 combinada — modelo de sincronización Zustand↔DataStore + migración del cotizador

**ID de tarea**: ZN-002
**Zona**: datos (`lib/data/`, `lib/data/stores/`) + cotizador (`app/erp/cotizador/[proyectoId]/page.tsx`)
**Tipo**: migración de arquitectura de datos (lectura optimizada + puente de escritura)
**Riesgo**: alto (toca la pantalla real de negocio, garantía de negocio)
**Depende de**: PLAN_ZN-001 (aprobado, Fase 0) — los stores `useCotizadorStore` y selectores ya existen y compilan.
**Estado**: APROBADO por Supervisor (2026-09-02). Nota de revisión: el archivo `page.tsx` tiene 1785 líneas (no 1690 como se indicó) — no cambia la arquitectura. Condición de aprobación: la verificación de QA incluye validación runtime (`npm run dev` contra `dev-local`) antes del commit, no solo comandos estáticos.

## Objetivo

Migrar la pantalla del cotizador `app/erp/cotizador/[proyectoId]/page.tsx` del consumo directo de `useDataStore()` (el monolítico con `getVersion()` global) a una capa Zustand de lectura optimizada + selectores granulares, SIN romper la persistencia ni la reactividad multi-usuario. Esto resuelve P1, P6 y P7 (objetivo de 100 cotizadores).

**La pieza que el roadmap omitió:** definir el **modelo de sincronización** entre el store Zustand (lectura) y el DataStore (escritura/persistencia/reactividad). Este plan lo resuelve ANTES de cablear la UI, evitando repetir el error de la Fase 0 (Server Action falsa).

## Hallazgo determinante del arnés (fuente de la decisión)

Al revisar `lib/data/drizzle-impl.ts` (líneas 1-24) se confirma que **las escrituras del DataStore en modo drizzle YA son**: *"llaman al Server Action real, esperan la confirmación, y solo entonces aplican el resultado a la caché local + notify(). Sin fire-and-forget."*

Esto implica que **el DataStore (drizzle) ES la fuente de verdad de escritura, persistencia y reactividad multi-usuario**. El store Zustand de la Fase 0 es de solo lectura.

**Conclusión de diseño:** el store Zustand **NO reimplementa Server Actions**. Debe ser una **capa de lectura memoizada que se alimenta del mismo DataStore**, exponiendo selectores granulares. Y las escrituras del cotizador **siguen pasando por el DataStore real** (`store.items.crear`, `store.espacios.crear`, etc.) — que ya respeta gates, transacciones y reactividad.

Esto elimina el "modelo de escrituras" como bloqueador: **no hay que diseñar escrituras nuevas**, hay que diseñar **cómo Zustand se mantiene en sincronía con DataStore** tras cada mutación.

## Enfoque: el "puente de sincronización"

| Rol | Componente | Cómo se sincroniza |
|-----|-----------|--------------------|
| Fuente de verdad (escritura + datos) | `DataStore` (drizzle o mock) | Expone `subscribe()` (reactividad global) y el objeto `store` completo |
| Caché de lectura selectiva | `useCotizadorStore` (Zustand) | Se rehidrata desde DataStore |
| Puente | hook `useFortalezaSincronizadorCotizador()` (nuevo) | Se suscribe a `DataStore.subscribe()`; en cada cambio re-hidrata los campos relevantes de `useCotizadorStore` |

### Cómo funciona el puente (mecanismo)

```
┌─────────────────────────────────────────────────────────────┐
│ DataStore (fuente de verdad)                                │
│  • subscribe(onStoreChange)  ← reactividad global (M-07)    │
│  • .items, .espacios, .proyectos, .catalogo, .parametros    │
└──────────────────────────┬──────────────────────────────────┘
                           │ subscribe()  (reactividad preservada)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ useFortalezaSincronizadorCotizador() (hook puente, nuevo)   │
│  • se monta en <CotizadorSincronizador /> cerca de la raíz   │
│  • en cada cambio del DataStore:                             │
│      read = store.items.porVariante(...)  (lecturas reales)  │
│      useCotizadorStore.getState().hidratar({ items, ... })   │
│  • hidratar() incrementa version → selectores re-renderizan  │
└──────────────────────────┬──────────────────────────────────┘
                           │ Zustand hidratado
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ useCotizadorStore (Zustand, solo lectura) + selectors        │
│  • useSelectPorVariante/enTotales/etc. → UI con granularidad │
└──────────────────────────┬──────────────────────────────────┘
                           │ escrituras (SIN cambios)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ page.tsx llama DIRECTAMENTE store.items.crear(...) etc.      │
│   (el DataStore drizzle espera confirmación + persiste + notify)│
└─────────────────────────────────────────────────────────────┘
```

**Propiedad garantizada:** como el puente se alimenta vía `subscribe()` del DataStore, y las escrituras pasan por el DataStore (que hace `notify()` al aplicar), cada escritura local dispara la rehidratación Zustand y cada cambio remoto (polling multi-usuario) también. La reactividad ≤4s se preserva **sin** que Zustand reimplemente ninguna escritura.

## Archivos afectados (en orden de implementación)

1. **`lib/data/stores/hidratador.ts`** (nuevo): helper puro que mapea el `DataStore` completo → forma de `CotizadorState` (lee `items`, `espacios`, `jornadasMap`, `proyecto`/`cliente`). Fuera de React (función plana) para testear con tsx.
2. **`lib/data/stores/CotizadorSincronizador.tsx`** (nuevo): hook + componente `'use client'` que usa `useDataStore()` + `useEffect` → `useCotizadorStore.getState().hidratar(mapeo(store))`. Se monta una vez en `app/erp/cotizador/[proyectoId]/layout.tsx`.
3. **`lib/data/stores/selectors.ts`**: extender — agregar `useSelectProyecto`, `useSelectCliente`, `useSelectCatalogo`, `useSelectParametros`, `useSelectEspaciosPorGrupo` (los campos que el cotizador necesita y hoy consume vía `useDataStore()`).
4. **`lib/data/stores/useCotizadorStore.test.ts`**: extender — test del mapeo del hidratador.
5. **`app/erp/cotizador/[proyectoId]/page.tsx`**: migrar — reemplazar los 6 `const store = useDataStore()` (L109, L802, L1019, L1527, L1627, L1704) por lecturas selectivas, conservando los escritores (que siguen apuntando al `store` real de `useDataStore`).
6. **`arnes/lineas/ola7/tecnico/zustand-migration/PLAN_ZN-002.md`**: este plan.

## Fuera de zona (NO tocar)

- `lib/data/store.ts`, `lib/data/mock-store.ts` (su contrato `DataStore` no cambia — el puente lee de él).
- `lib/data/DataStoreProvider.tsx` (la reactividad long-poll/BroadcastChannel se preserva intacta).
- `lib/data/actions/` (Server Actions no cambian; las escrituras siguen pasando por ellas vía DataStore).
- `lib/data/contracts.ts` (NO se añade `eliminar()` a espacios — eso es Fase 2, resolvería P3; este plan es Fase 1, solo lectura optimizada).
- Gates, reglas de negocio, tests de mock-store.

## Tamaño real de la migración del page.tsx (evidencia verificada)

El archivo tiene **1690 líneas** (no 1785) y **6 llamadas** a `const store = useDataStore()` (no 8). Lee: `parametros`, `proyectos`, `clientes`, `espacios`, `catalogo`, `items`. Escribe: `store.espacios.crear` (L169), `store.espacios.actualizarJornadas` (L203), `store.proyectos.actualizarParametrosFinancieros` (L306, L319), `store.proyectos.eliminar` (L335), `store.items.*` (read L224, L540).

**Estrategia de mínima invasión:** conservar `const store = useDataStore()` (para los escritores y lecturas puntuales de L305+), y SOLO reemplazar los bloques de LECTURA PESADA (items/espacios/totales/catalogo — L80-L116, L224, L540) por los selectores selectivos. No se reescribe la lógica de negocio del page; solo se cambia de dónde se leen los datos derivados.

Esto logra el beneficio clave (re-render granular, `useMemo` en productMap, React.memo) **sin** reescribir 1690 líneas ni arriesgar los flujos de escritura.

## Criterios de aceptación (mecánicamente verificables)

1. `npx tsc --noEmit` → 0 errores.
2. `npx eslint lib/data/stores` → 0 errores.
3. `DATABASE_URL='postgres://...placeholder' npx tsx lib/data/stores/useCotizadorStore.test.ts` → OK (incluye test del hidratador).
4. El puente `CotizadorSincronizador` se monta y rehidrata `useCotizadorStore` desde el DataStore real en cada `subscribe()` (verificable por el test del hidratador + revisión del hook).
5. **Reactividad multi-usuario preservada:** cambios remotos (`applySnapshot` del long-poll) rehidratan Zustand vía el puente (el puente usa el `useDataStore()` subscription, que ya dispara el re-render global en cada snapshot).
6. **Escrituras intactas:** `git diff` en `page.tsx` demuestra que las llamadas a `store.espacios.crear/actualizarJornadas`, `store.proyectos.*`, `store.items.*` **no se eliminaron ni reescribieron a Zustand** — siguen apuntando al `store` del `useDataStore()` real.
7. Los 73 tests de mock-store siguen pasando (no se tocó `mock-store.ts` ni `contracts.ts`).
8. No hay `: any` nuevo en `lib/data/stores/` (regresión de calidad).

## Verificación de negocio (QA independiente)

- Ejecutar los comandos 1-4 con evidencia de EXIT code.
- Verificar criterio 6 con `git diff` específico de `page.tsx` (que los escritores sobreviven).
- Verificar criterio 5 conceptualmente: el puente depende de `useDataStore().subscribe()`, que es el mismo mecanismo que hoy da reactividad a todo el page — si el page hoy reacciona a cambios remotos, el puente también (misma suscripción).

## Notas para QA y riesgos residuales

- **Riesgo residual aceptado (serializado):** al pasar de "todo el page re-renderiza en cada cambio" a "solo los selectores re-renderizan", hay un cambio de comportamiento sutil: si algún bloque del page dependía de re-render global para recalcular algo no declarado en sus deps de `useMemo`, podría no recalcular. La mitigación es: **cada bloque reemplazado debe declarar TODAS sus deps en el `useMemo`/selector correspondiente** (revisión QA caso a caso en los 6 puntos).
- **React.memo** se aplica en esta fase a los componentes de menor tamaño (EspacioGroup, VarianteContenido) donde hoy hay re-render innecesario — identificación y envoltura conservadora (no cambiar props).
- Los selectores de hooks NO se prueban con tsx sin renderer (patrón del repo). La cobertura del hidratador (función pura) es la pieza testeable.

## Cierre

Una vez aprobado este plan y verificado por QA independiente, se hace commit en la rama `feature/arquitectura-zustand-100-cotizadores` y se marca la Fase 1 como terminada en el roadmap ZU_03. No se mergea a `dev` ni `main` sin checkpoint final del Supervisor.

**Nota de higiene:** el roadmap ZU_03 salta de Fase 6 a Fase 8 (no existe Fase 7). Se corrige la numeración en ZU_03 en una edición menor mientras avanza este plan, o se renombra "Fase 8" a "Fase 7" — decisión del Supervisor, no bloquea ZN-002.