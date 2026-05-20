# Settings Schema Upgrade — Designer UI Completeness
**Estado:** Listo para ejecutar  
**Ejecutor:** Gemini  
**Supervisor:** Claude  
**Archivos afectados:** 4 (3 JSON + 1 TypeScript)  
**Cambios TypeScript:** 1 sola línea en AgnosticForm.tsx  

---

## Contexto y objetivo

El sistema ya tiene la arquitectura correcta para exponer parámetros por tipo de bloque:

```
init.ts → registry.register('form', AgnosticForm, { settings_schema: formSettingsSchema })
             ↓
RecursiveBlockComposer → registry.getMetadata(block.type)?.settings_schema
             ↓
AgnosticConfigProjector → renderiza el schema dinámicamente
             ↓
Designer UI → el usuario configura sin hardcode
```

El problema: los tres JSON de settings (`form.settings.json`, `collection.settings.json`, `action.settings.json`) no reflejan todas las capacidades reales de sus componentes. Cuando agregas una capacidad nueva al componente pero no al JSON, el Designer no la expone.

### Pipeline namespace → flatten → prop (cómo funciona)

El `AgnosticConfigProjector` guarda los valores con su sección como namespace:
- Campo `hideSubmit` en sección `behavior` → guardado como `block.behavior.hideSubmit = true`

El `AgnosticRenderer` aplana las secciones en props:
```typescript
const effectiveConfig = {
  ...(block.behavior || {}),          // hideSubmit, isCollapsible, defaultExpanded, intent
  ...(block.visual || {}),            // switches, blackout, view, variant, singular, searchable
  ...(block.data_architecture || {}), // parent_key, segmentation_key, group_by_key, segmentation_rename
  ...(block.logic || {}),             // zap, save_forms_first
  ...config,
};
// → <BlockComponent {...block} {...effectiveConfig} />
```

Resultado: el componente recibe `hideSubmit: true` como prop directa. ✓

---

## Vectores de entropía detectados (LEER ANTES DE EJECUTAR)

### Vector 1 — `data_list` es una opción fantasma (CRÍTICO)
**Ubicación:** `collection.settings.json` → sección `visual` → campo `view` → opción `data_list`  
**Problema:** `AgnosticCollection` declara `view?: 'card_grid' | 'table' | 'editor_stack' | 'details'`. La opción `data_list` NO existe en el componente. Si el usuario la selecciona en el Designer, el render cae al branch `else` (flex-col sin estilos especiales) sin avisar.  
**Acción:** Eliminar `data_list`. Agregar `editor_stack` y `details`.

### Vector 2 — `visible_fields` espera `string[]` pero ConfigProjector entrega `string` (CRÍTICO)
**Ubicación:** `AgnosticForm.tsx` línea con `effectiveVisibleFields`  
**Problema:** `AgnosticForm` declara `visible_fields?: string[]`. El ConfigProjector guarda campos `string` como texto plano. Si el usuario escribe `"nombre, precio"`, el componente recibe un string, `Array.isArray` falla, y el filtro se ignora silenciosamente.  
**Acción:** Una línea de normalización en `AgnosticForm.tsx` (ver sección "Cambio TypeScript").

### Vector 3 — `switches` ≠ `visible_fields` (confusión semántica)
**Ubicación:** `form.settings.json` y `collection.settings.json` → sección `visual`  
**Problema:** El campo `switches` en el schema es la lista de columnas para proyección en tabla/colección (`AgnosticTable`/`AgnosticGroupedCard`). El campo `visible_fields` es la restricción de campos renderizados en el formulario (`AgnosticForm`). Son mecanismos distintos con nombres similares. Si se mezclan, el formulario no filtra y la tabla no proyecta.  
**Acción:** Las descripciones de ambos campos deben ser explícitas sobre su alcance. No unificarlos.

### Vector 4 — `view` + `group_by_key` están acoplados (comportamiento sorpresivo)
**Ubicación:** `AgnosticCollection.tsx` render logic  
**Problema:** Cuando `group_by_key` está configurado, el componente siempre renderiza `AgnosticGroupedCard` independientemente del valor de `view`. La prop `view` solo tiene efecto cuando `group_by_key` está vacío. Si el usuario configura `view: 'table'` y `group_by_key: 'nombre'`, obtiene GroupedCards, no tabla.  
**Acción:** Documentar en la descripción del campo `view` en el schema.

### Vector 5 — `details` view no tiene render propio
**Ubicación:** `AgnosticCollection.tsx` línea 349-352  
**Problema:** El branch final del render es:
```typescript
// GRID / STACK DEFAULT LAYOUT
<div className={view === 'card_grid' ? "grid ..." : "flex flex-col gap-6"}>
```
Tanto `editor_stack` como `details` caen al `else` del ternario y reciben `flex flex-col gap-6`. Son semánticamente distintos en la UI del cotizador (diferente styling de las Cards en línea 359), pero el `view` prop no discrimina explícitamente entre ellos en el wrapper externo. Esto es correcto por diseño actual — documentar.

---

## Cambio TypeScript (1 línea) — `AgnosticForm.tsx`

**Archivo:** `src/components/agnostic/blocks/AgnosticForm.tsx`  
**Ubicación:** Buscar la línea que contiene `effectiveVisibleFields`

**Reemplazar:**
```typescript
const effectiveVisibleFields = visible_fields || blockConfig?.visible_fields || blockConfig?.visual?.visible_fields;
if (Array.isArray(effectiveVisibleFields) && effectiveVisibleFields.length > 0) {
  allFields = allFields.filter((f: any) => effectiveVisibleFields.includes(f.key));
}
```

**Con:**
```typescript
// Normalize: Designer stores as comma-string, direct JSON can be string[].
const rawVF = visible_fields || blockConfig?.visible_fields || blockConfig?.visual?.visible_fields;
const effectiveVisibleFields: string[] | undefined = typeof rawVF === 'string'
  ? rawVF.split(',').map((s: string) => s.trim()).filter(Boolean)
  : rawVF;
if (Array.isArray(effectiveVisibleFields) && effectiveVisibleFields.length > 0) {
  allFields = allFields.filter((f: any) => effectiveVisibleFields.includes(f.key));
}
```

---

## Cambio 1 — `src/core/designer/dna/schemas/form.settings.json`

Reemplazar el contenido completo del archivo con:

```json
{
  "id": "form_settings_def",
  "name": "form_settings",
  "description": "Configuración paramétrica específica para Formularios",
  "fields": [
    {
      "key": "behavior",
      "label": "Comportamiento",
      "icon": "Activity",
      "type": "section",
      "fields": [
        {
          "key": "intent",
          "label": "Intención (Modo Operación)",
          "type": "select",
          "options": [
            { "label": "Adaptativo (Inferencia Automática)", "value": "auto" },
            { "label": "Creación (Formulario Vacío)", "value": "create" },
            { "label": "Edición (Cargar Registro Activo)", "value": "edit" },
            { "label": "Lectura (Solo Proyección)", "value": "view" }
          ],
          "default": "auto",
          "description": "Define el comportamiento de carga de datos del formulario."
        },
        {
          "key": "isCollapsible",
          "label": "Permitir Colapsar",
          "type": "boolean",
          "description": "Muestra un control chevron para contraer/expandir el formulario. Por defecto: true."
        },
        {
          "key": "defaultExpanded",
          "label": "Expandido por Defecto",
          "type": "boolean",
          "description": "Define si el formulario inicia expandido (true) o colapsado (false). Solo aplica si isCollapsible está activo."
        },
        {
          "key": "hideSubmit",
          "label": "Auto-Guardado Silencioso",
          "type": "boolean",
          "description": "Oculta el botón de envío y activa guardado automático con debounce de 800ms. Muestra micro-indicador de estado en el footer (✓ Guardado / Guardando... / Error). Ideal para formularios de edición continua tipo Notion."
        }
      ]
    },
    {
      "key": "visual",
      "label": "Estética y Proyección",
      "icon": "Palette",
      "type": "section",
      "fields": [
        {
          "key": "switches",
          "label": "Campos Visibles en Tabla/Colección (Whitelist)",
          "type": "string",
          "description": "Controla qué columnas se proyectan en AgnosticTable y AgnosticGroupedCard. Separados por coma. DISTINTO de visible_fields: este afecta proyección de tabla, no el formulario."
        },
        {
          "key": "blackout",
          "label": "Campos Ocultos en Tabla/Colección (Blacklist)",
          "type": "string",
          "description": "Campos del esquema a ocultar en la proyección de tabla. Separados por coma."
        }
      ]
    },
    {
      "key": "data_architecture",
      "label": "Arquitectura de Datos",
      "icon": "Database",
      "type": "section",
      "fields": [
        {
          "key": "parent_key",
          "label": "Clave Foránea (Parent Key)",
          "type": "select",
          "options_source": "dna_fields",
          "description": "Identificador del campo que vincula este formulario con el registro jerárquico superior.",
          "placeholder": "Seleccionar foreign key..."
        },
        {
          "key": "visible_fields",
          "label": "Campos del Formulario (Restricción)",
          "type": "string",
          "description": "Field keys separados por coma que se renderizan en este formulario. Vacío = todos los campos del schema. DISTINTO de switches: esta prop actúa sobre el formulario, no sobre tablas. Ejemplo: nombre_proyecto, cliente_id, estado"
        }
      ]
    }
  ]
}
```

---

## Cambio 2 — `src/core/designer/dna/schemas/collection.settings.json`

Reemplazar el contenido completo del archivo con:

```json
{
  "id": "collection_settings_def",
  "name": "collection_settings",
  "description": "Configuración paramétrica específica para Colecciones y Tablas",
  "fields": [
    {
      "key": "behavior",
      "label": "Comportamiento",
      "icon": "Activity",
      "type": "section",
      "fields": [
        {
          "key": "intent",
          "label": "Intención (Modo Operación)",
          "type": "select",
          "options": [
            { "label": "Adaptativo (Inferencia Automática)", "value": "auto" },
            { "label": "Lista (Colección Plana)", "value": "list" }
          ],
          "default": "list"
        },
        {
          "key": "isCollapsible",
          "label": "Permitir Colapsar",
          "type": "boolean",
          "description": "Muestra un control chevron para contraer/expandir la colección. Por defecto: true."
        }
      ]
    },
    {
      "key": "visual",
      "label": "Estética y Proyección",
      "icon": "Palette",
      "type": "section",
      "fields": [
        {
          "key": "view",
          "label": "Modo de Vista",
          "type": "select",
          "options": [
            { "label": "Tarjetas (Card Grid)", "value": "card_grid" },
            { "label": "Tabla Inteligente (Table)", "value": "table" },
            { "label": "Editor en Pila (Editor Stack)", "value": "editor_stack" },
            { "label": "Vista Detalle (Details)", "value": "details" }
          ],
          "default": "card_grid",
          "description": "Modelo de visualización de los registros. IMPORTANTE: cuando group_by_key está configurado, siempre se renderiza AgnosticGroupedCard sin importar el valor de view."
        },
        {
          "key": "searchable",
          "label": "Habilitar Búsqueda en Tiempo Real",
          "type": "boolean",
          "description": "Muestra un input de búsqueda que filtra registros por cualquier campo visible. Por defecto: true."
        },
        {
          "key": "singular",
          "label": "Nombre Singular del Registro",
          "type": "string",
          "description": "Etiqueta para el botón de creación. Ejemplo: Producto, Espacio, Cliente, Variante. Si se omite, usa el nombre del schema."
        },
        {
          "key": "switches",
          "label": "Campos Visibles (Whitelist de Columnas)",
          "type": "string",
          "description": "Columnas a proyectar en tabla/cards separadas por coma. Vacío = todas. Controla AgnosticTable y AgnosticGroupedCard."
        },
        {
          "key": "blackout",
          "label": "Campos Ocultos (Blacklist de Columnas)",
          "type": "string",
          "description": "Columnas a ocultar en la proyección separadas por coma."
        }
      ]
    },
    {
      "key": "data_architecture",
      "label": "Arquitectura de Datos",
      "icon": "Database",
      "type": "section",
      "fields": [
        {
          "key": "parent_key",
          "label": "Clave Foránea (Parent Key)",
          "type": "select",
          "options_source": "dna_fields",
          "description": "Campo que vincula esta colección con el registro superior. El sistema infiere automáticamente si el schema tiene un campo de relación con el contexto padre."
        },
        {
          "key": "segmentation_key",
          "label": "Clave de Segmentación (Pivot)",
          "type": "select",
          "options_source": "dna_fields",
          "description": "Campo utilizado para particionar los datos en sub-vistas (Variantes, Categorías, Idiomas, etc)."
        },
        {
          "key": "segmentation_strategy",
          "label": "Estrategia de Segmentación",
          "type": "select",
          "options": [
            { "label": "Ninguna (Proyección Plana)", "value": "none" },
            { "label": "Pestañas (Tabs)", "value": "tabs" },
            { "label": "Pasos (Steps)", "value": "steps" },
            { "label": "Selector (Dropdown)", "value": "select" }
          ],
          "description": "Define la interfaz utilizada para alternar entre segmentos de datos. Requiere segmentation_key configurado."
        },
        {
          "key": "segmentation_rename",
          "label": "Renombrado Inline de Pestañas",
          "type": "boolean",
          "description": "Permite editar el nombre de una pestaña de segmento con doble clic. Al confirmar (Enter/blur) actualiza el campo segmentation_key en TODOS los registros del segmento. Solo aplica con segmentation_strategy: tabs."
        },
        {
          "key": "group_by_key",
          "label": "Agrupar por Campo (Group Key)",
          "type": "select",
          "options_source": "dna_fields",
          "description": "Agrupa los registros por el valor de este campo, renderizando un AgnosticGroupedCard por grupo. Cuando está activo, toma precedencia sobre view y la colección siempre usa AgnosticGroupedCard."
        }
      ]
    }
  ]
}
```

---

## Cambio 3 — `src/core/designer/dna/schemas/action.settings.json`

Reemplazar el contenido completo del archivo con:

```json
{
  "id": "action_settings_def",
  "name": "action_settings",
  "description": "Configuración paramétrica específica para Botones y Acciones",
  "fields": [
    {
      "key": "visual",
      "label": "Estética y Proyección",
      "icon": "Palette",
      "type": "section",
      "fields": [
        {
          "key": "label",
          "label": "Etiqueta del Botón",
          "type": "string",
          "description": "Texto visible en el botón. Si se omite, usa el campo title del bloque."
        },
        {
          "key": "variant",
          "label": "Variante de Estilo",
          "type": "select",
          "options": [
            { "label": "Default (Primario)", "value": "default" },
            { "label": "Secondary", "value": "secondary" },
            { "label": "Outline", "value": "outline" },
            { "label": "Ghost", "value": "ghost" },
            { "label": "Destructive", "value": "destructive" },
            { "label": "Link", "value": "link" }
          ],
          "default": "default"
        },
        {
          "key": "size",
          "label": "Tamaño del Botón",
          "type": "select",
          "options": [
            { "label": "Normal", "value": "default" },
            { "label": "Pequeño (SM)", "value": "sm" },
            { "label": "Grande (LG)", "value": "lg" },
            { "label": "Icono", "value": "icon" }
          ],
          "default": "default"
        },
        {
          "key": "icon",
          "label": "Icono (Lucide)",
          "type": "string",
          "description": "Nombre exacto del icono de la librería Lucide. Ejemplo: Save, Play, Trash, Printer, Sparkles."
        }
      ]
    },
    {
      "key": "logic",
      "label": "Automatización",
      "icon": "Zap",
      "type": "section",
      "fields": [
        {
          "key": "zap",
          "label": "Script Vinculado (Zap)",
          "type": "select",
          "description": "Selecciona el script a ejecutar en el servidor al presionar este botón. Los scripts se administran en storage/{tenant}/db/scripts.json.",
          "options_source": "logic_engine_registry"
        },
        {
          "key": "save_forms_first",
          "label": "Guardar Formularios Antes de Ejecutar",
          "type": "boolean",
          "description": "Antes de llamar al servidor, dispara el submit de todos los formularios registrados en la vista actual (formRegistry.saveAllForms()). Útil para botones que leen datos recientes del servidor. Muestra un toast de 'Guardando formularios...' durante el proceso."
        }
      ]
    }
  ]
}
```

---

## Verificación post-implementación

Gemini debe verificar cada punto antes de reportar como completo:

### 1. Pipeline namespace → prop (ejecutar mentalmente para cada campo nuevo)

| Campo nuevo | Sección JSON | Guardado como | Aplanado por renderer | Recibido como prop |
|---|---|---|---|---|
| `hideSubmit` | behavior | `block.behavior.hideSubmit` | `...(block.behavior)` | `hideSubmit: true` ✓ |
| `isCollapsible` | behavior | `block.behavior.isCollapsible` | `...(block.behavior)` | `isCollapsible: true` ✓ |
| `defaultExpanded` | behavior | `block.behavior.defaultExpanded` | `...(block.behavior)` | `defaultExpanded: true` ✓ |
| `visible_fields` | data_architecture | `block.data_architecture.visible_fields` | `...(block.data_architecture)` | `visible_fields: "a,b"` → normalizado a `["a","b"]` ✓ |
| `searchable` | visual | `block.visual.searchable` | `...(block.visual)` | `searchable: true` ✓ |
| `singular` | visual | `block.visual.singular` | `...(block.visual)` | `singular: "Espacio"` ✓ |
| `segmentation_rename` | data_architecture | `block.data_architecture.segmentation_rename` | `...(block.data_architecture)` | `segmentation_rename: true` ✓ |
| `group_by_key` | data_architecture | `block.data_architecture.group_by_key` | `...(block.data_architecture)` | `group_by_key: "nombre"` ✓ |
| `save_forms_first` | logic | `block.logic.save_forms_first` | `...(block.logic)` | `save_forms_first: true` ✓ |
| `label` | visual | `block.visual.label` | `...(block.visual)` | `label: "Texto"` ✓ |

### 2. Verificar que `data_list` fue eliminado de collection.settings.json
`grep -r "data_list" src/core/designer/dna/` → debe retornar vacío.

### 3. Verificar el cambio en AgnosticForm.tsx
Buscar `rawVF` en `AgnosticForm.tsx` — debe existir. Buscar `Array.isArray(effectiveVisibleFields)` — debe existir. La variable `effectiveVisibleFields` debe ser de tipo `string[] | undefined`.

### 4. NO tocar estos archivos
- `src/lib/agnostic/Registry.ts` — ya es correcto
- `src/lib/agnostic/init.ts` — ya registra per-bloque correctamente
- `src/components/agnostic/designer/components/RecursiveBlockComposer.tsx` — ya lee `registry.getMetadata`
- `src/components/agnostic/modules/AgnosticConfigProjector.tsx` — ya renderiza dinámicamente
- `src/core/designer/dna/block_settings.schema.json` — es el fallback global, ya actualizado en sesión anterior
- `storage/` — sin cambios de datos
- `scripts/mcp-bridge.ts` — ya actualizado

### 5. Verificar compilación TypeScript
Después de los cambios, ejecutar `npx tsc --noEmit` y confirmar cero errores relacionados con los campos modificados.

---

## Invariante post-implementación

Después de esta sesión, el contrato es:

> **Cuando agregues una nueva prop a cualquier componente de bloque, también debes agregarla al JSON de settings de ese tipo en `src/core/designer/dna/schemas/`. El Designer la expondrá automáticamente sin ningún cambio de código.**

Este es el único punto de mantenimiento requerido. La infraestructura no necesita cambios.
