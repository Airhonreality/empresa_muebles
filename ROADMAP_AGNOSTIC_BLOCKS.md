# ROADMAP — Sistema de Bloques Agnósticos (Figma-Style)

**Fecha de auditoría:** 2026-05-23  
**Branch activo:** `v2-sovereign-rebirth`  
**Metodología:** Axiomatic Design (Nam P. Suh) — Matriz de Desacoplamiento

---

## 1. Requisitos Funcionales (FRs)

| ID  | Functional Requirement |
|-----|------------------------|
| FR1 | Componer UI desde bloques anidados y parametrizables (frames dentro de frames, datos dentro de frames) |
| FR2 | Ver cambios de composición sin guardar ni navegar (feedback visual inmediato) |
| FR3 | Navegar la jerarquía del sistema (rutas, schemas, scripts) desde un árbol unificado |
| FR4 | Vincular cualquier bloque a uno o más schemas de datos (ADN) |
| FR5 | Parametrizar valores de diseño mediante tokens CSS en lugar de valores hardcodeados |
| FR6 | Ir a la ruta activa en el navegador con un clic, e identificar visualmente cuál es la ruta en curso |

---

## 2. Parámetros de Diseño (DPs) — lo que existe en el repo

| ID  | Design Parameter | Archivo principal |
|-----|------------------|-------------------|
| DP1 | `AgnosticFrame` + `RecursiveBlockComposer` + `buildLayerTree/updateNodeInTree` | `AgnosticFrame.tsx`, `AgnosticDesigner.tsx:RouteEditor` |
| DP2 | Estado `localData` en RouteEditor (changes live in memory, NOT rendered) | `AgnosticDesigner.tsx:573` |
| DP3 | `AgnosticTreeView` + `unifiedNodes` (routes/schemas/scripts) | `AgnosticTreeView.tsx`, `AgnosticDesigner.tsx:328` |
| DP4 | `AgnosticCollection` con `schema_id` + `context` (un solo schema por bloque) | `AgnosticCollection.tsx` |
| DP5 | `TokensEditor` + `resolveToken.ts` + `/api/tokens/sync` + `TokenOrStaticInput` | `TokensEditor.tsx`, `resolveToken.ts` |
| DP6 | `ExternalLink` en hover del TreeItem + botón "Abrir Ruta" en RouteEditor | `AgnosticTreeView.tsx:286`, `AgnosticDesigner.tsx:671` |

---

## 3. Matriz de Diseño (Design Matrix)

```
        DP1  DP2  DP3  DP4  DP5  DP6
FR1  [   X    0    0    0    0    0  ]   composición de bloques
FR2  [   X    X    0    0    0    0  ]   preview depende del compositor
FR3  [   0    0    X    0    0    0  ]   navegación pura, no acoplada
FR4  [   X    0    0    X    0    0  ]   binding depende de que haya frame
FR5  [   X    0    0    0    X    0  ]   tokens en frames
FR6  [   0    0    X    0    0    X  ]   navegación + link
```

**Resultado:** Matriz triangular inferior → diseño DESACOPLADO (válido según Axiom 1).  
El único acoplamiento es FR2↔DP1: el preview necesita el compositor. Esto es secuencialmente dependiente, no acoplamiento patológico.

---

## 4. Estado actual por FR

### ✅ FR1 — Composición de bloques
- `AgnosticFrame` registrado y funcional.
- RouteEditor con árbol de capas (izq, 260px) + panel de propiedades (der).
- `RecursiveBlockComposer` con picker dinámico desde `registry.getManifest()` agrupado por categoría.
- `updateNodeInTree` recursivo para mutaciones sin índice (sin entropía de índice).
- `buildLayerTree` convierte `block.blocks[]` en `TreeNode[]`.
- Bloques semánticos hardcodeados eliminados: `card_static`, `cta_banner`, `stats_grid`, `testimonial`.
- `AgnosticGroupedCard` eliminado — lógica migrada a `AgnosticCollection` (`group_by_key`, `segmentation_key`, `segmentation_rename`, tabs de segmentación).

### ⚠️ FR2 — Preview en tiempo real
- **GAP PRINCIPAL.** `localData` existe en memoria pero ningún `AgnosticRenderer` lo consume.
- El usuario debe guardar (`handleSave`) y navegar a la ruta para ver el resultado.
- **Pendiente:** Tercer panel o modo toggle que pase `localData.blocks` a `AgnosticRenderer` en vivo.

### ✅ FR3 — Navegación de jerarquía
- `AgnosticTreeView` con `unifiedNodes`: `root-routes`, `root-schemas`, `root-logic`.
- Drag & drop para reordenar (DnD Kit, `sortableKeyboardCoordinates`).
- Relaciones FK entrantes visibles en nodos de schema (lectura simétrica).
- Rail lateral (dna / users / tokens / silo) con `activeMode` para cambiar entre modos.
- `AdminGear` pasa `initialRouteId={activeRoute?.id}` al designer → la ruta actual se selecciona al abrir.

### ⚠️ FR3 — Indicador "ruta en curso" (sub-gap)
- La ruta activa SE selecciona al abrir el designer (vía `initialRouteId`).
- El `isSelected` aplica `bg-accent font-bold` al nodo → hay indicador visual cuando se abre.
- **GAP REAL:** Si el usuario navega a otra página con el designer abierto, el árbol no sigue el cambio de ruta. `selectedRouteId` es `useState` inicializado una sola vez.
- **Pendiente:** Sincronizar `selectedRouteId` con `activeRoute` reactivamente mientras el designer está abierto.

### ⚠️ FR4 — Vinculación a uno o más ADN
- Estado actual: `AgnosticCollection` acepta un solo `schema_id` + un solo `context`.
- Multi-ADN (múltiples schemas en un mismo bloque) no implementado.
- **Pendiente:** Definir el modelo de datos para `schema_ids: string[]` y cómo el renderer resuelve campos de múltiples schemas en una sola vista.

### ✅ FR5 — Design tokens parametrizados
- `SYSTEM_NS.TOKENS` en constants.ts.
- `TokensEditor` integrado como `activeMode === 'tokens'` en el rail.
- `resolveToken.ts`: `resolveValue`, `resolveColor`, `resolvePadding`.
- `/api/tokens/sync` genera `tokens.css` desde el namespace `design_tokens`.
- `TokenOrStaticInput` existe. **Pendiente:** integrarlo en el panel de propiedades del RouteEditor para frames (gap de integración, el widget existe pero no está conectado al editor de frames del RouteEditor).

### ✅ FR6 — Ir a la ruta activa
- `ExternalLink` en hover del nodo de ruta en el TreeView (`opacity-0 group-hover:opacity-100`).
- Botón "Abrir Ruta" en el header del RouteEditor (`window.open(localData.path, '_blank')`).
- Ambos funcionales.

---

## 5. Redundancias y entropía identificadas

| Problema | Archivo | Acción |
|----------|---------|--------|
| `paddingToCss()` duplicada | `AgnosticShell.tsx:36` duplica `resolvePadding` de `resolveToken.ts` | Eliminar local, importar `resolvePadding` |
| Namespace `'scripts'` como string literal | `AgnosticDesigner.tsx:116,199,210,213,217,220` | Añadir `SYSTEM_NS.SCRIPTS = 'scripts'` y reemplazar |
| `TokenOrStaticInput` sin conectar al RouteEditor | Widget existe, no usado en el panel de propiedades de frame | Conectar en el panel derecho del RouteEditor |

---

## 6. Pendientes priorizados (orden de ejecución)

### P1 — Live preview (FR2) — BLOQUEANTE para la visión Figma-style
```
RouteEditor
  └── Panel izquierdo: árbol de capas (existe ✅)
  └── Panel derecho: propiedades del bloque (existe ✅)
  └── Panel preview: AgnosticRenderer(blocks=localData.blocks) ← FALTA
```
Opciones de implementación:
- **A (recomendada):** Toggle button "Vista Previa / Propiedades" en el panel derecho. Cuando activo, renderiza `AgnosticRenderer` con `localData.blocks` envuelto en un `MockMateriaProvider` que inyecta los datos de `materia` actuales.
- **B:** Split vertical con el preview embebido a la derecha del árbol, siempre visible.

Restricción: `AgnosticRenderer` es `'use client'` y lee de Zustand. Para alimentarlo con `localData` sin guardar, se necesita pasar los bloques vía prop o usar un store temporal de preview.

### P2 — Sincronización reactiva de ruta activa (FR3 sub-gap)
```typescript
// En AgnosticDesigner, reemplazar useState por efecto reactivo:
const activeRoute = useActiveRoute(); // ya existe en store
useEffect(() => {
  if (activeRoute?.id && activeRoute.id !== selectedRouteId) {
    setSelectedRouteId(activeRoute.id);
  }
}, [activeRoute?.id]);
```
Cambio de 5 líneas. Cero entropía.

### P3 — `TokenOrStaticInput` en panel de propiedades de frame (FR5)
En el panel derecho del RouteEditor, cuando `selectedBlock.type === 'frame'`, los inputs de `gap`, `padding_*`, `min_height` deben usar `TokenOrStaticInput` en vez de `Input` numérico plano.

### P4 — Eliminar redundancias (entropía)
1. `AgnosticShell:paddingToCss` → importar `resolvePadding`
2. `'scripts'` literal → `SYSTEM_NS.SCRIPTS`

### P5 — Multi-ADN (FR4) — No urgente, diseñar primero el modelo
Propuesta de modelo:
```json
{
  "type": "collection",
  "bindings": [
    { "schema_id": "productos", "context": "productos", "role": "primary" },
    { "schema_id": "imagenes",  "context": "imagenes",  "role": "gallery", "parent_key": "producto_id" }
  ]
}
```
`AgnosticCollection` resolvería `bindings[]` en lugar de `schema_id` singular. La matriz de diseño no cambia — FR4 sigue siendo DP4 sin acoplamiento nuevo.

---

## 7. Lo que NO se construirá (scope freeze)

- Módulos semánticos hardcodeados (`hero` como tipo especial de bloque): `hero` es un `AgnosticVisual` con `variant: 'hero'` — es una hoja, no un tipo de composición.
- Lógica de negocio en `src/` — sigue en `storage/{tenant}/db/scripts.json`.
- Sistema de autenticación en el seed — depende del portal externo.
- Staging/preview branch — es ROADMAP_CONFIG_GAPS.md (infraestructura, no bloques UI).

---

## 8. Definición de "hecho" para el scope Figma-style

El scope está completo cuando:

1. Abres el designer, ves el árbol de capas de la ruta activa.
2. Haces click en un bloque (frame o hoja) — aparecen sus propiedades.
3. Cambias un valor (gap, schema, contenido) — el preview a la derecha actualiza sin guardar.
4. Navegas a otra página — el árbol del designer sigue la ruta nueva.
5. Los valores numéricos de layout en frames pueden ser tokens `var(--nombre)` o estáticos.
6. Una colección puede proyectar datos de múltiples schemas en una sola vista (P5).
