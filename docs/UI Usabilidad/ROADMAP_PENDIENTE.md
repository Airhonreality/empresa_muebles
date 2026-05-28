# Roadmap — Pendientes del Editor Visual

> Items que no se recomiendan tocar ahora pero que deben quedar en el radar.
> Ordenados por impacto estimado vs complejidad de implementación.

---

## TIER 1 — Alta deseabilidad, complejidad media

### 1. Undo / Redo (Ctrl+Z / Ctrl+Y)

**Por qué no ahora:** Requiere un stack de historial de acciones en `useDesignerStore`. El problema es que cada cambio persiste vía `saveItem` con debounce de 600ms — un undo naïve revertería también el storage. Necesita un patrón de comando (Command Pattern) donde cada acción produce una operación inversa antes de hacer el debounce-save.

**Referencia de arquitectura:** El `useDesignerStore` debería tener `undoStack: any[]` y `redoStack: any[]`. Cada `update()` en NodeConfig empuja el estado anterior al stack. El flush al storage solo ocurre cuando el usuario para de editar, no en cada undo/redo.

---

### 2. Drag-and-drop en el árbol de nodos

**Por qué no ahora:** El `AgnosticTreeView` usa una lista plana renderizada recursivamente. Drag-and-drop anidado requiere un drop-target por slot, detección de profundidad por hover, y el mecanismo de `reparent` ya existe pero solo vía select — conectarlo al drag es el trabajo restante.

**Referencia:** Usar `@dnd-kit/sortable` con soporte para árboles anidados. La lógica de `extractNodeFromTree` + `insertIntoParent` ya está en NodeConfig y puede reutilizarse.

---

### 3. Token picker visual (nombres amigables)

**Por qué no ahora:** `TokenInput` actualmente muestra strings CSS crudos (`hsl(var(--primary))`) en las sugerencias. Se necesita una tabla de resolución `cssVar → { label, preview }` construida desde los DataItems del namespace `tokens`.

**Referencia:** Agregar a `TokenInput` una prop `resolveLabel?: (cssVar: string) => string`. En `FramePanel` pasarla con un `useMemo` que mapea `tokens.data.name → tokens.data.label`. El dropdown mostraría "Primary color" en vez de `hsl(var(--primary))`.

---

### 4. Panel de `TextNodeV3` con tipografía avanzada

**Por qué no ahora:** `TextPanel` existe pero es muy simple. Un panel real de texto necesita: font-family (con sugerencias de Google Fonts o tokens), font-weight como pills, line-height, letter-spacing, text-align (4 botones), text-decoration, text-transform.

**Referencia:** Misma arquitectura que `FramePanel` pero para propiedades tipográficas. Las sugerencias de font-family pueden venir de un namespace `fonts` en storage.

---

## TIER 2 — Necesario a futuro, complejidad alta

### 5. Field-level bindings — Modelo B de estilos

**Por qué no ahora:** El sistema actual usa `NodeStyle` como un objeto CSS plano. Los bindings permitirían que `AtomNodeV3.field` pueda controlar propiedades visuales (ej: `backgroundColor` basado en `record.data.status`). Esto requiere un DSL de binding: `"style.background": "$record.status === 'active' ? 'green' : 'red'"`.

**Impacto arquitectónico:** Rompería `FrameRenderer` y `AtomRenderer` que hoy asumen que `style` es un objeto estático. Todos los renderers necesitarían recibir `record` de contexto y evaluar expresiones.

**Prerequisito:** El `SlotContext` (`src/lib/agnostic/slotContext.ts`) ya existe como stub — es el lugar correcto para este trabajo.

---

### 6. Renderer headless para publicación

**Por qué no ahora:** El renderer actual tiene hooks de `useDesignerStore` en `FrameRenderer`. Separar un renderer "puro" (sin dependencias de editor) permitiría generar HTML estático para SEO, preview en iframe, y export a componentes standalone.

**Referencia:** Crear `src/components/agnostic/engine/renderers/headless/` con versiones de cada renderer sin ningún import de `store` ni `useDesignerStore`. El `NodeRenderer` recibiría un prop `mode: 'edit' | 'preview'` y switchearía entre las dos familias.

---

### 7. Schema migration versioning

**Por qué no ahora:** Cuando un campo cambia de nombre en un schema (ej: `nombre` → `title`), todos los registros existentes siguen usando la clave antigua y el renderer no muestra nada. Necesita un sistema de migrations en `storage/{tenant}/migrations/` con funciones `up` que transforman registros.

**Referencia:** El archivo `src/lib/agnostic/migrate.ts` ya existe para migrar routes de V2 a V3. El patrón puede extenderse a migrations de datos de negocio.

---

### 8. Granular Zustand — split de MateriaStore por namespace

**Por qué no ahora:** `useMateriaStore` guarda todos los datos en `data: Record<string, DataItem[]>`. Con muchos contextos (100+ registros × 10 namespaces) cualquier write al store re-renderiza todos los suscriptores.

**Referencia:** Split en stores dinámicos por namespace: `useContextStore(namespace)`. Zustand's `create` puede llamarse dinámicamente. Requiere refactorizar todos los puntos de suscripción.

---

## TIER 3 — Visión a largo plazo

### 9. Multi-selección y operaciones de grupo

Canvas-click con shift para seleccionar múltiples nodos. Mover/alinear/distribuir el grupo. Agrupar en un frame contenedor.

### 10. Colaboración en tiempo real (CRDT)

Múltiples usuarios editando la misma ruta simultáneamente. Requires `y-js` o `automerge` como CRDT layer por encima del adapter de storage. La naturaleza JSON de los DataItems lo hace relativamente compatible, pero el merge de árboles de nodos es el punto complejo.

### 11. Export a HTML semántico

Los `FrameNodeV3` se renderizan como `<div>`. Para SEO y accesibilidad, sería valioso que ciertos frames pudiesen ser `<article>`, `<section>`, `<nav>`, `<header>`. Agregar `semanticTag?: string` a `FrameNodeV3` y usarlo en el headless renderer.

### 12. Figma plugin / import desde Figma

Con el modelo de nodos V3 (`frame/slot/atom/text`) y el sistema de tokens CSS, importar desde Figma es arquitectónicamente posible. El Figma API devuelve árboles de frames y texto muy similares a `AnyNodeV3`. El trabajo principal sería el mapper de estilos Figma → NodeStyle.

---

## Nota sobre lo que SÍ fue implementado en esta sesión

| Feature | Estado |
|---------|--------|
| `useDesignerStore` (sesión de editor) | ✅ Completo |
| Frame selection ring (outline en canvas) | ✅ Completo |
| Bidirectional canvas ↔ tree sync | ✅ Completo |
| DNA/Materia store desync fix | ✅ Completo |
| FillPicker background conflict fix | ✅ Completo |
| `DimMode` (Fixed/Hug/Fill) en tipos + panel + renderer | ✅ Completo |
| 3×3 Alignment matrix en FramePanel | ✅ Completo |
| Collapsible sections (Borde, Sombra) | ✅ Completo |
| Inline editable label en NodeConfig header | ✅ Completo |
| Deselect on background click | ✅ Completo |
