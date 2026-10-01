# plan_t-178 — Persistencia local del cotizador (cierra el hueco de t-170)

## Objetivo

Si se corta internet mientras se edita una cotización y se cierra/recarga la pestaña antes de que
los cambios en vuelo se confirmen con el servidor, al volver a abrirla se ve el último estado que
había en pantalla (no una pantalla vacía o "regresada" al último snapshot confirmado), y un banner
explícito avisa que hay cambios sin confirmar mientras no vuelve la conexión.

## Contexto (diagnóstico, 2026-09-30)

t-170 corrigió la condición de carrera que pisaba mutaciones concurrentes, pero dejó
explícitamente fuera la persistencia local: el caché de TanStack Query vive solo en memoria, así
que cerrar la pestaña en plena desconexión perdía cualquier cambio optimista no confirmado, sin
ningún rastro. El usuario comparó el comportamiento esperado con Notion: "el navegador guarda tu
trabajo... en nuestro caso parece al revés, muy frágil".

## Zona única afectada

Zona: `components/erp/query-provider.tsx` + `app/erp/cotizador/[proyectoId]/layout.tsx` +
`lib/hooks/` (useConexion nuevo) + `components/veta/banner-sin-conexion.tsx` (nuevo)

## Tipo de tarea y riesgo derivado

```
Tipo: Integración externa
Riesgo: alto
Frena al humano: sí
```

**Checkpoint del Supervisor**: continuación de "esos 3 puntos me importan para planificar y
implementar" (2026-09-30, el tercero de los tres era explícitamente este).

## Archivos afectados

- `package.json` / `package-lock.json` (modificar): `@tanstack/react-query-persist-client` +
  `@tanstack/query-sync-storage-persister` (paquetes oficiales de TanStack, versión en lockstep
  con `@tanstack/react-query@5.102.8` ya instalado — no se construyó nada a mano).
- `components/erp/query-provider.tsx` (modificar): `PersistQueryClientProvider` +
  `createSyncStoragePersister(window.localStorage)`, escopado SOLO al nodo `['cotizador', ...]`
  vía `shouldDehydrateQuery` — el resto del ERP (taller, finanzas, catálogo...) no se persiste, a
  propósito, para no arriesgar el límite de `localStorage` sin beneficio real. `maxAge` 24h.
  Guard `typeof window === 'undefined'` para el primer render server-side del componente
  `'use client'` (el persister solo se crea en el cliente).
- `lib/hooks/useConexion.ts` (crear): hook de `navigator.onLine` + eventos `online`/`offline`.
- `components/veta/banner-sin-conexion.tsx` (crear): banner visible mientras `!online`, con el
  conteo de mutaciones en vuelo (`useIsMutating({ mutationKey: cotizadorKeys.detalle(proyectoId) })`)
  si hay alguna — para que "sin conexión" nunca se confunda con "ya se guardó todo".
- `app/erp/cotizador/[proyectoId]/layout.tsx` (modificar): monta el banner junto a
  `CotizadorSnapBridge` (ya existente) — visible en todas las subrutas del cotizador de un
  proyecto.
- `arnes/tareas/t-178.json` (crear), `arnes/planes/plan_t-178.md` (crear, este archivo).

## Criterios de aceptación mecánicamente verificables

1. `shouldDehydrateQuery` solo persiste queries cuyo `queryKey[0] === 'cotizador'` — inspección de
   código, ningún otro nodo del ERP se persiste.
2. El componente del provider renderiza sin `window` definido (SSR) sin lanzar — guard explícito.
3. `BannerSinConexion` no renderiza nada (`null`) cuando `navigator.onLine` es `true`.
4. `npx tsc --noEmit` limpio en todo el árbol.
5. `npx eslint .` sin errores ni warnings nuevos en los archivos tocados.
6. `DATA_IMPL=mock npx next build` compila y type-checea sin errores nuevos (el build completo
   falla por falta de `SESSION_SECRET` en este entorno — esperado y documentado en `AGENTS.md`,
   no relacionado con esta tarea).
7. `npx tsx lib/data/queries/optimistic.test.ts` sigue en verde (36/36) — confirma que t-170 no se
   rompió al tocar el provider que envuelve toda la app ERP.

## Comandos de verificación

```
npx tsc --noEmit
npx eslint components/erp/query-provider.tsx lib/hooks/useConexion.ts components/veta/banner-sin-conexion.tsx "app/erp/cotizador/[proyectoId]/layout.tsx"
DATA_IMPL=mock npx next build
npx tsx lib/data/queries/optimistic.test.ts
```

## Notas

- `useConexion` no tiene test dedicado: es un wrapper fino sobre APIs del navegador
  (`navigator.onLine`, eventos `online`/`offline`) sin lógica pura que testear con el patrón
  `node:assert` del repo (no hay DOM/renderer instalado) — mismo criterio que `useDebouncedInput`/
  `usePendingGuard`, que tampoco tienen test dedicado en este repo.
- `navigator.onLine` es una señal imperfecta (confirma que hay una interfaz de red activa, no que
  Internet realmente funciona) pero es la única disponible sin hacer polling activo contra un
  servidor — suficiente para el caso de uso (avisar, no garantizar).
- Deliberadamente fuera de esta tarea: deshacer una acción ya confirmada en la DB (historial de
  acciones tipo Notion/Docs) — es t-179, una pieza arquitectónicamente distinta (ver
  `plan_t-179.md`).
- La rama `dev` es la Production Branch de Vercel: cualquier push a `dev` despliega a producción
  real y toca el `QueryProvider` que envuelve TODO el ERP (no solo el cotizador) — por eso el
  riesgo se clasificó alto pese a ser una integración aditiva.
