# Auditoría: carga y separación de responsabilidades público/admin

## Contexto

Pregunta que motivó esto: un fork como `empresa_muebles_clone` expone páginas públicas de marketing (deben cargar en milisegundos) además de un panel admin y, eventualmente, un catálogo de adapters. La sospecha era que el sistema de auth/admin interfiere con el rendimiento de las páginas públicas, y que el motor ya tiene "lagunas de latencia raras" incluso sin adapters todavía.

Audité el código real del motor (no supuse nada) y encontré **dos problemas concretos, no sospechas** — no hace falta una investigación dispersa "ultra especializada en cada aspecto"; hace falta arreglar estos dos, medir, y solo investigar lo puntual que de verdad no sabemos.

## Hallazgo 1 — El layout raíz monta herramientas de admin en TODA ruta, incluidas las públicas

`src/app/layout.tsx` (líneas 84-91) envuelve **todas** las rutas del sistema, sin excepción, en:

```tsx
<AppProvider initialData={vaultData}>
  <AuthProvider>
    {children}
    <AdminGear />
    <AgnoChat />
    <Toaster ... />
  </AuthProvider>
</AppProvider>
```

- `AuthProvider` (`src/context/AuthContext.tsx:36`) dispara `fetch('/api/auth/me')` en un `useEffect` **en cada carga de página**, incluida una landing pública que nunca necesita saber si hay un usuario logueado. Es una llamada de red client-side extra en el camino crítico de cualquier página, no solo del panel.
- `AdminGear` (`src/components/agnostic/admin/AdminGear.tsx`) y `AgnoChat` se montan siempre — `AdminGear` retorna `null` si no es admin (línea 20), pero el componente y su JS ya se descargaron, parsearon e hidrataron antes de decidir eso. Lo mismo aplica a `AgnoChat`, que es presumiblemente el bundle más pesado de los tres (UI de chat con streaming).

Esto es exactamente el patrón que describías: la verificación de "¿es admin?" no está aislada del camino de renderizado público — vive en el layout raíz, que es padre de absolutamente todo.

## Hallazgo 2 — `getVaultData` se invoca hasta 3 veces por request, con namespaces solapados

`getVaultData` (`src/core/server/vault.ts:36`) está envuelto en `cache()` de React, pero `cache()` deduplica **solo si los argumentos son idénticos** — no si dos llamadas piden namespaces distintos que se solapan.

En una sola carga de ruta dinámica (`[...slug]/page.tsx` → `agnostic-route-page.tsx`):

1. `layout.tsx:36` — `getVaultData([ROUTES, SCHEMAS, CONFIG, TOKENS])`
2. `agnostic-route-page.tsx:14` — `getVaultData([ROUTES, SCHEMAS])` (resolución parcial, para saber qué bloques tiene la ruta)
3. `agnostic-route-page.tsx:35` — `getVaultData([ROUTES, SCHEMAS, ...allContexts])` (resolución completa, con los contextos de datos que la ruta realmente necesita)

Ninguna de las tres llamadas tiene argumentos idénticos entre sí, así que `cache()` no deduplica nada entre ellas — `strategy.read('page_routes')` y `strategy.read('schema_definitions')` se ejecutan **hasta 3 veces cada uno** en una sola carga de página. Con la estrategia `Local` (JSON en disco) esto es barato. Con `Postgres`/`GitHub` (lo que usaría un fork en producción) son 2 lecturas de red/DB completamente evitables, en el camino crítico de cada página, sin ningún componente de admin ni un solo adapter instalado todavía — confirma tu observación de que el motor ya tenía esta laguna antes de agregar nada nuevo.

La resolución en dos fases (parcial → completa) tiene una razón real de existir (no sabes qué contextos adicionales necesitas hasta resolver la ruta) — el problema no es la lógica de dos fases, es que `ROUTES`/`SCHEMAS` se vuelven a leer de la estrategia en cada fase en vez de reusar lo que el layout (o la fase anterior) ya cargó.

## Preguntas que sí requieren investigación real

- **Medición base real, antes de tocar nada.** Lighthouse/PageSpeed + waterfall de network contra una ruta pública real de un fork con estrategia Postgres o GitHub (no Local — ahí el problema es invisible). Sin esto, cualquier cambio se hace a ciegas.
- **Next.js Partial Prerendering (PPR).** El seed usa Next 15. Investigar si PPR está lo bastante maduro para servir el shell público como estático instantáneo mientras el resto (auth, admin chrome) se resuelve después, sin reescribir el sistema de rutas dinámico.
- **Route Groups vs. catch-all universal.** Hoy `[...slug]/page.tsx` es un catch-all único para todo el sistema. Separar layouts público/admin con Route Groups de Next.js exige decidir, ANTES de renderizar, si una ruta es pública o administrativa — `page_routes.json` ya tiene `required_role`/`allowed_lists` por ruta, así que probablemente esa clasificación ya existe como dato y no hay que inventar una convención de carpetas nueva. Falta confirmar que migrar a Route Groups no rompe la resolución dinámica actual.

## Camino recomendado (concreto, no disperso)

1. **Medir el baseline real** (Lighthouse + waterfall) contra una ruta pública en producción o staging con estrategia de red real. Sin esto, no hay forma de saber si el arreglo importó.
2. **Sacar `AuthProvider`/`AdminGear`/`AgnoChat` del layout raíz.** Usar Route Groups: un layout público liviano (sin auth, sin admin chrome) y un layout administrativo que sí los monta, aplicado solo a `/schema` y rutas con `required_role`. Esto no es investigación nueva — es aplicar una capacidad que Next.js ya tiene.
3. **Deduplicar `getVaultData` dentro de una misma request.** Calcular el conjunto completo de contextos necesarios en una sola pasada (o normalizar el array de contextos antes de cada llamada para que `cache()` sí deduplique) en vez de tres llamadas con arrays distintos.
4. **Medir de nuevo, comparar contra el baseline.** Si no mejora lo esperado, ahí sí se investiga el siguiente sospechoso puntual — no antes.

## Por qué no una serie de investigaciones "ultra especializadas"

Ya tenemos evidencia de código con archivo y línea para dos problemas reales. Lanzar una ronda de investigación amplia sobre "cada aspecto de optimización" antes de arreglar lo que ya se encontró sería repetir el mismo error que evitamos con los adapters: construir sobre suposiciones en vez de sobre evidencia. El patrón correcto — el mismo que usamos toda esta sesión — es: diagnosticar con lo que ya se puede observar, investigar solo lo puntual que genuinamente no se sabe (arriba), y recién ahí construir.

## Alcance

Este documento es un **pre-plan** — diagnóstico + preguntas abiertas + camino recomendado. No se tocó ningún archivo de código en la ronda que lo produjo. Afecta al motor (`agnostic system`), no a un fork — cualquier fix aquí beneficia a todos los forks, incluido `empresa_muebles_clone`, sin que cada uno tenga que resolverlo por su cuenta.

## Actualización — implementado

El "Camino recomendado" original (paso 2, Route Groups) se revisó durante la fase de diseño del plan de implementación: `grep` de `useAuth()` reveló que bloques genéricos del engine (`AgnosticCollection`, `AppNavbarDynamic`, `AgnosticBelt`) dependen de `AuthProvider` en cualquier ruta, incluidas públicas — sacarlo del layout raíz vía Route Groups habría roto esas rutas en runtime. El fix real aplicado: `AdminGear`/`AgnoChat` se cargan vía `next/dynamic({ssr:false})` detrás del chequeo `isAdmin` ya existente (`AdminTools.tsx`), sin tocar `AuthProvider`. `getVaultData` (hallazgo 2) se corrigió moviendo `cache()` a granularidad por namespace — verificado con instrumentación temporal que cada namespace se lee exactamente una vez por request. Medición Lighthouse/waterfall contra una estrategia de red real sigue pendiente, no se pudo hacer desde este entorno local.
