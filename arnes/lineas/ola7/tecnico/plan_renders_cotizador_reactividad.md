# Plan: re-renders / foco / evapción de filas en el cotizador — reactividad por long-poll y mutation optimista

**ID de tarea:** (pendiente de asignar en ledger; borrador de plan revisado por el Supervisor el 2026-09-09)
**Fecha:** 2026-09-09 · **Última revisión:** 2026-09-10 (auditoría técnica del modelo actual y del plan — hallazgos registrados en §3.4, §4 y §5)
**Zona:** server-state del ERP (`lib/data/queries/` + `lib/data/DataStoreProvider.tsx` + `app/erp/cotizador/[proyectoId]/page.tsx`) — misma zona lógica del plan `plan_cotizador_tanstack_query.md`, del que este documento es continuidad (problemas residuales de la F10/TanStack en producción).
**Tipo:** Corrección de comportamiento de UI/reactividad (estado de servidor + optimismo + foco)
**Riesgo:** medio-alto · **Frena al humano:** no (es UX/producción del cotizador `/erp/**`, no toca `main` ni el dominio público legacy)

**Depende de:** `plan_cotizador_tanstack_query.md` (DEC-1/DEC-2/DEC-3/DEC-7/DEC-8 ya aprobados y codeados) y `m07b_reactividad_multiusuario.md` (F10, long-poll). Este plan NO cambia las DEC-* aprobadas: las deduce y refuerza.

**Estado de decisiones (pendientes de checkpoint Supervisor tras revisar este documento):**
- **PDEC-A (propuesta):** eliminar la invalidación redundante de `onSettled` en las mutations optimistas del cotizador (la correctitud propia la da `onSuccess`+reconcile; la multi-usuario la da el puente NOTIFY→version++).
- **PDEC-B (propuesta):** gate en `CotizadorSnapBridge`: no invalidar mientras haya mutations del cotizador en vuelo + coalescencia trailing ~500ms de las invalidaciones.
- **PDEC-C (propuesta):** capa de fusión de pendientes (registry de filas optimistas en vuelo) para que un refetch NUNCA pueda desmontar una fila no persistida todavía.
- **PDEC-D (propuesta):** selección de variante (tab) inmune a remontes (`tabId` fuera de `EspacioGroup`) + `placeholderData: keepPreviousData` en `useCotizadorSnapshot`.
- **PDEC-E (nueva, de auditoría 2026-09-10):** estabilidad estructural del árbol: mover `memo(EspacioGroup)` a scope de módulo + estabilizar las identidades de las props (`catalogo`, `gruposPorNombre`, `espaciosBase`, `tarifas`) desacopladas del objeto `store` reconstruido. Cierra la causa raíz del remonte de `EspacioGroup` (ver §3.4-F1/F2 y Fase 0).
- **PDEC-F (nueva, de auditoría 2026-09-10, follow-up no bloqueante):** invalidación escopada por tabla usando el payload del NOTIFY (`tabla:op`, ya emitido en `0004_veta_notify_trigger.sql`) en vez de invalidar `['cotizador', proyectoId]` en cada `version++` global (ver §3.4-F6 y Fase 4).

---

## 1. Síntomas (reportados por el Supervisor, reproducción en `dev`)

### S1 — "El alta optimista produce un re-render que corta el trabajo en curso"
- **Qué se ve:** el Supervisor agrega un ítem A (p. ej. vía "+ Buscar" o "+ Ítem Libre"). Inmediatamente pasa a agregar (o editar) un ítem B. Unos segundos después de que A se "confirma en el servidor", la UI re-renderiza y **le corta lo que estaba haciendo** con B: pierde foco/valor, la fila recién agregada hace flicker (desaparece y reaparece), o el cursor vuelve a otro punto.
- **Cuándo:** siempre que quedan mutations en vuelo mientras aterriza un refetch (propio o eco del long-poll).
- **Severidad:** alta — interrumpe el flujo constante de carga de una cotización.

### S2 — "La pestaña/variante elegida vuelve sola a la variante activa cada pocos segundos"
- **Qué se ve:** el Supervisor elige una variante de comparación (no activa) en una tarjeta de espacio. Cada ciertos segundos (rango del eco del long-poll) la selección salta de vuelta a la variante **activa**, sacándolo del contexto que estaba revisando/ editando.
- **Cuándo:** con multi-variante en la tarjeta y actividad de escritura en curso (incluida la propia).
- **Severidad:** media-alta — rompe el flujo de comparación entre variantes.

---

## 2. Hipótesis

### H1 — Doble refetch por cada escritura (tormenta de invalidación)
- **Estado:** CONFIRMADA por lectura de código (ver §3.1).
- Cada write del cotizador produce DOS refetch del snapshot `['cotizador', proyectoId]`:
  1. `onSettled → invalidateQueries` de la propia mutation.
  2. Eco del long-poll: write → BD → `NOTIFY veta_changes` → líder (`DataStoreProvider`) → `version++` → `CotizadorSnapBridge` invalida de nuevo.
- El refetch 2 llega ~1-3 segundos después, **aunque `onSuccess` de la mutation ya reconcilió los datos del servidor**. Es el "cada ciertos segundos" del S2 y la fuente de presión de re-renders que amplifica S1.

### H2 — Evapción de la fila optimista en vuelo (causa de S1)
- **Estado:** CONFIRMADA por lectura de código (ver §3.2).
- `obtenerSnapshotCotizadorAction` devuelve solo filas **persistidas**. Un refetch que aterriza mientras un ítem B sigue en vuelo sustituye la cache por un snapshot SIN B → la fila se desmonta → si el Supervisor la estaba editando, pierde foco/valor → cuando B aterriza, `onSuccess` la reinstala (flicker).
- La key de fila es estable (`key={item.id}`, uuid cliente DEC-1), así que el problema NO es un re-mount por key: es la **ausencia temporal de la fila en el snapshot** del servidor.

### H3 — Remonte de la tarjeta (o de la página) resetea `tabId` (causa de S2)
- **Estado:** CONFIRMADA — el vector principal está confirmado en código estático (ver H5 y §3.4-F1); el vector `page.tsx:272-277` queda como secundario, no el principal.
- `tabId` vive dentro de `EspacioGroup` (`useState(varianteActiva.id)`). React solo resetea ese estado en el **montaje**. Por tanto, "la tab vuelve a la activa" implica un REMONTE (de la tarjeta o de todo el árbol).
- Vector PRINCIPAL (confirmado, no requiere Profiler): `page.tsx:295` → `memo(EspacioGroup)` se define DENTRO del render de `CotizadorPageInner` → tipo de componente nuevo en cada render del padre → React desmonta y remonta TODA la sub-árbol de cada `EspacioGroup` (y con ella `tabId`, modales, búsquedas, y todo estado local) en cada data change / commit / version++ — ver H5.
- Vectores secundarios presentes en código:
  - `page.tsx:272-277`: `if (cargando) return <p>Cargando cotización…</p>` — si `snapshot.isLoading` llega a ser `true`, TODAS las tarjetas se desmontan (estado local de todas: tabId, modales, búsquedas). Sin `placeholderData: keepPreviousData`, un momento sin datos (p.ej. tras GC de la cache o refetch sin data previa) dispara esto.
  - El estrés de re-renders globales de H1 + identidades no estables (ver §3.3 y §3.4-F2) multiplican el churn.

### H4 — (Desechada en diagnóstico, se conserva como nota) — Sync de `tabId`
- Se descartó la hipótesis de que el reseteo fuera por el fallback `variante = variantes.find(v => v.id === tabId) ?? varianteActiva` sin remonte: eso solo ocurre si la variante del tab desaparece del array, y no hay evidencia de que un refetch omita variantes persistidas.

### H5 — (NUEVA, de auditoría 2026-09-10) — `memo()` definido dentro del render remonta TODO el árbol (causa raíz de S2 y amplificador de S1)
- **Estado:** CONFIRMADA en código estático (`page.tsx:295`).
- `const EspacioGroupMemo = memo(EspacioGroup)` se ejecuta en cada render de `CotizadorPageInner`. `memo()` devuelve un tipo de componente NUEVO por llamada → `element.type` cambia en cada render del padre → React desmonta/remonta la sub-árbol completa de cada tarjeta, sin importar que `key={nombreEspacio}` sea estable.
- Consecuencias:
  - `tabId` (`page.tsx:979`) se resetea a `varianteActiva.id` en cada commit de datos → "la tab vuelve sola cada pocos segundos" (S2), correlacionado exactamente con la cadencia de refetches/version++.
  - Cualquier edición/input en curso se corta al siguiente commit → pérdida de foco/valor (parte de S1), más allá de la "evapción" de H2.
  - El `memo` es inútil además porque `EspacioGroup` consume el contexto directamente (`page.tsx:977`) y porque las props cambian de identidad en cada render (§3.4-F2). El comentario de `page.tsx:289-294` ("una modificación NO re-renderice hermanos") es funcionalmente falso.
- Nota: se detecta con un check estático (`grep` de `memo(` dentro de cuerpos de función), no hace falta Profiler para confirmarlo.

---

## 3. Evidencia de código (lectura, rama `dev`)

### 3.1 H1 — Doble fuente de invalidación
- `lib/data/queries/useCotizadorQueries.ts:91-94` → `onSettled: () => void qc.invalidateQueries({ queryKey })`.
- `lib/data/queries/CotizadorSnapBridge.tsx:53-55` → `useEffect(() => { void qc.invalidateQueries({ queryKey }) }, [qc, queryKey, version, proyectoId])`.
- `lib/data/DataStoreProvider.tsx:148-159` → líder: `longPollVersionAction` → `changed` → `fetchSnapshotAction()` → `version++` / broadcast.
- `lib/data/queries/useCotizadorQueries.ts:52-61` → `useCotizadorSnapshot` con `staleTime: 0`.

### 3.2 H2 — QueryFn que solo trae persistidos
- `lib/data/actions/lecturas-cotizador.ts:38-46` → `db.select().from(s.itemsVariante)...` (solo lo persistido).
- `lib/data/queries/useCotizadorQueries.ts:77-95` → `onMutate` setQueryData optimista; `onError` rollback; `onSuccess` reconciliación (`upsert*`); `onSettled` invalidación.
- `lib/data/queries/optimistic.ts:48-51,87-91` → `agregarItem` (append) / `upsertItem` (reemplazo por id).

### 3.3 H3 — Estado local frágil y re-render global
- `app/erp/cotizador/[proyectoId]/page.tsx:272-278` → early return por `cargando`.
- `page.tsx:978-981` → `tabId` local en `EspacioGroup`; `page.tsx:550` → `key={nombreEspacio}`.
- `page.tsx:154` → `useMemo(() => derivarTarifas(store), [store])` — depende de TODO el store (derrota parcial de `memo`).
- `page.tsx:162-164` → `useEffect` que reconstruye `jornadasMap` en cada cambio de `espaciosBase`.
- `lib/data/queries/cotizador-compat.tsx:99-152` → el objeto `store` integro se reconstruye en cada cambio de `data`; todos los consumidores de contexto se re-renderizan (el `memo(EspacioGroup)` de `page.tsx:295` no bloquea cambios que fluyen por contexto).

### 3.4 Auditoría (2026-09-10) — hallazgos nuevos sobre el modelo actual

Referencia de prácticas estándar de la industria usada en esta auditoría: separación server-state / UI-state; invalidación estrecha-coalescida-escopada; overlay de operaciones en vuelo (*shadow cache*); identidad de componentes estable (`memo` solo a nivel de módulo, prohibido definir componentes durante el render); refetch que nunca vacía la pantalla (`keepPreviousData`, distinguir `isLoading` de `isFetching`); staleness multi-usuario por eventos con payload. Todas validadas contra el código de `dev`.

- **F1 — [CRÍTICO] `memo(EspacioGroup)` definido dentro del render (`page.tsx:295`).** Se ejecuta DENTRO del cuerpo de `CotizadorPageInner` (entre los early-returns y `materialesTotal`), por lo que cada render del padre crea un wrapper `memo` NUEVO → `element.type` cambia → React desmonta y remonta TODA la sub-árbol de cada tarjeta en cada data change / commit / version++. Confirma H5: es la causa raíz de S2 (reseteo de `tabId`) y amplificador de S1 (pérdida de foco/valor, flicker). El comentario de `page.tsx:289-294` que atribuye al memo protección entre hermanos es falso por tres motivos: el tipo cambia por render, `EspacioGroup` consume contexto directo (`page.tsx:977`), y las props cambian de identidad (F2).
- **F2 — Identidades inestables derrotan `memo` aunque se corrija F1.** `cotizador-compat.tsx:99-152` reconstruye el objeto `store` completo en cada cambio de `data`. Como consecuencia se recomputan en cada data change: `espaciosBase` (`page.tsx:127`, dep `[proyecto, store]`), `gruposPorNombre` (`:133`), `tarifas` via `derivarTarifas(store)` (`:154`) y `catalogo` (`:128`, array nuevo por render). Todas entran como props a `EspacioGroup` → shallow-compare falla siempre. El plan original solo cubría parcialmente esto en Fase 3.1 (faltaban `catalogo` y `gruposPorNombre`).
- **F3 — Doble invalidación por escritura (confirmación de H1).** `useCotizadorQueries.ts:91-94` (`onSettled`) + `CotizadorSnapBridge.tsx:53-55` (version++).
- **F4 — Ventana de evapción real más angosta que la hipótesis, pero el complemento sigue siendo necesario.** `onMutate` ya hace `cancelQueries({ queryKey })` (`useCotizadorQueries.ts:78`), que cancela refetches en vuelo para esa key al empezar la mutation. La evapción se cierra con PDEC-B para refetches del bridge; pero PDEC-C (overlay) sigue SIENDO necesario para los refetches por montaje (`staleTime: 0` → refetchOnMount) y por otras invalidaciones que el gate no cubre. PDEC-B y PDEC-C se complementan; no son redundantes.
- **F5 — Early-return masivo + sin `placeholderData` (confirmación de un vector secundario de H3).** Con `staleTime: 0`, un refetch que se queda sin data (p.ej. tras GC >5min y re-montaje) pasa por `cargando=true` → desmonte de TODO el estado de página. El plan 2.2 lo ataca bien.
- **F6 — Invalidación global sin scope por tabla (oportunidad, hoy se descarta el payload).** El trigger ya emite `pg_notify('veta_changes', TG_TABLE_NAME || ':' || TG_OP)` (`drizzle/v3/0004_veta_notify_trigger.sql:7`), pero `lib/data/actions/longpoll.ts:61` la descarta (`.listen('veta_changes', () => finish(true))`). Cualquier cambio en cualquiera de las 64 tablas (aunque no toque el cotizador) produce version++ global → refetch del snapshot del cotizador. El debounce (PDEC-B) coalesce la ráfaga; el scoping por payload elimina el refetch innecesario. Propuesta: Fase 4 / PDEC-F (follow-up).
- **F7 — Mutaciones sin reconciliación y el gate PDEC-B (riesgo de "duplicado invisible").** `useEliminarItemMutation` / `useEliminarEspacioMutation` / `useDuplicarEspacioMutation` (`useCotizadorQueries.ts:132-138,185-212`) no tienen `reconciliar`. La peor es `duplicarEspacio`: `aplicarOptimista = (snap) => snap` (no-op) y sin reconcile → el duplicado solo aparece por refetch. Si PDEC-B se traga la invalidación del bridge por `isMutating>0` y no llega otro version++, el duplicado nunca aparece en pantalla. Mitigación: esas 3 mutations deben **bypassear el gate de PDEC-B** (conservar su propia invalidación) o recibir reconciliación (`upsert` del resultado). Ya previsto en "Riesgo 1" del plan original; aquí se marca como requisito de implementación explícito.
- **F8 — Menores.** `jornadasMap` en `useState` + `useEffect` redundante (`page.tsx:157-164`, segundo render); contexto gigante que re-renderiza en cada data change Y en cada cambio de estado de mutation (las mutations son deps del `useMemo`, `cotizador-compat.tsx:146-152`).

---

## 4. Plan de implementación

### Fase 0 — Estabilidad estructural del árbol (de auditoría 2026-09-10) — PRIMERO

Cierra la causa raíz confirmada H5/F1 y, en parte, S1 (foco/valor). Pequeño, de bajo riesgo, y desacopla la evaluación de 2.1 (si el árbol deja de remontarse, quizá no hace falta subir `tabId`).

**0.1 `page.tsx` — mover `memo(EspacioGroup)` a scope de módulo.**
- Sacar `const EspacioGroupMemo = memo(EspacioGroup)` del cuerpo de `CotizadorPageInner` a scope de módulo (junto a la declaración de `EspacioGroup`). Un solo `memo` por módulo; nunca dentro de un render.
- Verificación mecánica del anti-patrón: `memo(` no debe aparecer dentro de cuerpos de función (check estático, ver §5 VA-4).

**0.2 `page.tsx` — estabilizar las identidades de las props de `EspacioGroup` (F2).**
- Derivar `catalogo` con `useMemo` sobre el array crudo de catálogo (no `store.catalogo.listar()` en crudo cada render), y `gruposPorNombre`/`espaciosBase` sobre slices estables del snapshot (no sobre el objeto `store` reconstruido).
- `tarifas` (`page.tsx:154`): derivar desde `parametros` (claves `valor_hora_*` + defaults), no de todo `store`.
- Con esto, los props `variantes`/`catalogo`/`tarifas` tienen identidad estable entre data changes no relacionados → `EspacioGroupMemo` pasa a funcionar de verdad (siempre que el contexto no cambie; ver 3.2 para el radio del contexto).
- Nota: `EspacioGroup` también consume el contexto directo (`page.tsx:977`), así que el memo NO lo aislará de cambios de `data` que sí le afecten; el objetivo de 0.1/0.2 es eliminar los remontes y los re-renders fantasma, no aislar de datos reales.

### Fase 1 — Cerrar la tormenta y la evapción (arregla S1 y reduce la presión de S2)

**1.1 `useCotizadorQueries.ts` — quitar la invalidación redundante del `onSettled`.**
- Eliminar `onSettled: () => invalidateQueries` de `useMutationOpt`.
- La correctitud local de cada mutation la provee `onSuccess` (upsert del resultado del servidor). La propagación multi-usuario/ multi-pestaña la provee el puente (NOTIFY→version++→invalidate). No se pierde sincronía.
- Efecto: cada write pasa de 2 refetch a 1 (el del puente), y desaparece la ventana inmediata donde un refetch propio puede pisar filas optimistas recién creadas.
- Regla de implementación: mantener `reconciliar`/`onSuccess` como está; NO tocar DEC-1/DEC-7 (ids cliente idempotentes).

**1.2 `CotizadorSnapBridge.tsx` — dos guardas.**
- Añadir `mutationKey: ['cotizador', proyectoId]` explícito a cada `useMutationOpt` (para poder filtrar pendientes por pantalla).
- Gate: en el efecto de invalidación, si `queryClient.isMutating({ mutationKey: ['cotizador', proyectoId] }) > 0`, **no invalidar** (pospuesto). Cuando la última mutation acaba, el trailing (ver abajo) o el siguiente `version++` refresca.
- Coalescencia: reemplazar la invalidación directa por un debounce **trailing ~500ms** (un solo refetch por ráfaga de `version++`).
- Caveat A (de auditoría F7): el gate debe **NO aplicarse** a las mutations sin reconciliar (`useEliminarItemMutation`, `useEliminarEspacioMutation`, `useDuplicarEspacioMutation`) — su invalidación propia tiene que bypassear el gate (o recibir reconciliación), si no el duplicado puede nunca aparecer (ver §3.4-F7).
- Caveat B (de auditoría): el disparo del debounce trailing debe **re-chequear `isMutating` al MOMENTO de invalidar**, no solo al agendar; si no, puede dispararse con una mutation en vuelo y evaporar filas (ráfaga de writes encadenados).

**1.3 `lib/data/queries/optimistic.ts` — capa de fusión de pendientes (a prueba de balas).**
- Registry de pendientes: colección módulo-nivel `<proyectoId → Map<id, ItemVariante>>` alimentada en `onMutate` (cuando se inserta una fila optimista) y drenada en `onSettled` (cuando el id ya llegó del servidor o falló).
- Helper puro `fusionarPendientes(snapshotServidor, pendientes)` que overlay las filas optimistas pendientes sobre el snapshot de la queryFn (si el servidor aún no trae `id`, se conserva la fila optimista; si ya la trae, gana el servidor). Aplicarlo envolviendo `queryFn` en `useCotizadorQueries`/`CotizadorCompatProvider`.
- Garantía: **ninguna fila optimista puede evaporarse** de la UI entre `onMutate` y su confirmación, pase lo que pase con los refetches.
- Tests nuevos en `optimistic.test.ts` (patrón `node:assert` + `npx tsx`): (a) refetch sin la fila → se conserva la optimista; (b) refetch con la fila → gana el servidor; (c) fallo de mutation → la fila sale (rollback) y no reaparece; (d) refetch ya en vuelo al empezar una mutation → `cancelQueries` conserva la fila optimista; (e) `duplicarEspacio`/`eliminarEspacio` sin `reconciliar` siguen visibles tras un refetch del bridge.

### Fase 2 — Selección de variante inmune a remontes (arregla S2 definitivo)

**2.1 Elevar `tabId` (ahora opcional).**
- La causa raíz de S2 está confirmada en F1/F5 (memo-in-render + empty-data early-return). Con la Fase 0 aplicada, el árbol deja de remontarse y `tabId` local (`page.tsx:979`) debería sobrevivir los ciclos de refetch. **Hacer primero Fase 0 y re-validar VA-2 antes de decidir subir el estado.**
- Si aún así se quiere persistencia (más robusta, o para sobrevivir navegación/reload), en orden de invasividad:
  1. Mover `tabId` a `CotizadorPageInner` como `useState<Map<nombreEspacio, varianteId>>` (sobrevive remontes del hijo, cero dependencias nuevas).
  2. Mini-store zustand `useVariantesTabStore` o `sessionStorage` (solo si debe sobrevivir recarga/navegación, criterio P8 de prácticas).

**2.2 `useCotizadorSnapshot` — `placeholderData` anti-unmount.**
- Añadir `placeholderData: (previous) => previous` donde haga falta (tanstack v5: `keepPreviousData`) para que un refetch que momentáneamente no tenga data devuelta NO vacíe la cache ni dispare el early-return `cargando` de `page.tsx:272`.
- Complemento: distinguir en la pantalla `isLoading` (data === undefined, primer load) de `isFetching` (refrescando con data presente); el early-return solo debe gatillar en el primer caso, y con skeleton fino en vez de pantalla completa.

**2.3 Confirmar con evidencia (una vez aplicada la Fase 0).**
- El vector principal de remonte YA está confirmado en estático (§3.4-F1). Aunque no haga falta Profiler para validar la hipótesis, sí se usa el Profiler para **verificar el criterio de aceptación**: ceros montajes/remontes de `EspacioGroup` en los flujos de reproducción tras el fix (VA-3).

### Fase 3 — Robustez de re-renders (opcional, recomendable)

**3.1 (renombrado desde auditoría) — restos de identidad y derivados.**
- Lo grueso de identidades ya se cubre en Fase 0.2. Resta: `jornadasMap` (`page.tsx:157-164`) — evitar el `setJornadasMap` extra cuando `espaciosBase` no cambió de valores (o derivarlo con `useMemo` con dependencia de valores estables, no de identidad de `espaciosBase`).

**3.2 (Opcional) Reducir el radio de re-render del contexto.**
- Dividir el contexto gigante en selectores `useMemo` por slice (items de un espacio, espacios, proyecto) para que un cambio en la tarjeta 3 no re-renderice las tarjetas 1/2. Evaluar si es rentable tras Fase 0 + 1.1-1.3; si la tormenta se cierra y 0.1/0.2 deja el memo operativo, puede no hacer falta.
- Nota (F8): el `useMemo` del contexto (`cotizador-compat.tsx`) incluye a las mutations como deps, así que cada cambio de estado de mutation re-renderiza el provider entero. Si se divide por slices, aislar también las mutations (handlers estables) del data value.

### Fase 4 — Invalidación escopada por tabla (follow-up, PDEC-F, no bloqueante)

- Llevar el payload del NOTIFY (`tabla:op`, ya emitido en `drizzle/v3/0004_veta_notify_trigger.sql`) desde `longPollVersionAction` (`lib/data/actions/longpoll.ts:61`, hoy lo descarta) hasta el mensaje del `BroadcastChannel` (`DataStoreProvider`) y al bridge.
- El bridge invalida `['cotizador', proyectoId]` solo si la tabla tocada pertenece a la snapshot del cotizador (`proyectos`,`espacio_variantes`,`items_variante`,`espacios_artefactos`,`contratos`,`hitos_pago`,`clientes`,`productos_catalogo`,`parametros`,`catalogo_acabados`). Elimina el refetch innecesario por cambios en las otras ~54 tablas que hoy derrotan el debounce.
- Mantener la coalescencia trailing de PDEC-B intacta (siguen llegando ráfagas multi-tabla). Verificable con el payload en DevTools/network: un cambio en `ordenes_trabajo` NO debe producir refetch del cotizador.

---

## 5. Verificación

- Estática: `npx tsc --noEmit` y `npx eslint .` sobre los archivos tocados.
- **VA-4 (nuevo, check estático del anti-patrón F1):** `rg -n "memo\\(" app/erp/cotizador/\[proyectoId\]/page.tsx` no debe devolver llamadas a `memo()` dentro de cuerpos de función (debe haber un solo `memo(EspacioGroup)` a nivel de módulo).
- Tests: `DATABASE_URL='postgres://test:test@localhost:5432/no_connect_placeholder' npx tsx lib/data/queries/optimistic.test.ts` (nuevos casos de `fusionarPendientes` + casos (d)/(e) de §1.3).
- Runtime local (`npm run dev` con `.env.local` con `DATABASE_URL` + `SESSION_SECRET`):
  - **VA-1 (S1):** agregar ítem A y, sin esperar, agregar ítem B (y C); ninguna fila en vuelo debe desaparecer/reaparecer; editar la fila B recién creada mientras aterriza el refetch de A sin perder foco/valor.
  - **VA-2 (S2):** elegir una variante de comparación en una tarjeta multi-variante y permanecer 30s+ con actividad de escritura; la tab debe quedarse en la variante elegida.
  - **VA-3 (S2):** disparar refetches en ráfaga (p. ej. varios writes rápidos de jornadas) y confirmar con Profiler que NO hay remonte de `EspacioGroup`/página (cero montajes/remontes tras la Fase 0; ~1 montaje por grupo en todo el flujo) y que las invalidaciones se coalescen (~1 refetch por ráfaga).
  - **VA-5 (nuevo, PDEC-F si se adopta):** un cambio en una tabla ajena al cotizador (p. ej. `ordenes_trabajo`, simulado con INSERT directo en dev-local) NO debe producir refetch de `['cotizador', proyectoId]` (network panel).

## 6. Criterios de aceptación (checkpoint Supervisor)

1. S1 y S2 no reproducibles según VA-1/VA-2/VA-3.
2. Cero regresiones en multi-usuario: un cambio de otro usuario/pestaña sigue llegando ≤4s (contrato de `m07b_reactividad_multiusuario.md` T5).
3. Tests de `fusionarPendientes` en verde (incluidos casos (d)/(e)); `tsc`/`eslint` limpios.
4. No se toca `main`, `legacy-agnostic-backup` ni el flujo de corte de producción (AGENTS.md).
5. Las DEC-1/DEC-2/DEC-3/DEC-7/DEC-8 aprobadas permanecen intactas (este plan solo añade PDEC-A..PDEC-F sujetas a checkpoint).
6. (NUEVO, F1) `memo(EspacioGroup)` a nivel de módulo (VA-4) y cero montajes/remontes de `EspacioGroup` en Profiler durante los flujos de VA-1/VA-3.
7. (NUEVO, F7) `duplicarEspacio` y los eliminares SIN `reconciliar` conservan invalidación propia que bypasea el gate de PDEC-B (o ganan reconciliación): duplicar una variante la muestra en pantalla ≤4s sin depender de la suerte del siguiente `version++`.
8. (NUEVO, solo si se adopta PDEC-F) VA-5 en verde: cambios a tablas ajenas al cotizador no producen refetch del snapshot.

## 7. Riesgos y mitigaciones

- **Riesgo 1 — quitar `onSettled` retrasa la correctitud local si `onSuccess` no cubre todo:** mitigación: todos los mutations que usan `useMutationOpt` ya tienen `reconciliar` con el resultado del servidor; se audita que TODOS la tengan antes de quitar el invalidate. Los que no tengan `reconciliar` (`useEliminarItemMutation`, `useEliminarEspacioMutation`, `useDuplicarEspacioMutation`) conservan invalidación **que bypasea el gate de PDEC-B** (o se les da su propia reconciliación) — requisito obligatorio, ver §3.4-F7 y criterio 7.
- **Riesgo 2 — el gate de `isMutating` puede retrasar la llegada de cambios de OTRA pestaña mientras hay mutation local en vuelo:** mitigación: la coalescencia trailing + el refetch al terminar la última mutation acotan el retraso a <1-2s; se mide en VA-3. El trailing debe re-chequear `isMutating` al disparar (caveat B de 1.2).
- **Riesgo 3 — sweep innecesario de fondo por `version++` de tablas fuera del cotizador (el líder re-fetchea las 64 tablas):** el refetch del snapshot del cotizador por tablas ajenas se cierra con PDEC-F (Fase 4, follow-up); el debounce (PDEC-B) ya lo mitiga parcialmente. Sin PDEC-F, queda como deuda por debajo de la categoría de este bug.
- **Riesgo 4 (NUEVO) — la Fase 0 cambia el comportamiento de todo el árbol de render del cotizador a la vez:** mitigación: la Fase 0 es pequeña y commiteable aparte (0.1 y 0.2); correr VA-3 (Profiler) ANTES y DESPUÉS de la Fase 0 para evidenciar la reducción de montajes; si aparece alguna regresión de render, el fix de 0.1 es de una línea y fácil de revertir en aislamiento. Probar 0.1 solo, medir, y luego 0.2.