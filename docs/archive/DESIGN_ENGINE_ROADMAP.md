# Design Engine — Roadmap Axiómatico
> Compilado 2026-05-26. Basado en análisis en `docs/UI Usabilidad/Paradigma del motor de render`.
> Este documento es el plan de saneamiento arquitectónico. No es una lista de features.

---

## 0. Punto de partida honesto

El archivo `Paradigma del motor de render` diagnostica correctamente el problema central:

> **Nuestro sistema edita CSS directamente. CSS es el modelo. Eso rompe todo.**

Todos los bugs del editor (blank page, no reactividad, Fill sin padre, dos SSoT) son consecuencias de esa decisión, no errores aislados. Los fixes de los últimos días son clínicamente pañitos de agua tibia sobre esa causa raíz. Esto no es una crítica — es el punto de partida correcto para decidir qué hacer.

---

## 1. Lo que hacen los grandes en 2026 — Investigación

Analicé los patrones de seis sistemas: Figma, Framer, Builder.io, Plasmic, Penpot, Webflow.

**Convergencia universal:**

```
Modelo de diseño (semántico, abstracto)
        ↓  [Compilador — función pura, conoce el árbol completo]
Estilos resueltos (CSS válido, sin ambigüedad)
        ↓  [Renderer — función pura del input, sin estado global]
DOM / Canvas / SVG
```

| Herramienta | Modelo interno | Renderer | CSS es... |
|---|---|---|---|
| Figma | SceneGraph + Yoga (C++/WASM) | WebGL/Canvas | Irrelevante (no usa DOM) |
| Framer | ComponentGraph + props semánticos | React DOM | Output generado, no input |
| Builder.io | ComponentTree + typed props | React/Vue/Angular | Output de compilación |
| Plasmic | DesignTree + semantic slots | React | Módulo generado |
| Penpot | GeometryModel | SVG | Irrelevante |
| Webflow | SemanticModel + class system | HTML/CSS gen | Artefacto de build |
| **Nosotros** | **NodeStyle (CSS object)** | **DOM directo** | **El modelo mismo** |

**Insight crítico sobre WASM vs CSS Compiler:**

Figma necesita Yoga (WASM) porque su renderer es WebGL — no tiene CSS engine del browser.  
Para un renderer DOM como el nuestro, un **CSS Compiler en JavaScript puro** es la solución correcta, no WASM.  
Framer lo hace así. Plasmic lo hace así. El browser ya tiene un layout engine (CSS) — el trabajo es darle inputs correctos con semántica completa.

**El WASM sería over-engineering para nuestro caso.** Lo correcto es Option B: CSS Compiler semántico.

---

## 2. La arquitectura objetivo

```
┌────────────────────────────────────────────────────────────┐
│ NIVEL 0: NodeDesign (modelo semántico, el SSOT)            │
│  {                                                         │
│    id, kind, label                                         │
│    layout: { mode: 'flex-row' | 'flex-col' | 'none'       │
│              align: 'start' | 'center' | 'end'             │
│              justify: 'start' | 'center' | 'end' | 'between│
│              gap: number, wrap: boolean }                   │
│    sizing: { w: SizeValue, h: SizeValue }                  │
│             SizeValue = Fixed(n) | Hug | Fill              │
│    spacing: { t,r,b,l: number }   /* padding */            │
│    fill: FillValue | null                                   │
│    stroke: StrokeValue | null                              │
│    cornerRadius: number | CornerRadii                       │
│    opacity: number                                         │
│    overflow: 'visible' | 'hidden' | 'auto'                 │
│    path?: string           /* root frame only */            │
│    _rawCSS?: NodeStyle     /* escape hatch, no panel UI */ │
│  }                                                         │
│  → Nunca contiene strings CSS. Solo intención de diseño.  │
└────────────────────────┬───────────────────────────────────┘
                         │
              compile(node, parentContext)
              — función pura, sin efectos
              — conoce parent.layout.mode
              — valida: Fill requiere padre flex
              — 1ms para árboles de < 500 nodos
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│ NIVEL 1: ComputedStyle (CSS válido, determinístico)        │
│  React.CSSProperties — salida del compilador              │
│  → Nunca se persiste. Se recalcula en cada render.        │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│ NIVEL 2: FrameRenderer (función pura)                      │
│  <div style={computedStyle}>{children}</div>               │
│  → SIN isDesignMode. SIN minHeight de emergencia.         │
│  → Idéntico en editor y producción.                       │
└────────────────────────────────────────────────────────────┘
                         +
┌────────────────────────────────────────────────────────────┐
│ NIVEL 3: DesignOverlay (Portal separado, no en renderer)  │
│  Selection rings, labels, click handlers, resize handles  │
│  → React.createPortal → fuera del árbol de render         │
│  → Conoce node positions via getBoundingClientRect        │
└────────────────────────────────────────────────────────────┘
```

**Modelo de reactividad (sin HTTP en el camino crítico):**

```
Panel edita NodeDesign
    → useDesignSession.patch(nodeId, patch)   ← en memoria, síncrono
    → compile(session.tree)                   ← 1ms
    → FrameRenderer re-render                 ← INSTANTÁNEO

En background (debounce 1000ms):
    → saveItem(SYSTEM_NS.ROUTES, session.tree) ← HTTP, async, silente
    → Si falla: marca dirty, retry en foco
```

---

## 3. Auditoría Axiómatica — Nam P. Suh

### Axioma 1: Independencia (Independence Axiom)
*Mantener la independencia de los Functional Requirements.*

**Matriz de diseño — arquitectura propuesta:**

```
                   DP1          DP2          DP3          DP4
                 NodeDesign   CSS         Session      Design
                 (modelo)    Compiler     Store        Overlay
FR1 Render        X            X
FR2 Real-time                  X           X
FR3 Persistencia                           X
FR4 Parent ctx    X            X
FR5 Editor UI                                           X
```

La matriz es **triangular inferior** — los DPs no se acoplan hacia arriba. Satisface el Axioma 1.

**Comparación con el sistema actual:**

```
                CSS object    DNAStore    HTTP         isDesignMode
FR1 Render        X             X          X              X       ← acoplado a 4 DPs
FR2 Real-time     X             X          X              X       ← idéntico
FR3 Persistencia  X             X          X
FR4 Parent ctx    —             —          —               ← IMPOSIBLE (no existe DP para esto)
FR5 Editor UI     X                                       X
```

El sistema actual **falla el Axioma 1** en FR1 y FR2 (acoplados a todos los DPs).  
FR4 es directamente inejecutable en la arquitectura actual.

### Axioma 2: Información (Information Axiom)
*Minimizar el contenido de información del diseño.*

| Métrica | Sistema actual | Propuesta |
|---|---|---|
| Saltos panel→canvas | 7 (incluyendo HTTP) | 3 (memoria) |
| SSoTs para tamaño de frame | 2 (`widthMode` + `style.width`) | 1 (`sizing.w`) |
| Estados posibles de un frame | ~∞ (CSS libre) | Finito (enum typing) |
| Stores de Zustand | 4 | 2 (Session + System) |
| Ramas en FrameRenderer | 3 (isDesignMode × isEmpty × hasBg) | 0 |

La propuesta **reduce significativamente la información** (complejidad) del sistema. Satisface el Axioma 2.

---

## 4. Vectores de Entropía — Pre-mortem

Estos son los errores que COMETEREMOS si no los anticipamos explícitamente.

### E1: Migración incompleta → tres formatos coexistiendo
**Riesgo:** V2 nodes (`Node` con `render`), V3 nodes con `style` (formato actual), V3 nodes con `design` (formato nuevo). El compiler tendría que manejar los tres.  
**Mitigación:** El compiler es el único punto de migración. Acepta los tres y emite CSS. La migración es opaca al renderer. Los datos se migran on-read via el adapter (lazy migration). Cuando un route se guarda por primera vez con el nuevo sistema, se persiste en formato nuevo.

### E2: La escape hatch `_rawCSS` se convierte en el modelo principal
**Riesgo:** El equipo usa `_rawCSS` para "hacer funcionar rápido" features que no están en `NodeDesign`, retrocediendo al CSS-como-modelo.  
**Mitigación:** `_rawCSS` **no aparece en el panel**. No hay UI para editarlo en el editor standard. Solo accesible via JSON directo o herramienta MCP. Documentarlo como "last resort para casos sin equivalente semántico".

### E3: El compiler se hace impuro (side effects)
**Riesgo:** Alguien agrega lógica de negocio al compiler (fetch data, read from store, generate IDs).  
**Mitigación:** El compiler debe ser un módulo puro de TypeScript sin imports de React, Zustand, o Next.js. Su firma: `compile(node: AnyNodeDesign, ctx: ParentContext): React.CSSProperties`. Testeado con Jest, sin mocks de ningún tipo.

### E4: Session Store se sincroniza con DNAStore doblemente
**Riesgo:** Al salvar, tanto Session Store como DNAStore se actualizan. Los suscriptores reciben dos eventos y el renderer renderiza dos veces.  
**Mitigación:** DNAStore desaparece como fuente primaria para el canvas. El canvas solo lee del Session Store. DNAStore puede quedar para "initial hydration" y convertirse en `ReadonlyBootstrapStore` que no acepta writes durante la sesión.

### E5: Parent context threading rompe el render tree
**Riesgo:** Para saber si un frame puede usar Fill, el renderer necesita el contexto del padre. Pasar esto via props crea un prop drilling de n niveles, y via React Context crea re-renders masivos.  
**Mitigación:** El **compilador** resuelve esto antes de que llegue al renderer. El renderer recibe CSS ya compilado. No necesita saber nada del padre — el compiler lo sabe. El renderer es `f(node) → JSX`, no `f(node, parentCtx) → JSX`.

### E6: beforeunload race condition
**Riesgo:** Usuario edita → cierra pestaña antes del background sync → cambios perdidos.  
**Mitigación:** `beforeunload` handler en Session Store que hace un `saveItem` síncrono (usando `navigator.sendBeacon`). Y optimistic writes: en cada patch, incrementar un `dirtyVersion` counter. Si `dirtyVersion > 0` al cerrar, el handler dispara.

### E7: Token references pierden su tipo en el nuevo modelo
**Riesgo:** `fill: { type: 'token', ref: 'primary' }` vs `fill: { type: 'solid', color: '#ff0000' }`. Si no está tipado estrictamente, volveremos a strings.  
**Mitigación:** Tipos discriminados en `indra.ts`:
```typescript
type FillValue =
  | { kind: 'solid';    color: string }      // hex o rgba
  | { kind: 'token';    ref: string }         // → hsl(var(--ref))
  | { kind: 'gradient'; stops: GradientStop[] }
  | { kind: 'image';    url: string; size: 'cover'|'contain'|'fill' }
  | { kind: 'none' };
```

### E8: Animaciones / transiciones CSS pierden su lugar
**Riesgo:** `transition`, `animation`, `transform` no tienen equivalente semántico obvio en `NodeDesign`. Se irán a `_rawCSS`. Si se usan mucho, la escape hatch crece.  
**Mitigación:** Agregar `motion?: MotionValue` a `NodeDesign` con un subset de propiedades de animación tipadas. No un sistema de animación completo — solo lo suficiente para que `_rawCSS` no sea necesario para casos comunes.

---

## 5. Basura Espacial post-migración

Código que debe eliminarse después de cada fase. Documentado aquí para que no quede flotando.

| Archivo | Basura espacial | Cuándo eliminar |
|---|---|---|
| `FrameRenderer.tsx` | `dimModeStyles()`, `designOverlay`, `isDesignMode`, `minHeight:32` | Fase 4 |
| `store.ts` | `useDNAStore` como fuente de verdad del canvas | Fase 2 |
| `AppContext.tsx` | `setRoutes(useMateriaStore.getState()...)` — el sync post-save | Fase 2 |
| `FramePanel.tsx` | `TokenInput` para propiedades con semántica propia (padding, gap) | Fase 3 |
| `indra.ts` | `NodeStyle = { [k: string]: string|number }` — reemplazado por `NodeDesign` | Fase 5 |
| `AgnosticShell.tsx` | `hydrateDNA` dependency en rendering loop | Fase 2 |
| `NodeConfig.tsx` | `useDebounce(local, 600)` → HTTP chain | Fase 2 |
| `FILL_PICKER_PLAN.md`, `CONFIG_MANAGER.md` | Docs de trabajo, no arquitectura | Fase 1 |

---

## 6. Fases de Implementación

> **Regla meta:** cada fase tiene un criterio de salida verificable. Si no puedes demostrar el criterio, la fase no termina.

---

### FASE 0 — Freeze + Contratos (1 semana, no hay código de runtime)

**Trabajo:**
1. Definir `NodeDesign` interface en `indra.ts` (additive — no rompe nada existente)
2. Definir `SizeValue`, `FillValue`, `StrokeValue`, `LayoutValue` como tipos discriminados
3. Definir la firma del compiler: `compile(node: AnyNodeDesign | AnyNodeV3, parentCtx: CompilerContext): ComputedNode`
4. Documentar `CompilerContext`: `{ parentLayout: LayoutValue | null; parentSizing: SizeValue }`
5. Escribir la spec de migración: `migrateNodeStyle(node: AnyNodeV3): AnyNodeDesign`

**Anti-patrones a evitar en esta fase:**
- No escribir el compiler aún — solo su firma y tipos
- No tocar el renderer — solo los tipos
- No "mejorar" el panel — freeze

**Criterio de salida:** TypeScript compila con los nuevos tipos sin errores. Los tipos existentes siguen funcionando (backward compatible). El CLAUDE.md se actualiza con los nuevos contratos.

---

### FASE 1 — El Compiler (2 semanas)

**Trabajo:**
1. Implementar `compile()` como módulo puro en `src/lib/agnostic/compiler.ts`
2. Acepta `AnyNodeV3` (formato viejo) Y `AnyNodeDesign` (formato nuevo)
3. Emite `React.CSSProperties` idéntico al CSS que producía el formato viejo
4. Para el formato nuevo, resuelve correctamente: Fill solo con padre flex, Hug → fit-content, tokens → CSS vars
5. Tests unitarios: ≥ 20 casos, sin mocks de React, sin Next.js

**Anti-patrones:**
- No importar `useDesignerStore`, `useDNAStore`, o cualquier Zustand store
- No hacer fetch ni I/O de ningún tipo
- No usar `document` ni `window`

**Criterio de salida:** `npm test` pasa con 20+ casos del compiler. La salida del compiler para un nodo V3 con `style` existente es idéntica al CSS que producía el renderer actual (verificable con snapshot tests).

---

### FASE 2 — Session Store + Reactividad instantánea (2 semanas)

**Trabajo:**
1. Crear `useDesignSession` store en `store.ts`:
   ```typescript
   interface DesignSession {
     tree: AnyNodeDesign | null;       // el árbol en memoria
     dirtyVersion: number;             // incrementa en cada patch
     patch: (nodeId: string, design: Partial<NodeDesign>) => void;
     commit: () => Promise<void>;      // flushea a storage
   }
   ```
2. `NodeConfig.update()` llama `session.patch()` en vez de setLocal + debounce
3. `AgnosticShell` lee `session.tree` para el canvas (no DNAStore)
4. El compiler se invoca en el render de `NodeRenderer` con el nodo del session tree
5. Background sync: `useEffect` con debounce 1000ms que llama `session.commit()`
6. `beforeunload` handler para flush síncrono vía `sendBeacon`

**Anti-patrones:**
- No eliminar `useDNAStore` todavía — mantenerlo para initial hydration
- No migrar los datos en este paso — el compiler maneja el formato viejo

**Criterio de salida:** Cambiar el `fill` de un frame en el panel → el cambio es visible en el canvas **en el mismo frame de render** (< 16ms). Verificable con React DevTools profiler. La persistencia en `/api/vault` ocurre en background sin bloquear el canvas.

---

### FASE 3 — Panel semántico (2 semanas)

**Trabajo:**
1. `FramePanel` edita `NodeDesign`, no `NodeStyle`
2. Padding: inputs numéricos (px), no `TokenInput` con strings CSS
3. Gap: input numérico, no string
4. Fill: `FillPicker` produce `FillValue`, no CSS string
5. SizeValue: un único input que muestra el número cuando `Fixed`, o el pill cuando `Hug/Fill`
6. El panel conoce `parentCtx` (desde `NodeConfig` que ya tiene el route completo) → `Fill` deshabilitado si padre no es flex
7. Tokens: el dropdown muestra **nombre amigable del token** + preview de color, no la CSS var

**Anti-patrones:**
- No mostrar CSS vars en ningún input de usuario (solo en el `_rawCSS` escape hatch)
- No mostrar unidades rem al usuario — usar px, que el compiler convierte
- No duplicar la lógica de validación de Fill en el panel Y el compiler — el compiler es la autoridad

**Criterio de salida:** Un usuario sin conocimiento de CSS puede configurar un frame (tamaño, color, layout) sin ver ni una property CSS. Panel produce `NodeDesign`, nunca CSS strings.

---

### FASE 4 — Renderer puro + DesignOverlay separado (1 semana)

**Trabajo:**
1. `FrameRenderer` = `<div style={compiler(node, ctx)}>{children}</div>` — nada más
2. Crear `DesignOverlay` component que usa `React.createPortal` al body
3. `DesignOverlay` inyecta selection rings, labels, click handlers — lee posiciones via `getBoundingClientRect` en un `useLayoutEffect`
4. Eliminar `isDesignMode` de `FrameRenderer`
5. Eliminar `minHeight: 32` de `FrameRenderer`
6. El canvas en producción y en editor es idéntico

**Anti-patrones:**
- No volver a poner lógica de editor dentro de los renderers
- No calcular posiciones en CSS (position:absolute offsets) — usar `getBoundingClientRect`
- El Portal debe actualizarse en `resize` y `scroll` (ResizeObserver + scroll listener)

**Criterio de salida:** Abrir y cerrar el AdminGear no cambia NADA en el canvas. El frame renderiza igual con el editor abierto que con él cerrado. Verificable con screenshot diff.

---

### FASE 5 — Migración de datos + Limpieza (1 semana)

**Trabajo:**
1. Implementar `migrateOnRead` en `LocalStrategy`: cuando se lee un route con formato viejo, se migra a `NodeDesign` y se guarda en formato nuevo
2. Eliminar toda la "basura espacial" documentada en la sección 5
3. Eliminar `NodeStyle` del vocabulario público (puede quedar como `_rawCSS`)
4. Actualizar `CLAUDE.md` con los nuevos contratos
5. Archivar/eliminar `FILL_PICKER_PLAN.md`, `CONFIG_MANAGER.md`, `NODE_MODEL.md` (reemplazados por este roadmap)

**Criterio de salida:** `npx tsc --noEmit` sin errores. Cero referencias a `node.style` en renderers. El diff del bundle de producción es < que el bundle actual (eliminamos código).

---

## 7. Lo que NO se toca en ninguna fase

Estos sistemas están bien — modificarlos introduce entropía sin beneficio:

| Sistema | Por qué no tocarlo |
|---|---|
| Storage adapters (Local, Supabase, GitHub) | El adapter recibe JSON — el formato del JSON cambia, el adapter no |
| Sistema de rutas (`resolver.ts`) | Independiente del modelo visual |
| AgnosticRenderer + bloque V2 | El blind renderer para datos de negocio es correcto en concepto |
| MCP Bridge (21 tools) | Capa de orquestación, no afectada por el modelo visual |
| Sistema de schemas y CRUD | Independiente del modelo visual |
| `src/app/api/vault/route.ts` | API correcta — el payload cambia, el endpoint no |

---

## 8. Resumen ejecutivo

El sistema tiene **una sola decisión arquitectónica a cambiar**: CSS como modelo → NodeDesign como modelo.

Todo lo demás (reactividad, Fill/Hug correcto, renderer puro, editor overlay) es consecuencia de esa decisión. No hay atajos que eviten esa decisión. Los fixes que hemos hecho son correctos como UX pero incorrectos como arquitectura.

El esfuerzo estimado es **8 semanas** de trabajo en 5 fases secuenciales. Las fases no se pueden paralelizar porque cada una es prerequisito de la siguiente.

Lo que sale al otro lado:
- Canvas instantáneo (< 1 frame de latencia)
- Panel sin CSS expuesto al usuario
- Renderer idéntico en editor y producción
- Fill/Hug correcto con validación de contexto de padre
- TypeScript que previene estados imposibles (Fill + valor fijo en el mismo campo)
- Tests del compiler que verifican comportamiento sin browser

El storage, las rutas, los schemas, el MCP — todo eso queda. Solo el modelo visual cambia.
