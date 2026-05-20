# ROADMAP — Content Blocks (Bloques de Contenido Estático)
**Ejecutor:** Gemini  
**Supervisor:** Claude  
**Estado:** Pendiente — ejecutar DESPUÉS de `ROADMAP_UI_BLOCKS.md`  
**Rama:** `v2-sovereign-rebirth`

---

## ⚠️ CORRECCIONES OBLIGATORIAS PARA `ROADMAP_UI_BLOCKS.md` ANTES DE EJECUTARLO

Gemini debe aplicar estas correcciones PRIMERO. Son errores en el roadmap anterior que causarían bugs silenciosos.

### Corrección 1 — Archivo de registros (CRÍTICO)

El roadmap anterior indica:
```
// src/lib/agnostic/Registry.ts — añadir estas líneas
```

**INCORRECTO.** `Registry.ts` solo define la clase. Los `registry.register(...)` van en:
```
src/lib/agnostic/init.ts
```

Verificar `init.ts` antes de ejecutar. Todas las líneas `registry.register(...)` de `ROADMAP_UI_BLOCKS.md` van ahí, con sus imports.

### Corrección 2 — Agregar `settings_schema` en cada `registry.register()` (CRÍTICO)

El sistema expone configuración en el Designer automáticamente si el bloque tiene `settings_schema`. Sin él, el bloque existe en el sistema pero NO aparece en el Designer con controles. Cada `registry.register` debe tener su schema.

Los schemas van en `src/core/designer/dna/schemas/` como archivos JSON independientes, igual que `form.settings.json`, `collection.settings.json` y `action.settings.json`.

El patrón correcto en `init.ts`:
```typescript
import navbarSettingsSchema    from '@/core/designer/dna/schemas/navbar.settings.json';
import tabsSettingsSchema      from '@/core/designer/dna/schemas/tabs.settings.json';
import textSettingsSchema      from '@/core/designer/dna/schemas/text.settings.json';
import heroSettingsSchema      from '@/core/designer/dna/schemas/hero.settings.json';
import columnsSettingsSchema   from '@/core/designer/dna/schemas/columns.settings.json';
import dividerSettingsSchema   from '@/core/designer/dna/schemas/divider.settings.json';
import cardStaticSettingsSchema from '@/core/designer/dna/schemas/card_static.settings.json';

registry.register('navbar',      AgnosticNavbar,     { category: 'layout',  name: 'Navbar',          settings_schema: navbarSettingsSchema });
registry.register('tabs',        AgnosticTabs,       { category: 'layout',  name: 'Pestañas',        settings_schema: tabsSettingsSchema });
registry.register('text',        AgnosticText,       { category: 'content', name: 'Texto',           settings_schema: textSettingsSchema });
registry.register('hero',        AgnosticHero,       { category: 'content', name: 'Hero',            settings_schema: heroSettingsSchema });
registry.register('columns',     AgnosticColumns,    { category: 'layout',  name: 'Columnas',        settings_schema: columnsSettingsSchema });
registry.register('divider',     AgnosticDivider,    { category: 'layout',  name: 'Divisor',         settings_schema: dividerSettingsSchema });
registry.register('card_static', AgnosticCardStatic, { category: 'content', name: 'Tarjeta Estática', settings_schema: cardStaticSettingsSchema });
```

### Corrección 3 — Settings schemas para bloques de ROADMAP_UI_BLOCKS.md

Crear estos archivos en `src/core/designer/dna/schemas/`:

**`navbar.settings.json`**
```json
{
  "id": "navbar_settings_def",
  "name": "navbar_settings",
  "fields": [
    {
      "key": "visual",
      "label": "Datos del Navbar",
      "icon": "Layout",
      "type": "section",
      "fields": [
        {
          "key": "nav_id",
          "label": "ID de Configuración (nav_id)",
          "type": "string",
          "description": "Nombre del registro en el namespace app_navbars. Si está vacío, usa links inline del bloque."
        }
      ]
    }
  ]
}
```

**`tabs.settings.json`**
```json
{
  "id": "tabs_settings_def",
  "name": "tabs_settings",
  "fields": [
    {
      "key": "behavior",
      "label": "Comportamiento",
      "icon": "Activity",
      "type": "section",
      "fields": [
        {
          "key": "default_tab",
          "label": "Pestaña Activa por Defecto",
          "type": "string",
          "description": "ID o tab_label de la pestaña que abre por defecto. Si se omite, usa la primera."
        }
      ]
    }
  ]
}
```

**`text.settings.json`**
```json
{
  "id": "text_settings_def",
  "name": "text_settings",
  "fields": [
    {
      "key": "visual",
      "label": "Contenido y Estilo",
      "icon": "Palette",
      "type": "section",
      "fields": [
        {
          "key": "content",
          "label": "Texto",
          "type": "string",
          "description": "El texto a mostrar."
        },
        {
          "key": "variant",
          "label": "Variante Tipográfica",
          "type": "select",
          "options": [
            { "label": "H1 — Título Principal",   "value": "h1" },
            { "label": "H2 — Sección",            "value": "h2" },
            { "label": "H3 — Subsección",         "value": "h3" },
            { "label": "Cuerpo",                  "value": "body" },
            { "label": "Caption (pequeño)",       "value": "caption" },
            { "label": "Label",                   "value": "label" },
            { "label": "Cita / Quote",            "value": "quote" }
          ],
          "default": "body"
        },
        {
          "key": "align",
          "label": "Alineación",
          "type": "select",
          "options": [
            { "label": "Izquierda", "value": "left" },
            { "label": "Centro",   "value": "center" },
            { "label": "Derecha",  "value": "right" }
          ],
          "default": "left"
        }
      ]
    }
  ]
}
```

**`hero.settings.json`**
```json
{
  "id": "hero_settings_def",
  "name": "hero_settings",
  "fields": [
    {
      "key": "visual",
      "label": "Contenido del Hero",
      "icon": "Palette",
      "type": "section",
      "fields": [
        { "key": "title",    "label": "Título Principal",  "type": "string" },
        { "key": "subtitle", "label": "Subtítulo",         "type": "string" },
        { "key": "align",    "label": "Alineación",        "type": "select",
          "options": [
            { "label": "Centro", "value": "center" },
            { "label": "Izquierda", "value": "left" }
          ]
        }
      ]
    }
  ]
}
```

**`columns.settings.json`**
```json
{
  "id": "columns_settings_def",
  "name": "columns_settings",
  "fields": [
    {
      "key": "visual",
      "label": "Configuración de Columnas",
      "icon": "Layout",
      "type": "section",
      "fields": [
        {
          "key": "cols",
          "label": "Número de Columnas",
          "type": "select",
          "options": [
            { "label": "1 columna",  "value": "1" },
            { "label": "2 columnas", "value": "2" },
            { "label": "3 columnas", "value": "3" },
            { "label": "4 columnas", "value": "4" }
          ],
          "default": "2"
        },
        {
          "key": "gap",
          "label": "Separación (unidades Tailwind)",
          "type": "string",
          "description": "Número 1-16. Ejemplo: 6 = 1.5rem de separación.",
          "default": "6"
        }
      ]
    }
  ]
}
```

**`divider.settings.json`**
```json
{
  "id": "divider_settings_def",
  "name": "divider_settings",
  "fields": [
    {
      "key": "visual",
      "label": "Estilo del Divisor",
      "icon": "Palette",
      "type": "section",
      "fields": [
        {
          "key": "variant",
          "label": "Variante",
          "type": "select",
          "options": [
            { "label": "Línea horizontal", "value": "line" },
            { "label": "Espacio vacío",    "value": "space" },
            { "label": "Tres puntos",      "value": "dots" }
          ],
          "default": "line"
        },
        {
          "key": "spacing",
          "label": "Espaciado (unidades Tailwind)",
          "type": "string",
          "description": "Solo aplica para variante 'space'. Ejemplo: 4 = 1rem.",
          "default": "4"
        }
      ]
    }
  ]
}
```

**`card_static.settings.json`**
```json
{
  "id": "card_static_settings_def",
  "name": "card_static_settings",
  "fields": [
    {
      "key": "visual",
      "label": "Contenido de la Tarjeta",
      "icon": "Palette",
      "type": "section",
      "fields": [
        { "key": "icon",    "label": "Icono (Lucide)", "type": "string",
          "description": "Nombre del icono. Ejemplo: Package, Star, Shield." },
        { "key": "title",   "label": "Título",         "type": "string" },
        { "key": "body",    "label": "Descripción",    "type": "string" },
        {
          "key": "variant",
          "label": "Estilo de Tarjeta",
          "type": "select",
          "options": [
            { "label": "Borde visible", "value": "bordered" },
            { "label": "Sin borde",     "value": "ghost" }
          ],
          "default": "bordered"
        }
      ]
    }
  ]
}
```

---

## Cambio previo requerido — `AgnosticConfigProjector.tsx`

**Archivo:** `src/components/agnostic/modules/AgnosticConfigProjector.tsx`

El proyector actualmente renderiza campos `string` como `<Input>`. Para los bloques de contenido (markdown, descripciones largas) se necesita `textarea`. 

**Agregar el case `textarea` en el `switch(field.type)` ANTES del `default`:**

Buscar el bloque que empieza con `case 'select':` y después del bloque `default:` agregar o insertar antes del default:

```typescript
case 'textarea':
  return (
    <div className="space-y-1">
      {label}
      <textarea
        value={value || ''}
        onChange={(e) => updateValue(e.target.value)}
        placeholder={field.description || field.label}
        rows={field.rows || 4}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
      />
      {field.description && <p className="text-[8px] text-muted-foreground/30 pl-1">{field.description}</p>}
    </div>
  );
```

**Nota:** No usar el componente `Textarea` de Shadcn UI aquí — se importa en otro lugar. Usar el elemento HTML nativo `<textarea>` con las mismas clases de `cn()` que usa Shadcn para evitar un import circular. Las clases son idénticas.

---

## Filosofía de los Content Blocks

Los bloques de contenido son una **categoría distinta** de los bloques de datos. Conviven en la misma ruta, el mismo Designer, el mismo MCP — pero no tienen `schema_id` ni `context`. Su contenido vive directamente en `page_routes.json` dentro del bloque.

```
BLOQUE DE DATOS (form, collection, table, action)
  → schema_id: requerido
  → context: requerido  
  → Datos: viven en storage/{tenant}/db/*.json
  → El invariante context === schema.data.name aplica

BLOQUE DE CONTENIDO (todos los de este roadmap)
  → schema_id: ausente
  → context: ausente
  → Datos: viven en el propio bloque en page_routes.json
  → El invariante NO aplica — son átomos de tipo distinto
```

**El invariante de agnosticity se mantiene:** ningún componente de content block sabe qué es una "cotización" o un "cliente". Recibe props como `title`, `content`, `variant` — igual de ciegos que los bloques de datos.

**Pipeline namespace → prop para content blocks:**
```
block.visual.title = "Artesanía Premium"
  → renderer: ...(block.visual || {}) → title = "Artesanía Premium" prop
  → componente: AgnosticHero({ title }) ✓

block.visual.content = "# Hello\n\nWorld"  
  → renderer: ...(block.visual || {}) → content = "# Hello..." prop
  → componente: AgnosticMarkdown({ content }) ✓
```

Todos los campos configurables de content blocks van en la sección `visual` del settings schema. Esto es correcto — "visual" en el contexto del Designer es la capa de presentación, y el contenido estático es puramente presentacional.

---

## Bloque 8 — `markdown`

### Propósito
Renderiza contenido markdown como HTML. Es el bloque más poderoso para páginas informativas — permite headings, listas, negritas, código inline, links, todo sin HTML hardcodeado.

### Contrato JSON del bloque
```json
{
  "id": "block_intro",
  "type": "markdown",
  "visual": {
    "content": "## Nuestra Filosofía\n\nEn **Veta de Oro** creemos que...",
    "prose": true,
    "align": "left"
  }
}
```

### Componente
**Archivo:** `src/components/agnostic/blocks/AgnosticMarkdown.tsx`

```typescript
'use client';
import { cn } from '@/lib/utils';

interface Props {
  visual?: { content?: string; prose?: boolean; align?: string };
  content?: string;
  prose?: boolean;
}

// Minimal markdown → HTML without external dependency (safe for v1).
// Supports: # headings, **bold**, *italic*, `code`, [link](url), - lists, blank line paragraphs.
function renderMarkdown(raw: string): string {
  return raw
    .replace(/^#{3}\s+(.+)$/gm, '<h3 class="text-lg font-bold mt-6 mb-2">$1</h3>')
    .replace(/^#{2}\s+(.+)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/^#{1}\s+(.+)$/gm, '<h1 class="text-4xl font-black mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g,  '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,      '<em>$1</em>')
    .replace(/`(.+?)`/g,        '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline underline-offset-2 hover:opacity-80">$1</a>')
    .replace(/^-\s+(.+)$/gm,    '<li class="ml-4 list-disc">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, (m) => `<ul class="space-y-1 my-3">${m}</ul>`)
    .replace(/\n\n(.+)/g,       '\n\n<p class="leading-relaxed text-muted-foreground my-3">$1</p>');
}

export function AgnosticMarkdown({ visual, content: propContent, prose: propProse }: Props) {
  const raw     = propContent  ?? visual?.content  ?? '';
  const prose   = propProse    ?? visual?.prose     ?? true;
  const align   = visual?.align ?? 'left';

  return (
    <div
      className={cn(
        "w-full",
        prose && "prose prose-neutral dark:prose-invert max-w-none",
        align === 'center' && 'text-center mx-auto',
        align === 'right'  && 'text-right'
      )}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(raw) }}
    />
  );
}
```

**Nota de seguridad:** `dangerouslySetInnerHTML` es seguro aquí porque el contenido viene del propio JSON de rutas del tenant (no de input de usuario anónimo). El operador del sistema es quien edita `page_routes.json` o usa el Designer con autenticación.

**Nota de upgrade:** Si en el futuro se necesita soporte completo de markdown (tablas, footnotes, etc.), instalar `react-markdown` y reemplazar `renderMarkdown` por `<ReactMarkdown>`. La interfaz del componente no cambia.

### Settings schema
**Archivo:** `src/core/designer/dna/schemas/markdown.settings.json`
```json
{
  "id": "markdown_settings_def",
  "name": "markdown_settings",
  "fields": [
    {
      "key": "visual",
      "label": "Contenido",
      "icon": "Palette",
      "type": "section",
      "fields": [
        {
          "key": "content",
          "label": "Texto Markdown",
          "type": "textarea",
          "rows": 8,
          "description": "Soporta: # Heading, **negrita**, *cursiva*, `código`, [link](url), - listas. Doble salto de línea = nuevo párrafo."
        },
        {
          "key": "prose",
          "label": "Modo Prosa (Tipografía Premium)",
          "type": "boolean",
          "description": "Aplica la clase Tailwind 'prose' para tipografía editorial. Recomendado: activo para artículos, desactivado para listas técnicas."
        },
        {
          "key": "align",
          "label": "Alineación",
          "type": "select",
          "options": [
            { "label": "Izquierda", "value": "left" },
            { "label": "Centro",   "value": "center" },
            { "label": "Derecha",  "value": "right" }
          ],
          "default": "left"
        }
      ]
    }
  ]
}
```

### Registro en `init.ts`
```typescript
import markdownSettingsSchema from '@/core/designer/dna/schemas/markdown.settings.json';
registry.register('markdown', AgnosticMarkdown, { category: 'content', name: 'Markdown', settings_schema: markdownSettingsSchema });
```

---

## Bloque 9 — `image`

### Propósito
Imagen con caption opcional. Soporta URLs externas y assets subidos al sistema.

### Contrato JSON
```json
{
  "type": "image",
  "visual": {
    "src": "https://...",
    "alt": "Mobiliario en roble natural",
    "caption": "Proyecto residencial - Bogotá 2025",
    "fit": "cover",
    "aspect": "video",
    "rounded": true
  }
}
```

### Componente
**Archivo:** `src/components/agnostic/blocks/AgnosticImage.tsx`

```typescript
import { cn } from '@/lib/utils';

interface Props {
  visual?: {
    src?: string;
    alt?: string;
    caption?: string;
    fit?: 'cover' | 'contain' | 'fill';
    aspect?: 'video' | 'square' | 'portrait' | 'auto';
    rounded?: boolean;
    className?: string;
  };
  src?: string;
}

const ASPECT: Record<string, string> = {
  video:    'aspect-video',
  square:   'aspect-square',
  portrait: 'aspect-[3/4]',
  auto:     '',
};

export function AgnosticImage({ visual, src: propSrc }: Props) {
  const { src, alt = '', caption, fit = 'cover', aspect = 'video', rounded = false, className } = visual || {};
  const effectiveSrc = propSrc || src;

  if (!effectiveSrc) return (
    <div className="w-full aspect-video bg-muted/20 rounded-xl flex items-center justify-center text-muted-foreground/30 text-xs font-bold uppercase tracking-widest">
      Sin imagen configurada
    </div>
  );

  return (
    <figure className="w-full space-y-2">
      <div className={cn("w-full overflow-hidden", ASPECT[aspect], rounded && "rounded-xl")}>
        <img
          src={effectiveSrc}
          alt={alt}
          className={cn("w-full h-full", `object-${fit}`, className)}
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="text-center text-xs text-muted-foreground/60 font-medium italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
```

### Settings schema
**Archivo:** `src/core/designer/dna/schemas/image.settings.json`
```json
{
  "id": "image_settings_def",
  "name": "image_settings",
  "fields": [
    {
      "key": "visual",
      "label": "Imagen",
      "icon": "Palette",
      "type": "section",
      "fields": [
        { "key": "src",     "label": "URL de la Imagen",  "type": "string",
          "description": "URL absoluta o path relativo. Ejemplo: /images/hero.jpg o https://cdn.ejemplo.com/img.webp" },
        { "key": "alt",     "label": "Texto Alternativo", "type": "string",
          "description": "Describe la imagen para accesibilidad y SEO." },
        { "key": "caption", "label": "Pie de Foto",       "type": "string" },
        {
          "key": "aspect",
          "label": "Relación de Aspecto",
          "type": "select",
          "options": [
            { "label": "16:9 Video",   "value": "video" },
            { "label": "1:1 Cuadrado", "value": "square" },
            { "label": "3:4 Retrato",  "value": "portrait" },
            { "label": "Auto",         "value": "auto" }
          ],
          "default": "video"
        },
        {
          "key": "fit",
          "label": "Ajuste de Imagen",
          "type": "select",
          "options": [
            { "label": "Cover (rellena, recorta)", "value": "cover" },
            { "label": "Contain (completa)",       "value": "contain" }
          ],
          "default": "cover"
        },
        { "key": "rounded", "label": "Bordes Redondeados", "type": "boolean" }
      ]
    }
  ]
}
```

### Registro
```typescript
import imageSettingsSchema from '@/core/designer/dna/schemas/image.settings.json';
registry.register('image', AgnosticImage, { category: 'content', name: 'Imagen', settings_schema: imageSettingsSchema });
```

---

## Bloque 10 — `stats_grid`

### Propósito
Rejilla de métricas o KPIs. Para landing pages que muestran "12 años de experiencia", "340 proyectos", etc. También útil para dashboards de gestión cuando los valores son estáticos.

### Contrato JSON
```json
{
  "type": "stats_grid",
  "visual": {
    "items": [
      { "value": "12+",  "label": "Años de experiencia", "icon": "Calendar" },
      { "value": "340",  "label": "Proyectos entregados", "icon": "CheckCircle" },
      { "value": "100%", "label": "Satisfacción del cliente", "icon": "Star" }
    ],
    "cols": 3
  }
}
```

### Componente
**Archivo:** `src/components/agnostic/blocks/AgnosticStatsGrid.tsx`

```typescript
import * as Icons from 'lucide-react';

interface StatItem {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

interface Props {
  visual?: { items?: StatItem[]; cols?: number };
  items?: StatItem[];
}

export function AgnosticStatsGrid({ visual, items: propItems }: Props) {
  const items = propItems || visual?.items || [];
  const cols  = visual?.cols || items.length || 3;

  const colClass: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${colClass[cols] || colClass[3]} gap-8`}>
      {items.map((item, i) => {
        const IconComp = item.icon && item.icon in Icons ? (Icons as any)[item.icon] : null;
        return (
          <div key={i} className="text-center space-y-1">
            {IconComp && <IconComp className="w-6 h-6 mx-auto text-primary/60 mb-2" />}
            <div className="text-4xl font-black tracking-tighter text-foreground">{item.value}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{item.label}</div>
            {item.description && <p className="text-xs text-muted-foreground/60">{item.description}</p>}
          </div>
        );
      })}
    </div>
  );
}
```

### Settings schema
**Archivo:** `src/core/designer/dna/schemas/stats_grid.settings.json`
```json
{
  "id": "stats_grid_settings_def",
  "name": "stats_grid_settings",
  "fields": [
    {
      "key": "visual",
      "label": "Métricas",
      "icon": "Palette",
      "type": "section",
      "fields": [
        {
          "key": "cols",
          "label": "Columnas",
          "type": "select",
          "options": [
            { "label": "2", "value": "2" },
            { "label": "3", "value": "3" },
            { "label": "4", "value": "4" }
          ],
          "default": "3",
          "description": "Número de stats por fila. Se ajusta automáticamente en móvil."
        }
      ]
    }
  ]
}
```

**Nota:** Las `items` individuales se editan directamente en el JSON del bloque en `page_routes.json`. El Designer las puede crear con el `update_block` del MCP. Agregar un editor de ítems dinámico es trabajo futuro.

### Registro
```typescript
import statsGridSettingsSchema from '@/core/designer/dna/schemas/stats_grid.settings.json';
registry.register('stats_grid', AgnosticStatsGrid, { category: 'content', name: 'Métricas / Stats', settings_schema: statsGridSettingsSchema });
```

---

## Bloque 11 — `faq`

### Propósito
Acordeón de preguntas frecuentes. Reutiliza el componente Accordion de Shadcn/UI.

### Contrato JSON
```json
{
  "type": "faq",
  "visual": {
    "title": "Preguntas Frecuentes",
    "items": [
      { "q": "¿Cuánto demora un proyecto?", "a": "Entre 4 y 12 semanas dependiendo de la complejidad." },
      { "q": "¿Trabajan con diseñadores?",  "a": "Sí, colaboramos con diseñadores de interiores." }
    ]
  }
}
```

### Componente
**Archivo:** `src/components/agnostic/blocks/AgnosticFaq.tsx`

```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface FaqItem { q: string; a: string }
interface Props {
  visual?: { title?: string; items?: FaqItem[] };
  items?: FaqItem[];
}

export function AgnosticFaq({ visual, items: propItems }: Props) {
  const items = propItems || visual?.items || [];
  const title = visual?.title;

  return (
    <div className="w-full space-y-4">
      {title && <h2 className="text-2xl font-bold tracking-tight mb-6">{title}</h2>}
      <Accordion type="single" collapsible className="w-full space-y-2">
        {items.map((item, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="border border-border/50 rounded-xl px-4 bg-muted/10"
          >
            <AccordionTrigger className="text-sm font-bold uppercase tracking-wide hover:no-underline py-4">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
```

### Settings schema
**Archivo:** `src/core/designer/dna/schemas/faq.settings.json`
```json
{
  "id": "faq_settings_def",
  "name": "faq_settings",
  "fields": [
    {
      "key": "visual",
      "label": "FAQ",
      "icon": "Palette",
      "type": "section",
      "fields": [
        { "key": "title", "label": "Título del Bloque FAQ", "type": "string",
          "description": "Encabezado visible sobre las preguntas. Puede dejarse vacío." }
      ]
    }
  ]
}
```

### Registro
```typescript
import faqSettingsSchema from '@/core/designer/dna/schemas/faq.settings.json';
registry.register('faq', AgnosticFaq, { category: 'content', name: 'FAQ', settings_schema: faqSettingsSchema });
```

---

## Bloque 12 — `testimonial`

### Propósito
Cita de cliente o usuario. Para landing pages y portafolios.

### Contrato JSON
```json
{
  "type": "testimonial",
  "visual": {
    "quote": "Transformaron nuestro espacio más allá de lo que imaginamos. Calidad impecable.",
    "author": "María González",
    "role": "Arquitecta de Interiores",
    "avatar": "MG",
    "variant": "card"
  }
}
```

### Componente
**Archivo:** `src/components/agnostic/blocks/AgnosticTestimonial.tsx`

```typescript
import { cn } from '@/lib/utils';

interface Props {
  visual?: {
    quote?: string;
    author?: string;
    role?: string;
    avatar?: string;
    variant?: 'card' | 'minimal';
  };
}

export function AgnosticTestimonial({ visual }: Props) {
  const { quote = '', author = '', role = '', avatar, variant = 'card' } = visual || {};
  const initials = avatar || author.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  if (variant === 'minimal') {
    return (
      <blockquote className="border-l-4 border-primary pl-6 space-y-3">
        <p className="text-lg italic text-muted-foreground leading-relaxed">"{quote}"</p>
        <footer className="text-sm font-bold uppercase tracking-wider">
          {author}{role && <span className="font-normal opacity-60 ml-2">— {role}</span>}
        </footer>
      </blockquote>
    );
  }

  return (
    <div className="bg-muted/20 border border-border/50 rounded-2xl p-8 space-y-4">
      <p className="text-base leading-relaxed text-foreground/80 italic">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div>
          <div className="text-sm font-bold">{author}</div>
          {role && <div className="text-xs text-muted-foreground">{role}</div>}
        </div>
      </div>
    </div>
  );
}
```

### Settings schema
**Archivo:** `src/core/designer/dna/schemas/testimonial.settings.json`
```json
{
  "id": "testimonial_settings_def",
  "name": "testimonial_settings",
  "fields": [
    {
      "key": "visual",
      "label": "Testimonio",
      "icon": "Palette",
      "type": "section",
      "fields": [
        { "key": "quote",  "label": "Cita",             "type": "string" },
        { "key": "author", "label": "Autor",             "type": "string" },
        { "key": "role",   "label": "Cargo / Empresa",  "type": "string" },
        { "key": "avatar", "label": "Iniciales Avatar",  "type": "string",
          "description": "1-2 letras para el avatar circular. Si se omite se auto-genera del nombre." },
        {
          "key": "variant",
          "label": "Estilo",
          "type": "select",
          "options": [
            { "label": "Tarjeta",  "value": "card" },
            { "label": "Minimal",  "value": "minimal" }
          ],
          "default": "card"
        }
      ]
    }
  ]
}
```

### Registro
```typescript
import testimonialSettingsSchema from '@/core/designer/dna/schemas/testimonial.settings.json';
registry.register('testimonial', AgnosticTestimonial, { category: 'content', name: 'Testimonio', settings_schema: testimonialSettingsSchema });
```

---

## Bloque 13 — `cta_banner`

### Propósito
Banda de llamada a la acción. Section de alto contraste para cerrar una landing o separar secciones con intención de conversión.

### Contrato JSON
```json
{
  "type": "cta_banner",
  "visual": {
    "headline": "¿Listo para transformar tu espacio?",
    "sub": "Solicita una cotización sin compromiso.",
    "cta_label": "Cotizar Ahora",
    "cta_href": "/contacto",
    "variant": "primary"
  }
}
```

### Componente
**Archivo:** `src/components/agnostic/blocks/AgnosticCtaBanner.tsx`

```typescript
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  visual?: {
    headline?: string;
    sub?: string;
    cta_label?: string;
    cta_href?: string;
    variant?: 'primary' | 'muted';
  };
}

export function AgnosticCtaBanner({ visual }: Props) {
  const { headline, sub, cta_label, cta_href = '#', variant = 'primary' } = visual || {};

  return (
    <section className={cn(
      "w-full rounded-2xl p-12 text-center flex flex-col items-center gap-6",
      variant === 'primary' ? "bg-primary text-primary-foreground" : "bg-muted/30 border border-border"
    )}>
      {headline && <h2 className="text-3xl font-black tracking-tight max-w-2xl">{headline}</h2>}
      {sub && <p className={cn("text-sm max-w-md", variant === 'primary' ? "opacity-80" : "text-muted-foreground")}>{sub}</p>}
      {cta_label && (
        <Button
          asChild
          size="lg"
          variant={variant === 'primary' ? 'secondary' : 'default'}
          className="font-bold uppercase tracking-wider"
        >
          <Link href={cta_href}>{cta_label}</Link>
        </Button>
      )}
    </section>
  );
}
```

### Settings schema
**Archivo:** `src/core/designer/dna/schemas/cta_banner.settings.json`
```json
{
  "id": "cta_banner_settings_def",
  "name": "cta_banner_settings",
  "fields": [
    {
      "key": "visual",
      "label": "Call to Action",
      "icon": "Palette",
      "type": "section",
      "fields": [
        { "key": "headline",  "label": "Título del Banner",  "type": "string" },
        { "key": "sub",       "label": "Subtítulo",          "type": "string" },
        { "key": "cta_label", "label": "Texto del Botón",    "type": "string" },
        { "key": "cta_href",  "label": "URL del Botón",      "type": "string",
          "description": "Ruta interna (ej: /contacto) o URL externa." },
        {
          "key": "variant",
          "label": "Estilo de Banda",
          "type": "select",
          "options": [
            { "label": "Primario (color de marca)", "value": "primary" },
            { "label": "Neutro (muted)",            "value": "muted" }
          ],
          "default": "primary"
        }
      ]
    }
  ]
}
```

### Registro
```typescript
import ctaBannerSettingsSchema from '@/core/designer/dna/schemas/cta_banner.settings.json';
registry.register('cta_banner', AgnosticCtaBanner, { category: 'content', name: 'CTA Banner', settings_schema: ctaBannerSettingsSchema });
```

---

## Bloque 14 — `spacer`

### Propósito
Espacio en blanco controlado. Más semántico que ajustar padding en bloques vecinos.

### Contrato JSON
```json
{ "type": "spacer", "visual": { "size": "xl" } }
```

### Tamaños
`xs` = 1rem | `sm` = 2rem | `md` = 4rem | `lg` = 8rem | `xl` = 12rem

### Componente
**Archivo:** `src/components/agnostic/blocks/AgnosticSpacer.tsx`

```typescript
const SIZES: Record<string, string> = {
  xs: '1rem', sm: '2rem', md: '4rem', lg: '8rem', xl: '12rem'
};

interface Props { visual?: { size?: string; custom?: string } }

export function AgnosticSpacer({ visual }: Props) {
  const height = visual?.custom || SIZES[visual?.size || 'md'] || '4rem';
  return <div style={{ height }} aria-hidden="true" />;
}
```

### Settings schema
**Archivo:** `src/core/designer/dna/schemas/spacer.settings.json`
```json
{
  "id": "spacer_settings_def",
  "name": "spacer_settings",
  "fields": [
    {
      "key": "visual",
      "label": "Espaciado",
      "icon": "Layout",
      "type": "section",
      "fields": [
        {
          "key": "size",
          "label": "Tamaño del Espacio",
          "type": "select",
          "options": [
            { "label": "XS — 1rem",  "value": "xs" },
            { "label": "SM — 2rem",  "value": "sm" },
            { "label": "MD — 4rem",  "value": "md" },
            { "label": "LG — 8rem",  "value": "lg" },
            { "label": "XL — 12rem", "value": "xl" }
          ],
          "default": "md"
        },
        {
          "key": "custom",
          "label": "Tamaño Personalizado (CSS)",
          "type": "string",
          "description": "Anula el selector de tamaño. Cualquier valor CSS válido. Ejemplo: 5.5rem, 100px"
        }
      ]
    }
  ]
}
```

### Registro
```typescript
import spacerSettingsSchema from '@/core/designer/dna/schemas/spacer.settings.json';
registry.register('spacer', AgnosticSpacer, { category: 'layout', name: 'Espacio', settings_schema: spacerSettingsSchema });
```

---

## Resumen de todos los registros — `init.ts` final completo

```typescript
// IMPORTS — bloques de ROADMAP_UI_BLOCKS.md (corrección: aquí, no en Registry.ts)
import { AgnosticNavbar }      from '@/components/agnostic/blocks/AgnosticNavbar';
import { AgnosticTabs }        from '@/components/agnostic/blocks/AgnosticTabs';
import { AgnosticText }        from '@/components/agnostic/blocks/AgnosticText';
import { AgnosticHero }        from '@/components/agnostic/blocks/AgnosticHero';
import { AgnosticColumns }     from '@/components/agnostic/blocks/AgnosticColumns';
import { AgnosticDivider }     from '@/components/agnostic/blocks/AgnosticDivider';
import { AgnosticCardStatic }  from '@/components/agnostic/blocks/AgnosticCardStatic';

// IMPORTS — bloques de este roadmap
import { AgnosticMarkdown }    from '@/components/agnostic/blocks/AgnosticMarkdown';
import { AgnosticImage }       from '@/components/agnostic/blocks/AgnosticImage';
import { AgnosticStatsGrid }   from '@/components/agnostic/blocks/AgnosticStatsGrid';
import { AgnosticFaq }         from '@/components/agnostic/blocks/AgnosticFaq';
import { AgnosticTestimonial } from '@/components/agnostic/blocks/AgnosticTestimonial';
import { AgnosticCtaBanner }   from '@/components/agnostic/blocks/AgnosticCtaBanner';
import { AgnosticSpacer }      from '@/components/agnostic/blocks/AgnosticSpacer';

// SETTINGS SCHEMAS — bloques de ROADMAP_UI_BLOCKS.md
import navbarSettingsSchema     from '@/core/designer/dna/schemas/navbar.settings.json';
import tabsSettingsSchema       from '@/core/designer/dna/schemas/tabs.settings.json';
import textSettingsSchema       from '@/core/designer/dna/schemas/text.settings.json';
import heroSettingsSchema       from '@/core/designer/dna/schemas/hero.settings.json';
import columnsSettingsSchema    from '@/core/designer/dna/schemas/columns.settings.json';
import dividerSettingsSchema    from '@/core/designer/dna/schemas/divider.settings.json';
import cardStaticSettingsSchema from '@/core/designer/dna/schemas/card_static.settings.json';

// SETTINGS SCHEMAS — bloques de este roadmap
import markdownSettingsSchema    from '@/core/designer/dna/schemas/markdown.settings.json';
import imageSettingsSchema       from '@/core/designer/dna/schemas/image.settings.json';
import statsGridSettingsSchema   from '@/core/designer/dna/schemas/stats_grid.settings.json';
import faqSettingsSchema         from '@/core/designer/dna/schemas/faq.settings.json';
import testimonialSettingsSchema from '@/core/designer/dna/schemas/testimonial.settings.json';
import ctaBannerSettingsSchema   from '@/core/designer/dna/schemas/cta_banner.settings.json';
import spacerSettingsSchema      from '@/core/designer/dna/schemas/spacer.settings.json';

// REGISTROS — todos al final de initializeRegistry()
registry.register('navbar',      AgnosticNavbar,      { category: 'layout',  name: 'Navbar',           settings_schema: navbarSettingsSchema });
registry.register('tabs',        AgnosticTabs,        { category: 'layout',  name: 'Pestañas',         settings_schema: tabsSettingsSchema });
registry.register('text',        AgnosticText,        { category: 'content', name: 'Texto',            settings_schema: textSettingsSchema });
registry.register('hero',        AgnosticHero,        { category: 'content', name: 'Hero',             settings_schema: heroSettingsSchema });
registry.register('columns',     AgnosticColumns,     { category: 'layout',  name: 'Columnas',         settings_schema: columnsSettingsSchema });
registry.register('divider',     AgnosticDivider,     { category: 'layout',  name: 'Divisor',          settings_schema: dividerSettingsSchema });
registry.register('card_static', AgnosticCardStatic,  { category: 'content', name: 'Tarjeta Estática', settings_schema: cardStaticSettingsSchema });
registry.register('markdown',    AgnosticMarkdown,    { category: 'content', name: 'Markdown',         settings_schema: markdownSettingsSchema });
registry.register('image',       AgnosticImage,       { category: 'content', name: 'Imagen',           settings_schema: imageSettingsSchema });
registry.register('stats_grid',  AgnosticStatsGrid,   { category: 'content', name: 'Métricas',         settings_schema: statsGridSettingsSchema });
registry.register('faq',         AgnosticFaq,         { category: 'content', name: 'FAQ',              settings_schema: faqSettingsSchema });
registry.register('testimonial', AgnosticTestimonial, { category: 'content', name: 'Testimonio',       settings_schema: testimonialSettingsSchema });
registry.register('cta_banner',  AgnosticCtaBanner,   { category: 'content', name: 'CTA Banner',       settings_schema: ctaBannerSettingsSchema });
registry.register('spacer',      AgnosticSpacer,      { category: 'layout',  name: 'Espacio',          settings_schema: spacerSettingsSchema });
```

---

## Vectores de entropía

### 1 — `dangerouslySetInnerHTML` en AgnosticMarkdown (mitigado)
Solo se usa con contenido de `page_routes.json`, editado por el operador del sistema. No hay input de usuarios anónimos en este path. Aceptable y documentado en el componente.

### 2 — `cols` en AgnosticColumns llega como string desde el Designer
`AgnosticConfigProjector` guarda selects como string (`"3"`). `AgnosticColumns` debe leer `parseInt(cols, 10)` o `Number(cols)` cuando viene del Designer. El componente en `ROADMAP_UI_BLOCKS.md` usa `visual?.cols ?? 2` directamente. Si llega `"3"` (string), el lookup del `colMap` falla porque `colMap["3"]` no existe — `colMap` tiene claves numéricas.

**Fix en `AgnosticColumns.tsx`:**
```typescript
const cols = Number(visual?.cols ?? 2);
```
Agregar esta normalización al inicio del componente antes del `colMap` lookup.

### 3 — `stats_grid.items` no editable desde el Designer
Los ítems del stats_grid se editan en JSON directamente. El Designer solo expone `cols`. Para añadir/editar ítems, usar `update_block` del MCP. No es un bug, es una limitación conocida de v1.

### 4 — Tailwind `prose` en AgnosticMarkdown requiere plugin
La clase `prose` y `prose-neutral` requieren `@tailwindcss/typography` instalado. Verificar `tailwind.config.*` antes de activar `prose: true`. Si el plugin no está, las clases son no-op (no error, solo sin estilo editorial). El componente funciona igual, solo sin la tipografía premium.

### 5 — `image` con URLs externas requiere configuración de Next.js
`next/image` optimizado requiere dominios en `next.config.js`. El componente usa `<img>` nativo (no `next/image`) para evitar esta fricción en v1. Aceptable para MVP. Migrar a `next/image` en v2 es sencillo.

### 6 — `AgnosticSpacer.visual.cols` recibe string del Designer
El campo `size` viene como string desde el ConfigProjector. `SIZES[visual?.size || 'md']` hace lookup de string a string — no hay conversión numérica. ✓ Sin problema.

---

## Archivos a crear — checklist completo

### Componentes (14 archivos)
```
src/components/agnostic/blocks/AgnosticNavbar.tsx       ← ROADMAP_UI_BLOCKS.md
src/components/agnostic/blocks/AgnosticTabs.tsx         ← ROADMAP_UI_BLOCKS.md
src/components/agnostic/blocks/AgnosticText.tsx         ← ROADMAP_UI_BLOCKS.md
src/components/agnostic/blocks/AgnosticHero.tsx         ← ROADMAP_UI_BLOCKS.md
src/components/agnostic/blocks/AgnosticColumns.tsx      ← ROADMAP_UI_BLOCKS.md (+ fix cols parsing)
src/components/agnostic/blocks/AgnosticDivider.tsx      ← ROADMAP_UI_BLOCKS.md
src/components/agnostic/blocks/AgnosticCardStatic.tsx   ← ROADMAP_UI_BLOCKS.md
src/components/agnostic/blocks/AgnosticMarkdown.tsx     ← este roadmap
src/components/agnostic/blocks/AgnosticImage.tsx        ← este roadmap
src/components/agnostic/blocks/AgnosticStatsGrid.tsx    ← este roadmap
src/components/agnostic/blocks/AgnosticFaq.tsx          ← este roadmap
src/components/agnostic/blocks/AgnosticTestimonial.tsx  ← este roadmap
src/components/agnostic/blocks/AgnosticCtaBanner.tsx    ← este roadmap
src/components/agnostic/blocks/AgnosticSpacer.tsx       ← este roadmap
```

### Settings schemas (14 archivos JSON)
```
src/core/designer/dna/schemas/navbar.settings.json
src/core/designer/dna/schemas/tabs.settings.json
src/core/designer/dna/schemas/text.settings.json
src/core/designer/dna/schemas/hero.settings.json
src/core/designer/dna/schemas/columns.settings.json
src/core/designer/dna/schemas/divider.settings.json
src/core/designer/dna/schemas/card_static.settings.json
src/core/designer/dna/schemas/markdown.settings.json
src/core/designer/dna/schemas/image.settings.json
src/core/designer/dna/schemas/stats_grid.settings.json
src/core/designer/dna/schemas/faq.settings.json
src/core/designer/dna/schemas/testimonial.settings.json
src/core/designer/dna/schemas/cta_banner.settings.json
src/core/designer/dna/schemas/spacer.settings.json
```

### Modificaciones a archivos existentes (3 archivos)
```
src/lib/agnostic/init.ts                                     ← agregar todos los registros
src/components/agnostic/modules/AgnosticConfigProjector.tsx  ← agregar case 'textarea'
src/components/agnostic/blocks/AgnosticColumns.tsx           ← fix Number(visual?.cols)
```

---

## Invariante post-implementación

Después de esta sesión, cualquier ruta puede componerse de:

```
[navbar]                           ← layout, nav
[hero]                             ← contenido estático
[stats_grid]                       ← contenido estático
[spacer size="sm"]                 ← layout
[columns cols=3]                   ← layout
  [card_static icon="Package"]     ← contenido estático
  [card_static icon="Star"]        ← contenido estático
  [card_static icon="Shield"]      ← contenido estático
[divider]                          ← layout
[collection schema="productos"]    ← datos dinámicos ← ya existía
[markdown]                         ← contenido estático
[faq]                              ← contenido estático
[cta_banner]                       ← contenido estático
[form schema="contacto"]           ← datos dinámicos ← ya existía
```

Todo configurable desde el Designer. Todo manejable por MCP. Sin una línea de código nuevo para cada sitio o módulo.
