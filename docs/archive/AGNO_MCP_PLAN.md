# AGNO MCP PLAN — CLI de Interfaz nivel Blender MCP

> **Objetivo**: Una IA sin contexto previo puede crear interfaces complejas, correctamente configuradas, con comandos precisos y autocontenidos. Sin conocimiento implícito del sistema interno.

---

## El problema diagnosticado

`agno.ts` actual opera con bloques como objetos planos `{ id, type, context }`. El sistema evolucionó: los bloques ahora tienen `visual` (settings), `blocks` (hijos anidados), y namespaces auxiliares como `app_navbars`. La IA no puede:

1. **Configurar settings visuales** — no hay sintaxis para `visual.cols=2` al crear un bloque
2. **Componer bloques anidados** — `columns` tiene `blocks: []` internamente pero agno no lo expone
3. **Conocer qué acepta cada tipo** — no hay introspección de block types
4. **Crear estructuras complejas atómicamente** — navbar requiere 3 pasos separados sin documentación del schema

---

## Los 5 axiomas (derivados de Blender MCP)

### Axioma 1 — Precisión > Contexto
Un comando no debe requerir que la IA conozca estructuras internas. El comando encapsula el conocimiento.
```
# ✗ Mal: la IA tiene que saber que nav usa app_navbars con { name, links[], brand }
create-record app_navbars name=main
update-record app_navbars <id> links=[...]     ← no hay sintaxis para esto

# ✓ Bien: el comando sabe la estructura
create-nav main link:Inicio:/:Home link:Productos:/productos:Package brand:MiApp:/
```

### Axioma 2 — Un concepto = Un comando atómico
Crear + configurar en un solo paso. El output es suficiente para el siguiente paso.
```
add-block /inicio navbar visual:nav_id=main
→ [OK] block:a1b2c3d4 type:navbar en /inicio  visual:{nav_id:"main"}
```

### Axioma 3 — Introspección siempre disponible
La IA puede preguntar qué existe y qué acepta antes de escribir.
```
context              → snapshot completo del sistema (orientación en frío)
block-types          → todos los tipos con sus params clave
block-schema navbar  → params detallados de navbar
```

### Axioma 4 — Output mínimo pero encadenable
Cada comando devuelve lo necesario para el siguiente: IDs, estado, siguiente paso sugerido.
```
create-nav main link:Inicio:/
→ [NAV] "main" creado. Siguiente: add-block <ruta> navbar visual:nav_id=main
```

### Axioma 5 — Regla de extensión cero-entropía
Añadir un nuevo block type NO requiere cambiar agno.ts. Solo requiere actualizar `BLOCK_CATALOG` (constante en agno.ts). Es la única fuente de verdad para el CLI.

---

## Modelo de datos de bloque (contrato existente)

Antes de definir comandos, este es el contrato real del sistema:

```typescript
// Un bloque en page_routes se almacena como:
{
  id:      string,          // UUID
  type:    string,          // 'navbar' | 'columns' | 'frame' | 'text' | ...
  context: string | null,   // nombre del schema si el bloque usa datos
  intent:  string?,         // 'list' | 'create' | 'edit' (para form/collection)
  zap:     string?,         // nombre del script para action blocks

  // VISUAL SETTINGS — van bajo visual.{}
  visual: {
    // Depende del tipo. Definido en settings_schema de cada tipo.
    // Ejemplos:
    cols?: number,          // columns
    gap?:  number,          // columns
    content?: string,       // text
    variant?: string,       // text: 'h1'|'h2'|'body'|...
    src?:    string,        // image
    fit?:    string,        // image: 'cover'|'contain'
    direction?: string,     // frame: 'vertical'|'horizontal'
    nav_id?: string,        // navbar (excepción: está en visual también)
    ...
  },

  // CHILD BLOCKS — solo en contenedores (columns, tabs, etc.)
  blocks: Block[]           // hijos anidados, renderizados recursivamente
}
```

**Nota sobre navbar**: Los props `nav_id`, `links`, `brand` se pasan directamente al componente. En el contrato agno los trataremos bajo `visual` para consistencia de escritura.

---

## Taxonomía de comandos — 4 capas

```
CAPA 0: INTROSPECCIÓN    → context, block-types, block-schema, namespaces
CAPA 1: LECTURA          → ls, schema, route, ui, records (ya OK, sin cambios)
CAPA 2: CRUD EXTENDIDO   → add-block+visual, set-visual, get-block, add-child
CAPA 3: SEMÁNTICOS       → create-nav, create-columns, create-page, scaffold
```

La IA siempre empieza en Capa 0 (orientación), luego opera en Capa 2-3.

---

## Especificación completa de comandos nuevos

---

### CAPA 0: INTROSPECCIÓN

---

#### `context`
**Propósito**: Snapshot completo del sistema. Comando de orientación en frío.

```
agno> context

[CONTEXT] 2026-05-24
routes(3):  /inicio(4b)  /productos(2b)  /cotizaciones(3b)
schemas(4): clientes(5f) productos(3f) cotizaciones(7f) lineas_cotizacion(4f)
navs(1):    main → 3 links
scripts(2): exportar_pdf  enviar_correo

block-types disponibles (usa block-types para ver params):
  layout:  navbar columns frame tabs embed nav
  data:    form collection table action
  content: text hero image markdown faq divider spacer field
```

**Implementación**: Una sola función que llama en paralelo a schemas, routes, scripts, y `adapter.read('app_navbars')`, formatea en 8-10 líneas fijas.

---

#### `block-types`
**Propósito**: Lista todos los tipos con sus params clave. La IA sabe qué puede configurar.

```
agno> block-types

[BLOCK_TYPES] 16 tipos registrados

── LAYOUT ──────────────────────────────────────────────────
navbar     visual:[nav_id] | visual:[links brand]  Navbar sticky con links
columns    visual:[cols gap]                        Grid de N columnas
frame      visual:[direction sizing padding_* fill_* border_radius]
tabs       visual:[items]                           Pestañas navegables
nav        context:<schema> visual:[label_field path_field icon_field]
embed      visual:[route]                           Embebe otra ruta

── DATA ─────────────────────────────────────────────────────
form       context:<schema> visual:[intent hideSubmit]
collection context:<schema> visual:[view limit]     view: grid|table|kanban
table      context:<schema> visual:[limit]
action     context:<schema> visual:[zap label]

── CONTENT ──────────────────────────────────────────────────
text       visual:[content variant align]           variant: h1|h2|h3|body|caption
hero       visual:[title subtitle cta_label cta_path background]
image      visual:[src alt fit aspect rounded]      fit: cover|contain
markdown   visual:[content]
faq        visual:[items]
divider    —
spacer     visual:[size]
field      context:<schema> visual:[field_key]
```

**Implementación**: Lee `BLOCK_CATALOG` (constante embebida en agno.ts). No necesita I/O.

---

#### `block-schema <type>`
**Propósito**: Params detallados de un tipo específico. Equivalente a "qué props acepta este objeto en Blender".

```
agno> block-schema text

[BLOCK_SCHEMA] text

visual.content   string     El texto a mostrar
visual.variant   select     h1|h2|h3|body|caption|label|quote   default:body
visual.align     select     left|center|right                   default:left

contexto: text no usa context (no es data-driven)
hijos: text no tiene blocks[]

Ejemplo:
  add-block /inicio text visual:content="Bienvenido" visual:variant=h1 visual:align=center
```

**Implementación**: Lee `BLOCK_CATALOG[type].params` + genera ejemplo automáticamente.

---

#### `block-schema columns`
```
agno> block-schema columns

[BLOCK_SCHEMA] columns

visual.cols   number   1-4   Número de columnas   default:2
visual.gap    number   1-16  Separación (×0.25rem) default:6

hijos: columns acepta blocks[] — usa add-child para añadir bloques hijos

Ejemplos:
  add-block /inicio columns visual:cols=2 visual:gap=8
  add-child /inicio <blockId> text visual:content="Columna izquierda"
  add-child /inicio <blockId> image visual:src=/api/assets/foto.jpg visual:fit=cover
```

---

#### `block-schema navbar`
```
agno> block-schema navbar

[BLOCK_SCHEMA] navbar

MODO A — nav_id (recomendado, reutilizable):
  visual.nav_id   string   Nombre del registro en app_navbars
  → Crea primero: create-nav <nombre> [link:...] [brand:...]
  → Luego: add-block <ruta> navbar visual:nav_id=<nombre>

MODO B — links inline (rápido, no reutilizable):
  visual.links    [{label, path, icon?}]   Links de navegación
  visual.brand    {label, path}            Logo/nombre con link

Rutas disponibles (usa ls para ver):
  → usa las rutas registradas en page_routes

Iconos: cualquier nombre de lucide-react (Home, Package, Users, Settings...)

Ejemplo completo:
  create-nav main link:Inicio:/:Home link:Productos:/productos:Package brand:MiApp:/
  add-block /inicio navbar visual:nav_id=main
```

---

### CAPA 2: CRUD EXTENDIDO

---

#### `add-block` — extendido con `visual:` y `block:`

**Sintaxis actual**: `add-block <route> <type> [schema:<name>] [intent:<i>] [zap:<z>]`

**Sintaxis nueva**: `add-block <route> <type> [context:<schema>] [intent:<i>] [zap:<z>] [visual:key=val ...]`

```
agno> add-block /inicio text visual:content="Hola mundo" visual:variant=h1

[OK] block:a1b2c3d4 type:text en /inicio
     visual: {content:"Hola mundo", variant:"h1"}
```

```
agno> add-block /inicio columns visual:cols=2 visual:gap=8

[OK] block:e5f6a7b8 type:columns en /inicio
     visual: {cols:2, gap:8}
     → usa add-child /inicio e5f6a7b8 <type> [...] para añadir hijos
```

```
agno> add-block /inicio form context:cotizaciones intent:create

[OK] block:c9d0e1f2 type:form en /inicio
     context: cotizaciones  intent: create
```

**Cambio en implementación**: `add-block` parsea args con prefijo `visual:` y los agrupa en `block.visual`. El resto de la lógica no cambia.

---

#### `set-visual <route> <blockId> <key> <value>`
**Propósito**: Setear/actualizar un param visual en un bloque existente.

```
agno> set-visual /inicio a1b2c3d4 content "Texto actualizado"

[OK] block:a1b2c3d4 visual.content → "Texto actualizado"
```

```
agno> set-visual /inicio e5f6a7b8 cols 3

[OK] block:e5f6a7b8 visual.cols → 3
```

**Implementación**: Lee la ruta, encuentra el bloque por ID prefix, hace `block.visual[key] = value`, guarda.

---

#### `get-block <route> <blockId>`
**Propósito**: Devuelve el estado completo de un bloque. Para que la IA pueda verificar antes de modificar.

```
agno> get-block /inicio e5f6a7b8

[BLOCK] e5f6a7b8 type:columns  ruta:/inicio
  visual:  cols:2  gap:8
  blocks:  [a1b2c3d4:text  f3g4h5i6:image]
  context: —  intent: —  zap: —
```

---

#### `add-child <route> <parentBlockId> <type> [visual:key=val ...]`
**Propósito**: Añade un bloque hijo dentro de un contenedor (columns, tabs, frame). Esta es la operación de composición que falta.

```
agno> add-child /inicio e5f6a7b8 text visual:content="Columna 1" visual:variant=body

[OK] child:a1b2c3d4 type:text → parent:e5f6a7b8 (columns)
     visual: {content:"Columna 1", variant:"body"}
     parent ahora tiene 1 hijo(s)
```

```
agno> add-child /inicio e5f6a7b8 image visual:src=/api/assets/foto.jpg visual:fit=cover visual:aspect=square

[OK] child:f3g4h5i6 type:image → parent:e5f6a7b8 (columns)
     visual: {src:"/api/assets/foto.jpg", fit:"cover", aspect:"square"}
     parent ahora tiene 2 hijo(s)
```

**Implementación**: Encuentra el bloque padre, hace push a `block.blocks[]` con el nuevo bloque hijo construido con `visual:` args.

---

#### `remove-child <route> <parentBlockId> <childBlockId>`

```
agno> remove-child /inicio e5f6a7b8 a1b2c3d4

[OK] child:a1b2c3d4 eliminado de parent:e5f6a7b8. Hijos restantes: 1
```

---

#### `list-children <route> <blockId>`

```
agno> list-children /inicio e5f6a7b8

[CHILDREN] parent:e5f6a7b8 (columns) → 2 hijo(s)
  a1b2c3d4  text   visual:{content:"Columna 1", variant:"body"}
  f3g4h5i6  image  visual:{src:"/api/assets/foto.jpg", fit:"cover"}
```

---

### CAPA 3: COMANDOS SEMÁNTICOS

Estos son los comandos "Blender-style": un concepto → un comando atómico complejo.

---

#### `create-nav <name> [link:label:path:icon ...] [brand:label:path]`
**Propósito**: Crea un registro en `app_navbars` con estructura validada. La IA no necesita conocer el schema de `app_navbars`.

```
agno> create-nav main link:Inicio:/:Home link:Productos:/productos:Package link:Clientes:/clientes:Users brand:MiApp:/

[NAV] "main" creado en app_navbars
  brand: MiApp → /
  links: Inicio(/)  Productos(/productos)  Clientes(/clientes)

Siguiente paso:
  add-block <ruta> navbar visual:nav_id=main
```

```
agno> create-nav sidebar link:Dashboard:/admin:LayoutDashboard link:Config:/admin/config:Settings

[NAV] "sidebar" creado en app_navbars
  links: Dashboard(/admin)  Config(/admin/config)
```

**Variante destructiva** (actualizar nav existente):
```
agno> create-nav main --update link:Inicio:/:Home link:Nuevo:/nuevo:Plus

[NAV] "main" actualizado (era 3 links, ahora 2)
```

**Implementación**: Parsea args `link:label:path:icon` en un array. Parsea `brand:label:path`. Crea/actualiza record en `app_navbars` con estructura `{ name, links: [...], brand: {...} }`.

---

#### `list-navs`
**Propósito**: Lista los navs disponibles para usar con `nav_id`.

```
agno> list-navs

[NAVS] 2 configuraciones en app_navbars
  main     → brand:MiApp  3 links: Inicio Productos Clientes
  sidebar  → sin brand    2 links: Dashboard Config
```

---

#### `create-columns <route> [cols=N] [gap=N] [commit]`
**Propósito**: Crea un bloque `columns` configurado, listo para recibir hijos.

```
agno> create-columns /inicio cols=2 gap=8

[COLUMNAS] block:e5f6a7b8 creado en /inicio
  cols:2  gap:8 (2rem entre columnas)

Siguiente paso:
  add-child /inicio e5f6a7b8 <type> [visual:...]
  Sugerencia: add-child /inicio e5f6a7b8 text visual:content="..." visual:variant=body
```

---

#### `create-page <path> <title> [template:blank|landing|data-schema]`
**Propósito**: Crea una ruta con estructura inicial. Equivalente a "New Scene" en Blender.

```
agno> create-page /productos "Catálogo de Productos" template:blank

[PAGE] ruta "/productos" creada  título:"Catálogo de Productos"
  template: blank (sin bloques)
  Siguiente: add-block /productos <type> [...]
```

```
agno> create-page /clientes "Clientes" template:data-clientes

[PAGE] ruta "/clientes" creada
  → añadido: navbar visual:nav_id=main  (si existe)
  → añadido: collection context:clientes visual:view=table
  → añadido: action context:clientes visual:zap=— visual:label="Nuevo cliente"
  Siguiente: configura el action con un zap o deja el form inline
```

**Implementación**: Templates son maps predefinidos de bloques con settings. `data-<schema>` usa el nombre del schema para configurar context automáticamente.

---

#### `scaffold <schema> [route:<path>]`
**Propósito**: Genera una ruta CRUD completa para un schema: lista + formulario + acción. El comando más alto nivel.

```
agno> scaffold cotizaciones route:/cotizaciones

[SCAFFOLD] construyendo ruta /cotizaciones para schema:cotizaciones

  ✓ create-route /cotizaciones "Cotizaciones"
  ✓ add-block /cotizaciones collection context:cotizaciones visual:view=table visual:limit=20
  ✓ add-block /cotizaciones action context:cotizaciones visual:label="Nueva cotización"

[OK] /cotizaciones lista. 3 bloques configurados.
Revisa con: ui /cotizaciones
```

---

## La regla de extensión — cero entropía

### El problema que resuelve

Cuando se añade un nuevo block type (e.g. `calendar`, `kanban`, `chart`), la IA necesita saber qué params acepta. Sin un catálogo, agno.ts se desactualiza silenciosamente.

### La solución: `BLOCK_CATALOG` como única fuente de verdad del CLI

```typescript
// agno.ts — constante embebida, actualizada junto con init.ts

const BLOCK_CATALOG: Record<string, {
  category:    'layout' | 'data' | 'content';
  description: string;
  hasChildren: boolean;       // si acepta blocks[]
  needsContext: boolean;      // si requiere un schema
  params: Array<{
    key:      string;
    type:     'string' | 'number' | 'boolean' | 'select' | 'array';
    options?: string[];
    default?: any;
    desc:     string;
  }>;
  example: string;            // ejemplo de add-block listo para copiar
}> = {

  navbar: {
    category: 'layout',
    description: 'Barra de navegación sticky con links y brand',
    hasChildren: false,
    needsContext: false,
    params: [
      { key: 'nav_id',  type: 'string',  desc: 'Nombre del registro en app_navbars' },
      { key: 'links',   type: 'array',   desc: 'Links inline (alternativa a nav_id)' },
      { key: 'brand',   type: 'string',  desc: 'Label del brand (con brand_path)' },
    ],
    example: 'add-block <ruta> navbar visual:nav_id=main',
  },

  columns: {
    category: 'layout',
    description: 'Grid de N columnas. Acepta bloques hijos.',
    hasChildren: true,
    needsContext: false,
    params: [
      { key: 'cols', type: 'number', default: 2, desc: '1-4 columnas' },
      { key: 'gap',  type: 'number', default: 6, desc: 'Separación × 0.25rem' },
    ],
    example: 'add-block <ruta> columns visual:cols=2 visual:gap=8',
  },

  text: {
    category: 'content',
    description: 'Bloque de texto con variante tipográfica',
    hasChildren: false,
    needsContext: false,
    params: [
      { key: 'content', type: 'string',  desc: 'El texto a mostrar' },
      { key: 'variant', type: 'select',  options: ['h1','h2','h3','body','caption','label','quote'], default: 'body', desc: 'Variante tipográfica' },
      { key: 'align',   type: 'select',  options: ['left','center','right'], default: 'left', desc: 'Alineación' },
    ],
    example: 'add-block <ruta> text visual:content="Hola" visual:variant=h1',
  },

  image: {
    category: 'content',
    description: 'Imagen con control de aspecto y ajuste',
    hasChildren: false,
    needsContext: false,
    params: [
      { key: 'src',    type: 'string',  desc: 'URL o path de la imagen' },
      { key: 'alt',    type: 'string',  desc: 'Texto alternativo' },
      { key: 'fit',    type: 'select',  options: ['cover','contain'], default: 'cover', desc: 'Ajuste' },
      { key: 'aspect', type: 'select',  options: ['video','square','portrait','auto'], default: 'video', desc: 'Relación de aspecto' },
    ],
    example: 'add-block <ruta> image visual:src=/api/assets/foto.jpg visual:fit=cover',
  },

  form: {
    category: 'data',
    description: 'Formulario agnostic vinculado a un schema',
    hasChildren: false,
    needsContext: true,
    params: [
      { key: 'intent', type: 'select', options: ['create','edit'], default: 'create', desc: 'Intención del formulario' },
    ],
    example: 'add-block <ruta> form context:clientes intent:create',
  },

  collection: {
    category: 'data',
    description: 'Lista/tabla/grid de registros de un schema',
    hasChildren: false,
    needsContext: true,
    params: [
      { key: 'view',  type: 'select', options: ['table','grid','kanban'], default: 'table', desc: 'Modo de visualización' },
      { key: 'limit', type: 'number', default: 20, desc: 'Registros por página' },
    ],
    example: 'add-block <ruta> collection context:productos visual:view=grid',
  },

  // ... resto de tipos siguiendo el mismo patrón
};
```

### Protocolo de actualización

Cuando se añade un nuevo block type:

1. Se registra en `init.ts` con `settings_schema` JSON correspondiente
2. Se añade entrada en `BLOCK_CATALOG` en `agno.ts`
3. `block-types` y `block-schema <type>` automáticamente lo muestran
4. `scaffold` puede usarlo si se añade al template correspondiente

**No hay paso 4, 5, 6.** Dos archivos, ambos triviales de editar.

---

## Equivalencia Blender MCP ↔ agno

| Blender MCP | agno MCP | Descripción |
|-------------|----------|-------------|
| `LIST_OBJECT_TYPES` | `block-types` | Qué se puede crear |
| `GET_OBJECT_PARAMS type=mesh` | `block-schema frame` | Qué acepta un tipo |
| `GET_SCENE_STATE` | `context` | Snapshot del sistema |
| `CREATE_OBJECT type=cube scale=[2,1,1]` | `add-block /ruta frame visual:sizing=fill visual:direction=vertical` | Crear + configurar atómico |
| `ADD_MODIFIER object=X type=SUBSURF levels=3` | `set-visual /ruta blockId cols 3` | Modificar prop existente |
| `CREATE_COLLECTION children=[A,B,C]` | `create-columns /ruta` + `add-child ...` | Contenedor con hijos |
| `APPLY_MATERIAL object=X material=Glass` | `set-visual /ruta blockId fill_color "hsl(var(--primary))"` | Aplicar estilo |
| Sin equivalente directo | `create-nav` | Comando semántico de alto nivel |
| Sin equivalente directo | `scaffold clientes` | Template completo |

---

## Plan de implementación — 4 fases

### Fase 1 — Introspección (½ día)
**Archivos**: solo `agno.ts`

- [ ] Añadir `BLOCK_CATALOG` como constante con los 16 tipos actuales
- [ ] Implementar `context` — paralelo: schemas + routes + scripts + `adapter.read('app_navbars')`
- [ ] Implementar `block-types` — lee `BLOCK_CATALOG`, formatea por categoría
- [ ] Implementar `block-schema <type>` — detalle + ejemplo generado
- [ ] Implementar `list-navs` — lee `app_navbars`

**Resultado**: La IA puede orientarse en frío y saber qué params acepta cada tipo.

---

### Fase 2 — Bloque extendido + composición (½ día)
**Archivos**: solo `agno.ts`

- [ ] Extender `add-block` — parsear `visual:key=val`, guardar en `block.visual`
- [ ] Implementar `set-visual <route> <blockId> <key> <value>`
- [ ] Implementar `get-block <route> <blockId>` — devuelve bloque completo
- [ ] Implementar `add-child <route> <parentId> <type> [visual:...]` — push a `block.blocks[]`
- [ ] Implementar `remove-child <route> <parentId> <childId>`
- [ ] Implementar `list-children <route> <blockId>`

**Resultado**: La IA puede crear la sección dos columnas completa.

---

### Fase 3 — Comandos semánticos (½ día)
**Archivos**: solo `agno.ts`

- [ ] Implementar `create-nav <name> [link:label:path:icon ...] [brand:label:path]`
- [ ] Implementar `create-columns <route> [cols=N] [gap=N]`
- [ ] Implementar `create-page <path> <title> [template:...]`
- [ ] Implementar `scaffold <schema> [route:<path>]`

**Resultado**: La IA puede crear interfaces completas con 2-3 comandos.

---

### Fase 4 — Validación y pulido (¼ día)
**Archivos**: `agno.ts`

- [ ] Extender `validate` para verificar que `block.visual` contiene solo keys conocidas del BLOCK_CATALOG
- [ ] Añadir `--dry` flag a `add-block`, `add-child` — muestra qué escribiría sin escribir
- [ ] Añadir sugerencias contextuales: cuando `block-types` lista un tipo con `hasChildren:true`, mostrar hint de `add-child`
- [ ] Actualizar `help` para reflejar toda la nueva taxonomía

---

## Sesión de ejemplo completa — después de implementar

```
agno> context
[CONTEXT] routes(2) schemas(4) navs(0) scripts(2)

agno> create-nav main link:Inicio:/:Home link:Productos:/productos:Package brand:MiShop:/
[NAV] "main" creado. Siguiente: add-block <ruta> navbar visual:nav_id=main

agno> add-block /inicio navbar visual:nav_id=main
[OK] block:nav001 type:navbar en /inicio  visual:{nav_id:"main"}

agno> add-block /inicio columns visual:cols=2 visual:gap=8
[OK] block:col001 type:columns en /inicio  → usa add-child col001 para añadir hijos

agno> add-child /inicio col001 frame visual:direction=vertical visual:padding_top=4 visual:padding_right=6
[OK] child:frm001 → parent:col001. visual:{direction:"vertical", padding_top:4, padding_right:6}

agno> add-child /inicio col001 frame visual:fill_src=/api/assets/hero.jpg visual:fill_fit=cover
[OK] child:frm002 → parent:col001. visual:{fill_src:"/api/assets/hero.jpg", fill_fit:"cover"}

agno> add-child /inicio frm001 text visual:content="Bienvenido a MiShop" visual:variant=h1
[OK] child:txt001 → parent:frm001

agno> ui /inicio
[UI] /inicio  4 bloques raíz
  nav001  navbar      → visual:{nav_id:"main"}
  col001  columns     → visual:{cols:2, gap:8}
    frm001  frame     → visual:{direction:"vertical", padding_top:4, ...}
      txt001  text    → visual:{content:"Bienvenido...", variant:"h1"}
    frm002  frame     → visual:{fill_src:"/api/assets/hero.jpg", ...}
```

**8 comandos. Sin conocimiento previo del sistema interno. Interfaz completa.**

---

## Invariante que nunca debe romperse

> `BLOCK_CATALOG` en agno.ts es el espejo del `Registry.ts` en el engine. Si un tipo está registrado en el engine pero no en `BLOCK_CATALOG`, la IA no puede usarlo. Si está en `BLOCK_CATALOG` pero no en el engine, `validate` lo detecta.

Esta tensión es intencional. Es el mecanismo de extensión: añadir un tipo requiere actualizar ambos archivos. No tres, no uno — dos. Siempre.
