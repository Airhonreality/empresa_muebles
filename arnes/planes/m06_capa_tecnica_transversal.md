# M-06 · Capa Técnica Transversal L1 — Infraestructura de Interfaz

**Diamante:** M-06 (Reconstrucción del Cotizador y Módulos ERP)
**Capa:** L1 — Patrones de infraestructura técnica transversal
**Fecha:** 2026-08-05
**Fuente de verdad:** Legado (`empresa_muebles_clone`) + Repo nuevo (`empresa_muebles_clone_v3`)
**Estado:** Borrador para revisión del Supervisor

---

## A. Patrones de Infraestructura Identificados

### A.1 Vault CRUD (vWrite / vRemove)

| Campo | Detalle |
|-------|---------|
| **Nombre** | Vault CRUD Operations |
| **Descripción** | Funciones async genéricas que POST a `/api/vault` con `{ action: 'WRITE' \| 'REMOVE', namespace, id, data }`. Encapsulan toda la persistencia del legacy detrás de una abstracción de namespace + acción. |
| **Ubicación legacy** | `src/components/specialized/cotizador/utils.ts:17-30` |
| **Equivalente en repo nuevo** | No |
| **Recomendación** | **Reemplazar** — El repo nuevo usa Drizzle ORM con `db.insert()`, `db.update()`, `db.delete()` directamente contra Postgres. No se necesita una capa Vault intermedia. |

### A.2 COP Currency Formatter

| Campo | Detalle |
|-------|---------|
| **Nombre** | COP Formatter |
| **Descripción** | Formateador de moneda colombiana usando `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`. Se usa en todos los inputs de precio para mostrar formato `$ 1.234.567` al usuario y parsear al valor numérico en blur. |
| **Ubicación legacy** | `src/components/specialized/cotizador/utils.ts:3-6` |
| **Equivalente en repo nuevo** | No |
| **Recomendación** | **Preservar (adaptar)** — Es un patrón de UI esencial para el dominio. Crear `lib/utils.ts` en el repo nuevo con la función `COP()` y un `cn()` helper (clsx + twMerge) que ya existe en el legacy en `src/lib/utils.ts:4-6`. |

### A.3 useDebounce Hook

| Campo | Detalle |
|-------|---------|
| **Nombre** | Debounce Hook |
| **Descripción** | Hook genérico que retorna un valor diferido por un intervalo de tiempo. Usa `useState` + `useEffect` + `setTimeout`/`clearTimeout`. Dos implementaciones casi idénticas: una en `utils.ts:8-15` y otra en `src/hooks/useDebounce.ts:13-27`. |
| **Ubicación legacy** | `src/components/specialized/cotizador/utils.ts:8-15` y `src/hooks/useDebounce.ts:13-27` |
| **Equivalente en repo nuevo** | No |
| **Recomendación** | **Preservar (adaptar)** — Ubicar en `lib/hooks/useDebounce.ts` del repo nuevo. Unificar las dos implementaciones en una sola. Usar `useRef` para el timer y limpiar en `useEffect` de cleanup. |

### A.4 useAutoSave Hook

| Campo | Detalle |
|-------|---------|
| **Nombre** | Auto-Save con Race Condition Handling |
| **Descripción** | Hook de guardado automático debounced que resuelve condiciones de carrera: si la clave cambia, ejecuta el guardado pendiente de la clave anterior antes de limpiar la cola. Incluye `saveOnUnmount` para evitar pérdida de datos en navegaciones atrás/cambio de pestaña. Usa refs (`latestData`, `latestKey`, `latestOnSave`, `timerRef`, `hasPendingChanges`) para evitar closures obsoletos. |
| **Ubicación legacy** | `src/hooks/useAutoSave.ts:1-86` |
| **Equivalente en repo nuevo** | No |
| **Recomendación** | **Preservar (adaptar)** — Ubicar en `lib/hooks/useAutoSave.ts` del repo nuevo. La lógica de race condition handling y save-on-unmount es crítica para cualquier formulario de edición prolongada. Adaptar la interfaz para usar el cliente Drizzle en vez de `vWrite`. |

### A.5 useSmartSearch Hook

| Campo | Detalle |
|-------|---------|
| **Nombre** | Smart Search con Fuzzy Matching + History |
| **Descripción** | Hook de búsqueda inteligente que implementa: (1) búsqueda difusa con distancia de Levenshtein, (2) historial de búsquedas por contexto en localStorage, (3) seguimiento de uso de items con eviction LRU, (4) sugerencias basadas en historial, (5) bonus de relevancia para items usados recientemente. Retorna `{ query, setQuery, results, saveToHistory, trackUsage, history, usage }`. |
| **Ubicación legacy** | `src/hooks/useSmartSearch.ts:1-229` |
| **Equivalente en repo nuevo** | No |
| **Recomendación** | **Preservar (adaptar)** — Ubicar en `lib/hooks/useSmartSearch.ts` del repo nuevo. La búsqueda difusa y el historial por contexto son patrones de infraestructura de interfaz que aplican a cualquier módulo con búsqueda de datos. Adaptar para usar la API del repo nuevo en vez de `/api/vault`. |

### A.6 Payload Normalization (toContractZapRecord)

| Campo | Detalle |
|-------|---------|
| **Nombre** | Contract Zap Record Normalization |
| **Descripción** | Función que normaliza registros del Vault para el motor de zap. Desenvuelve la propiedad `data` del registro legacy y promueve el `id` al nivel superior, evitando que se pierda al procesar el payload. Es un boundary adapter entre el formato de almacenamiento y el formato de consumo del motor. |
| **Ubicación legacy** | `src/components/specialized/cotizador/contrato-payload.ts:14-27` |
| **Equivalente en repo nuevo** | No (no existe el concepto de "zap" ni "vault record" en el nuevo schema) |
| **Recomendación** | **Reemplazar** — En el nuevo schema, los datos ya están normalizados por Drizzle. No se necesita esta capa de adaptación. Si se requiere transformación de datos para el motor de contratos, hacerlo directamente en el servicio de capa de aplicación. |

### A.7 Parallel Data Loading (Promise.all)

| Campo | Detalle |
|-------|---------|
| **Nombre** | Parallel Namespace Fetching |
| **Descripción** | Patrón de carga de datos donde múltiples namespaces se cargan en paralelo usando `Promise.all`. En el legacy, 9 namespaces se cargan concurrentemente (`proyectos`, `clientes`, `contratos`, `productos_catalogo`, `espacio_variantes`, `items_variante`, `items_obra_civil`, `imagenes_espacio`, `propuestas_publicas`). Cada fetch va a `/api/vault?namespace=X`. |
| **Ubicación legacy** | `src/components/specialized/cotizador/CotizadorPro.tsx:126-136` |
| **Equivalente en repo nuevo** | No (el nuevo repo usa server components con queries directas a Drizzle) |
| **Recomendación** | **Preservar (adaptar)** — El patrón de carga paralela de datos relacionados es válido. En el nuevo schema, implementar como una función de inicialización en el server component o en un `useEffect` del client component que ejecute queries en paralelo usando `Promise.all` con las funciones de consulta de Drizzle. |

### A.8 Zap Engine Pattern

| Campo | Detalle |
|-------|---------|
| **Nombre** | Zap Engine Dispatch |
| **Descripción** | Patrón de despacho de acciones al motor de negocio via POST a `/api/engine` con `{ zap: string, payload: object }`. El motor procesa la acción y devuelve eventos que se aplican al estado de la aplicación via `processEvents`. |
| **Ubicación legacy** | `src/components/specialized/cotizador/CotizadorPro.tsx:150-159` |
| **Equivalente en repo nuevo** | No |
| **Recomendación** | **Reemplazar** — El motor "Agnostic Seed" y su patrón de zap no existen en el nuevo schema. La lógica de negocio se implementa directamente en server actions o route handlers de Next.js. |

### A.9 MoneyInput Pattern (Price Display/Edit)

| Campo | Detalle |
|-------|---------|
| **Nombre** | Money Input (Display/Edit Toggle) |
| **Descripción** | Patrón de input de dinero que muestra formato COP cuando no está enfocado y valor numérico crudo cuando está enfocado. Maneja blur para parsear, Enter para blur, y sincroniza el estado local con el valor prop. |
| **Ubicación legacy** | `src/components/specialized/cotizador/MoneyInput.tsx:1-46` |
| **Equivalente en repo nuevo** | No |
| **Recomendación** | **Preservar (adaptar)** — Es un patrón de UX de infraestructura de interfaz que aplica a cualquier campo monetario. Crear como primitiva en `components/veta/` o en `lib/` del repo nuevo. |

### A.10 useSyncPulse (Polling-based Data Sync)

| Campo | Detalle |
|-------|---------|
| **Nombre** | Sync Pulse (SHA-based Polling) |
| **Descripción** | Hook que hace polling a `/api/pulse?namespace=X` para detectar cambios por SHA. Cuando el SHA cambia, refetcha los datos de `/api/vault?namespace=X` y actualiza el store de Zustand. Pausa el polling cuando la pestaña está oculta para ahorrar API quota. |
| **Ubicación legacy** | `src/hooks/useSyncPulse.ts:1-84` |
| **Equivalente en repo nuevo** | No |
| **Recomendación** | **Reemplazar** — El repo nuevo no tiene API de polling ni Zustand. En su lugar, usar React Query / SWR o el patrón de server components con revalidación automática de Next.js. |

### A.11 usePublicReadModelPulse (Public Data Polling)

| Campo | Detalle |
|-------|---------|
| **Nombre** | Public Read Model Pulse |
| **Descripción** | Hook de polling para recursos públicos. Diferente de useSyncPulse en que no acepta namespace y usa endpoints `/api/public-data/` separados. Diseñado deliberadamente sin acceso al Vault privado. |
| **Ubicación legacy** | `src/hooks/usePublicReadModelPulse.ts:1-41` |
| **Equivalente en repo nuevo** | No |
| **Recomendación** | **Reemplazar** — El repo nuevo no tiene endpoints públicos de datos. Para datos públicos (catálogo, portafolio), usar server components con revalidación de Next.js en vez de polling. |

### A.12 Zustand State Management (useMateriaStore)

| Campo | Detalle |
|-------|---------|
| **Nombre** | Zustand Global Store (Materia) |
| **Descripción** | Store global de Zustand para el estado de la aplicación cotizador. Los eventos del motor se procesan y aplican al store via `processEvents` y `useMateriaStore.getState().updateItem()`. |
| **Ubicación legacy** | `src/components/specialized/cotizador/CotizadorPro.tsx:23` (`useMateriaStore` de `@agnostic/core`) |
| **Equivalente en repo nuevo** | No |
| **Recomendación** | **Reemplazar** — El nuevo schema usa React `useState`/`useReducer` para estado local y no tiene store global. Para estado compartido entre componentes, usar React Context o Zustand como dependencia opcional. |

### A.13 Suspense-less Data Loading

| Campo | Detalle |
|-------|---------|
| **Nombre** | Loading State Pattern (sin Suspense) |
| **Descripción** | Patrón de carga de datos donde se usa un booleano `loading` para mostrar estado de carga, sin `Suspense` boundaries. Toda la data se carga en `useEffect` con `setLoading(true/false)`. |
| **Ubicación legacy** | `src/components/specialized/cotizador/CotizadorPro.tsx:58,123-148` |
| **Equivalente en repo nuevo** | Parcial — El repo nuevo en `app/cotizador/page.tsx` usa `"use client"` con `useState` pero no tiene Suspense boundaries ni loading states reales (usa datos mock estáticos). |
| **Recomendación** | **Adaptar** — En el nuevo schema, usar `Suspense` boundaries de Next.js para server components que consulten la base de datos. Para client components, mantener el patrón de `loading` booleano pero agregar Suspense donde aplique. |

### A.14 Design Token System (Tailwind v4 @theme)

| Campo | Detalle |
|-------|---------|
| **Nombre** | Design Token System |
| **Descripción** | Sistema de tokens de diseño declarado en `@theme` de Tailwind v4 dentro de `globals.css`. Incluye: colores primitivos (Luz & Biofilia + madera), colores semánticos de estado, colores de rol de superficie, colores de componente, familias tipográficas, escala tipográfica estática + fluida, escala de spacing (base 4px), radios, sombras, z-index por capa, tokens de motion (--dur-*, --ease-*). |
| **Ubicación legacy** | No existe en el legacy (el legacy no tiene sistema de tokens) |
| **Equivalente en repo nuevo** | Sí — `app/globals.css:10-130` |
| **Recomendación** | **Preservar** — Es la base del sistema visual canónico del nuevo schema. No modificar sin aprobación del Supervisor. |

### A.15 Component Primitives (veta/)

| Campo | Detalle |
|-------|---------|
| **Nombre** | Component Primitives (Button, Badge, Modal, InputField, Stepper, StatCard, NavItem, ShellProvider, AppShell, WebGLHero) |
| **Descripción** | Conjunto de primitivas de UI en `components/veta/` que implementan el sistema visual canónico. Cada primitiva usa tokens de diseño (no literales), tiene variantes controladas, y sigue las reglas de accesibilidad (focus ring, reduced-motion, aria). |
| **Ubicación legacy** | No existe en el legacy (el legacy usa componentes de `@agnostic/core` y `@/components/ui/`) |
| **Equivalente en repo nuevo** | Sí — `components/veta/*.tsx` |
| **Recomendación** | **Preservar** — Es la capa de presentación del nuevo schema. Añadir primitivas según se necesiten (ej. Combobox, DataTable) siguiendo el mismo patrón. |

### A.16 Drizzle ORM Schema Pattern

| Campo | Detalle |
|-------|---------|
| **Nombre** | Explicit Drizzle Schema |
| **Descripción** | Schema de base de datos explícito usando Drizzle ORM con `pgTable`, `pgEnum`, `foreignKey`, `unique`, `check`, `jsonb`, `numeric` (con precision/scale para dinero), `timestamp` con `mode: 'string'`. Cada tabla tiene UUID como PK con `defaultRandom()`. |
| **Ubicación legacy** | No existe en el legacy (el legacy usa el motor Agnostic con schemas interpretados en runtime) |
| **Equivalente en repo nuevo** | Sí — `lib/db/schema.ts:1-543` |
| **Recomendación** | **Preservar** — Es el schema de datos del nuevo sistema. No modificar sin aprobación del Supervisor. |

### A.17 Drizzle Relations Pattern

| Campo | Detalle |
|-------|---------|
| **Nombre** | Drizzle Relations |
| **Descripción** | Definición explícita de relaciones entre tablas usando `relations()` de Drizzle con `one()` y `many()`. Cada FK tiene su propia relación con nombre explícito. |
| **Ubicación legacy** | No existe en el legacy |
| **Equivalente en repo nuevo** | Sí — `lib/db/relations.ts:1-179` |
| **Recomendación** | **Preservar** — Es parte del schema de datos. No modificar sin aprobación del Supervisor. |

### A.18 App Router Page Pattern ("use client")

| Campo | Detalle |
|-------|---------|
| **Nombre** | Client Component Page |
| **Descripción** | Páginas de App Router marcadas con `"use client"` que importan primitivas de `components/veta/` y usan `useState` para interactividad. El repo nuevo tiene 3 páginas: landing, cotizador, cronograma — todas son client components con datos mock estáticos. |
| **Ubicación legacy** | El legacy usa una mezcla de server y client components |
| **Equivalente en repo nuevo** | Sí — `app/cotizador/page.tsx`, `app/cronograma/page.tsx`, `app/landing/page.tsx` |
| **Recomendación** | **Preservar** — El patrón de App Router con `"use client"` para páginas interactivas es el enfoque del nuevo schema. Usar server components para páginas que solo lean datos y client components para las que escriban. |

---

## B. Definición de la Capa Técnica L1

### B.1 Catálogo de Patrones Aprobados

| # | Patrón | Ubicación propuesta en código nuevo | Regla de uso |
|---|--------|-------------------------------------|--------------|
| 1 | **COP Currency Formatter** | `lib/utils.ts` | Usar en cualquier campo monetario para formato de visualización. Importar desde `@/lib/utils`. |
| 2 | **cn() ClassName Helper** | `lib/utils.ts` | Usar en todas las primitivas de UI para composición de clases Tailwind. Reemplaza `clsx` + `twMerge` manual. |
| 3 | **useDebounce** | `lib/hooks/useDebounce.ts` | Usar para retrasar actualización de valores en inputs de búsqueda, filtros, y autoguardado. Importar desde `@/lib/hooks/useDebounce`. |
| 4 | **useAutoSave** | `lib/hooks/useAutoSave.ts` | Usar en cualquier formulario de edición prolongada donde se pierdan datos si el usuario navega sin guardar. Adaptar para usar el cliente Drizzle en vez de `vWrite`. |
| 5 | **useSmartSearch** | `lib/hooks/useSmartSearch.ts` | Usar en cualquier módulo que requiera búsqueda difusa de datos con historial y seguimiento de uso. Adaptar para usar la API del repo nuevo. |
| 6 | **Parallel Data Loading** | Server components o `useEffect` en client components | Usar `Promise.all` para cargar datos relacionados en paralelo. En server components, usar `Promise.all` con queries de Drizzle. En client components, usar en `useEffect` con `fetch` o queries de React Query. |
| 7 | **MoneyInput Pattern** | `components/veta/` o `lib/` | Usar en cualquier campo de entrada monetaria. Mostrar formato COP en blur, valor numérico en focus. |
| 8 | **Design Token System** | `app/globals.css` (`@theme`) | No modificar sin aprobación del Supervisor. Todos los componentes de UI deben usar tokens, no literales. |
| 9 | **Component Primitives (veta/)** | `components/veta/` | Añadir nuevas primitivas siguiendo el mismo patrón: tokens de diseño, variantes controladas, accesibilidad. |
| 10 | **Drizzle Schema** | `lib/db/schema.ts` | No modificar sin aprobación del Supervisor. Todas las tablas usan UUID PK, `foreignKey`, `unique`, `check`. |
| 11 | **Drizzle Relations** | `lib/db/relations.ts` | No modificar sin aprobación del Supervisor. Cada FK tiene su relación con nombre explícito. |
| 12 | **App Router Client Pages** | `app/*/page.tsx` con `"use client"` | Usar `"use client"` solo para páginas interactivas. Páginas de solo lectura usar server components. |
| 13 | **Suspense Boundaries** | `app/*/page.tsx` | Usar `<Suspense>` alrededor de componentes que usen `useSearchParams()` o que consulten datos. Requerido para prerenderización estática. |
| 14 | **Loading State Pattern** | En cada componente que cargue datos | Usar `loading` booleano + estado de error. Combinar con Suspense para server components. |

### B.2 Dependencias entre Patrones

```
Design Token System (8)
    └── Component Primitives (9)  ← depende de los tokens
        └── MoneyInput Pattern (7)  ← usa primitivas de UI
        └── useSmartSearch (5)  ← usa primitivas de UI
        └── useAutoSave (4)  ← usa primitivas de UI (toast, etc.)

lib/utils.ts (1, 2)  ← base para todos los demás
    └── COP formatter (1)  ← usado por MoneyInput (7) y useSmartSearch (5)
    └── cn() helper (2)  ← usado por todas las primitivas (9)

lib/hooks/ (3, 4, 5)  ← hooks compartidos
    └── useDebounce (3)  ← base para useAutoSave (4)
    └── useAutoSave (4)  ← usa useDebounce internamente
    └── useSmartSearch (5)  ← independiente

Drizzle Schema (10) + Relations (11)  ← base de datos
    └── Parallel Data Loading (6)  ← consulta el schema
    └── App Router Client Pages (12)  ← lee del schema vía server actions
        └── Suspense Boundaries (13)  ← rodea componentes que consultan datos
        └── Loading State Pattern (14)  ← se combina con Suspense
```

### B.3 Ubicación Propuesta de Archivos

```
lib/
├── utils.ts              # COP formatter + cn() helper (A.2, A.12)
├── hooks/
│   ├── useDebounce.ts    # Debounce hook (A.3)
│   ├── useAutoSave.ts    # Auto-save with race condition handling (A.4)
│   └── useSmartSearch.ts # Fuzzy search with history (A.5)
db/
├── schema.ts             # Drizzle schema (A.16) — NO MODIFICAR sin Supervisor
├── relations.ts          # Drizzle relations (A.17) — NO MODIFICAR sin Supervisor
└── client.ts             # Drizzle client setup
components/
└── veta/                 # UI primitives (A.15)
    ├── button.tsx
    ├── badge.tsx
    ├── modal.tsx
    ├── input-field.tsx
    ├── stepper.tsx
    ├── stat-card.tsx
    ├── nav-item.tsx
    ├── shell-provider.tsx
    ├── app-shell.tsx
    └── ... (añadir según necesidad)
app/
├── layout.tsx            # Root layout
├── page.tsx              # Home/hub
├── globals.css           # Design tokens (A.14) — NO MODIFICAR sin Supervisor
├── cotizador/
│   └── page.tsx          # Cotizador page (A.18)
├── cronograma/
│   └── page.tsx          # Cronograma page (A.18)
└── landing/
    └── page.tsx          # Landing page (A.18)
```

### B.4 Reglas de Uso por Patrón

| Patrón | Cuándo aplicar | Cuándo NO aplicar |
|--------|----------------|-------------------|
| COP formatter | Siempre que se muestre o edite un valor monetario | En cálculos internos (usar el número sin formatear) |
| cn() helper | En toda clase de componente que combine Tailwind classes | No usar `clsx` o `twMerge` directamente |
| useDebounce | En inputs de búsqueda, filtros, y cualquier valor que dispare una operación costosa | En valores que se actualizan inmediatamente (ej. toggle) |
| useAutoSave | En formularios de edición prolongada (cotizador, contratos, clientes) | En formularios de una sola acción (ej. login) |
| useSmartSearch | En cualquier selector de datos con más de 20 items | En listas pequeñas donde un filter simple basta |
| Parallel Data Loading | Al cargar datos relacionados que no dependen entre sí | Cuando los datos tienen dependencias secuenciales |
| MoneyInput | En campos de precio que el usuario edita | En campos de solo lectura |
| Suspense | Alrededor de componentes que usan `useSearchParams()` o consultan datos | En componentes que no cargan datos |
| Loading state | En todo componente que cargue datos asíncronos | En componentes que solo renderizan datos estáticos |

---

## C. Contrato de No-Rotura

Lo que NO puede cambiar sin afectar todas las fases F0-F9:

### C.1 Design Token System
- El sistema de tokens en `app/globals.css` (`@theme`) es la fuente de verdad del diseño visual.
- Modificar un token existente puede romper todas las primitivas de UI y todas las páginas.
- Añadir nuevos tokens es permitido siempre que no se eliminen o modifiquen los existentes.

### C.2 Drizzle Schema (lib/db/schema.ts)
- El schema de base de datos es la fuente de verdad de los datos.
- Modificar el schema (añadir/eliminar tablas, columnas, tipos) afecta todas las fases que tocan datos.
- Añadir tablas o columnas nuevas es permitido siempre que no se eliminen ni modifiquen las existentes.
- Los tipos de enums (`estadoContrato`, `estadoProyecto`, `rolEmpleado`, etc.) son contratos de dominio — no cambiar los valores existentes.

### C.3 Drizzle Relations (lib/db/relations.ts)
- Las relaciones entre tablas son contratos de integridad referencial.
- Cambiar una relación puede romper queries en todas las fases.

### C.4 Component Primitives (components/veta/)
- Las primitivas de UI son la capa de presentación canónica.
- Cambiar la API de una primitiva (props, variantes, comportamiento) rompe todas las páginas que la usan.
- Añadir nuevas primitivas o variantes es permitido.

### C.5 App Router Convention
- El patrón de `"use client"` para páginas interactivas y server components para páginas de solo lectura es una convención arquitectónica que afecta todo el proyecto.
- Cambiar esta convención requiere reevaluar todas las páginas existentes.

### C.6 lib/utils.ts (cn() + COP)
- `cn()` es la función de composición de clases usada por todas las primitivas.
- `COP()` es el formateador de moneda usado por todos los campos de precio.
- Eliminar o cambiar la firma de estas funciones rompe toda la capa de presentación.

### C.7 lib/hooks/ (useDebounce, useAutoSave, useSmartSearch)
- Estos hooks son la infraestructura de interactividad transversal.
- Cambiar su API o comportamiento afecta a todos los módulos que los usan.

---

## D. Intersección con M-06

### D.1 Relación con L3 (Diseño de P-04 — Cotizador)

La capa L1 provee los patrones de infraestructura de interfaz que P-04 (Cotizador) consume:

- **P-04 usa** `useAutoSave` para el autoguardado del header de cotización.
- **P-04 usa** `useSmartSearch` para la búsqueda inteligente de cotizaciones.
- **P-04 usa** `useDebounce` para la búsqueda en tiempo real.
- **P-04 usa** `COP` formatter para todos los campos de precio.
- **P-04 usa** `MoneyInput` pattern para la edición de valores monetarios.
- **P-04 usa** `vWrite`/`vRemove` para persistencia (que en el nuevo schema se reemplaza por Drizzle directo).
- **P-04 usa** `Promise.all` para carga paralela de datos.
- **P-04 usa** `processEvents` + `useMateriaStore` para eventos del motor (que en el nuevo schema se reemplaza por server actions).

### D.2 Relación con L4 (Diseño de P-05 — Sitio Público)

La capa L1 provee los patrones que P-05 (Sitio Público) consume:

- **P-05 usa** el Design Token System para todos los estilos visuales.
- **P-05 usa** las primitivas de `components/veta/` (Button, Badge, Modal, etc.).
- **P-05 usa** `useSmartSearch` si tiene búsqueda de productos/catálogo.
- **P-05 usa** `usePublicReadModelPulse` para datos públicos (que en el nuevo schema se reemplaza por server components con revalidación).
- **P-05 usa** `Suspense` boundaries para páginas que cargan datos (que el legacy no tenía).

### D.3 Punto de Intersección al Final de F9

Al final de F9, la capa L1 se cruza con el resto de M-06 de la siguiente manera:

```
L1 (esta capa)          L3 (P-04 Diseño)           L4 (P-05 Diseño)
─────────────────        ──────────────────         ──────────────────
Design Tokens ──────────→ Primitivas veta/ ────────→ Páginas públicas
    │                        │                           │
    │                        ├──→ Cotizador page         ├──→ Landing page
    │                        ├──→ Contrato modal         ├──→ Badge mockups
    │                        └──→ Payment schedule       └──→ Cronograma page
    │
lib/utils.ts ────────────→ COP, cn() en todos lados    → Token-consistente
lib/hooks/ ──────────────→ AutoSave, SmartSearch ─────→ Uso en P-04 y P-05
Drizzle Schema ──────────→ Datos del cotizador ───────→ Datos del catálogo público
App Router Convention ───→ Server + Client pages ─────→ Server components para SEO
```

La capa L1 es la **capa de cruce** que permite que P-04 y P-05 compartan la misma infraestructura técnica sin acoplamiento de negocio. Los cambios en L1 requieren evaluación de impacto en todas las fases F0-F9. Los cambios en L3 o L4 no afectan L1 a menos que modifiquen los contratos de interfaz (props de primitivas, hooks API, token names).

---

## Apéndice: Trazabilidad de Fuentes

| Patrón | Fuente | Línea(s) |
|--------|--------|----------|
| Vault CRUD (vWrite/vRemove) | `src/components/specialized/cotizador/utils.ts` | 17-30 |
| COP Formatter | `src/components/specialized/cotizador/utils.ts` | 3-6 |
| useDebounce (utils.ts) | `src/components/specialized/cotizador/utils.ts` | 8-15 |
| useDebounce (hooks/) | `src/hooks/useDebounce.ts` | 13-27 |
| useAutoSave | `src/hooks/useAutoSave.ts` | 1-86 |
| useSmartSearch | `src/hooks/useSmartSearch.ts` | 1-229 |
| toContractZapRecord | `src/components/specialized/cotizador/contrato-payload.ts` | 14-27 |
| Parallel Data Loading | `src/components/specialized/cotizador/CotizadorPro.tsx` | 126-136 |
| Zap Engine Dispatch | `src/components/specialized/cotizador/CotizadorPro.tsx` | 150-159 |
| MoneyInput | `src/components/specialized/cotizador/MoneyInput.tsx` | 1-46 |
| useSyncPulse | `src/hooks/useSyncPulse.ts` | 1-84 |
| usePublicReadModelPulse | `src/hooks/usePublicReadModelPulse.ts` | 1-41 |
| Zustand Store | `src/components/specialized/cotizador/CotizadorPro.tsx` | 23 |
| Design Token System | `app/globals.css` | 10-130 |
| Component Primitives | `components/veta/*.tsx` | 1-89 (badge.tsx) |
| Drizzle Schema | `lib/db/schema.ts` | 1-543 |
| Drizzle Relations | `lib/db/relations.ts` | 1-179 |
| App Router Pages | `app/cotizador/page.tsx` | 1-162 |
| cn() helper (legacy) | `src/lib/utils.ts` | 4-6 |
| fuzzySearch (legacy) | `src/lib/utils.ts` | 28-69 |
| Loading State Pattern | `src/components/specialized/cotizador/CotizadorPro.tsx` | 58,123-148 |
| Suspense (ausente en legacy) | — | — |
