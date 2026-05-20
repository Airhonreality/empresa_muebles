# ROADMAP — Agnostic UI Blocks (Módulos de Presentación)

> **Ejecutor**: Gemini  
> **Supervisor**: Claude  
> **Estado**: Pendiente  
> **Prerequisito**: Sistema en rama `v2-sovereign-rebirth`, bloques complejos ya funcionando.

---

## Contexto y filosofía

El sistema ya tiene los bloques de datos complejos (`collection`, `table`, `form`, `action`, `project_selector`). Lo que falta son los bloques **estructurales y de presentación** necesarios para construir cualquier web — tanto ERP admin como landing pública.

Todos los bloques siguen el mismo contrato:

```
1. Registrar en src/lib/agnostic/Registry.ts
2. Crear componente en src/components/agnostic/blocks/
3. El componente recibe props desde AgnosticRenderer via {...block} {...block.data} spread
4. NUNCA lógica de negocio en src/ — solo estructura visual
5. NUNCA hardcodear textos o rutas — vienen del JSON del bloque
```

---

## Bloque 1 — `navbar`

### Propósito
Barra de navegación horizontal o lateral que renderiza links desde un config JSON. Un solo namespace `app_navbars` contiene las configs; cada bloque en una ruta referencia una por `nav_id`.

### Contrato JSON del bloque en page_routes
```json
{
  "id": "block_erp_nav",
  "type": "navbar",
  "nav_id": "erp_nav"
}
```

### Namespace de configuración (MCP crea estos registros)
```json
// storage/{tenant}/db/app_navbars.json
[{
  "id": "uuid",
  "context": "app_navbars",
  "data": {
    "name": "erp_nav",
    "brand": { "label": "ERP", "path": "/" },
    "links": [
      { "label": "Cotizaciones", "path": "/cotizador", "icon": "FileText" },
      { "label": "Catálogo",     "path": "/catalogo",  "icon": "Package"  },
      { "label": "Clientes",     "path": "/clientes",  "icon": "Users"    },
      { "label": "Registros",    "path": "/registros", "icon": "Database" }
    ]
  }
}]
```

### Implementación del componente
```typescript
// src/components/agnostic/blocks/AgnosticNavbar.tsx
'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useMateriaStore } from '@/lib/agnostic/store';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  nav_id?: string;
  // Fallback: links inline en el bloque
  links?: { label: string; path: string; icon?: string }[];
  brand?: { label: string; path: string };
}

export function AgnosticNavbar({ nav_id, links: inlineLinks, brand }: Props) {
  const pathname = usePathname();
  const { data: materia } = useMateriaStore();

  // Resolver config: inline > nav_id lookup
  const navConfig = nav_id
    ? (materia['app_navbars'] || []).find((r: any) => r.data?.name === nav_id)?.data
    : null;

  const links = inlineLinks || navConfig?.links || [];
  const brandConfig = brand || navConfig?.brand;

  return (
    <nav className="w-full border-b bg-background/95 backdrop-blur sticky top-0 z-40">
      <div className="flex items-center gap-6 px-6 h-14">
        {brandConfig && (
          <Link href={brandConfig.path} className="font-black text-sm tracking-tight uppercase">
            {brandConfig.label}
          </Link>
        )}
        <div className="flex items-center gap-1">
          {links.map((link: any) => {
            const isActive = pathname === link.path || pathname.startsWith(link.path + '/');
            const IconComp = link.icon && link.icon in Icons ? (Icons as any)[link.icon] : null;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {IconComp && <IconComp className="w-3.5 h-3.5" />}
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
```

### Registro en Registry.ts
```typescript
registry.register('navbar', AgnosticNavbar);
```

### Carga de `app_navbars` en el resolver
En `extractAllContexts` y en el SSR de `page.tsx`, `app_navbars` debe incluirse cuando la ruta tiene un bloque `navbar`. Ya funciona automáticamente porque `extractAllContexts` rastrea todos los contextos del árbol de bloques — PERO `nav_id` no es un contexto, es una referencia a un registro. 

**Solución**: el componente `AgnosticNavbar` hace un fetch lazy del namespace `app_navbars` si no está hidratado, igual que `RelationField` en `AgnosticForm`. Esto es correcto — los navbars son config, no datos primarios de la página.

---

## Bloque 2 — `tabs`

### Propósito
Agrupa sub-bloques en pestañas. La estructura usa el array `blocks` existente con una propiedad `tab_label` en cada sub-bloque.

### Contrato JSON
```json
{
  "id": "block_registros_tabs",
  "type": "tabs",
  "blocks": [
    {
      "tab_label": "Cotizaciones",
      "tab_icon": "FileText",
      "id": "tab_cotizaciones",
      "type": "table",
      "schema_id": "...",
      "context": "cotizaciones",
      "intent": "list"
    },
    {
      "tab_label": "Clientes",
      "tab_icon": "Users",
      "id": "tab_clientes",
      "type": "table",
      "schema_id": "...",
      "context": "clientes",
      "intent": "list"
    },
    {
      "tab_label": "Catálogo",
      "tab_icon": "Package",
      "id": "tab_catalogo",
      "type": "table",
      "schema_id": "...",
      "context": "productos_catalogo",
      "intent": "list"
    }
  ]
}
```

### Implementación
```typescript
// src/components/agnostic/blocks/AgnosticTabs.tsx
'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import * as Icons from 'lucide-react';

const AgnosticRenderer = dynamic(
  () => import('../engine/AgnosticRenderer').then(m => m.AgnosticRenderer),
  { ssr: false, loading: () => <div className="h-20 animate-pulse bg-muted/10 rounded-lg" /> }
);

interface Props {
  blocks?: any[];
  record?: any;
  parentId?: string;
  parentKey?: string;
  intent?: string;
}

export function AgnosticTabs({ blocks = [], record, parentId, parentKey, intent }: Props) {
  const tabs = blocks.filter(b => b.tab_label);
  const [active, setActive] = useState(tabs[0]?.id || tabs[0]?.tab_label || '');

  if (!tabs.length) return null;

  return (
    <Tabs value={active} onValueChange={setActive} className="w-full">
      <TabsList className="mb-6 h-10 bg-muted/50">
        {tabs.map(tab => {
          const IconComp = tab.tab_icon && tab.tab_icon in Icons
            ? (Icons as any)[tab.tab_icon]
            : null;
          const key = tab.id || tab.tab_label;
          return (
            <TabsTrigger
              key={key}
              value={key}
              className="text-[11px] font-bold uppercase tracking-wider gap-2"
            >
              {IconComp && <IconComp className="w-3.5 h-3.5" />}
              {tab.tab_label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {tabs.map(tab => {
        const key = tab.id || tab.tab_label;
        return (
          <TabsContent key={key} value={key}>
            <AgnosticRenderer
              block={tab}
              record={record}
              parentId={parentId}
              parentKey={parentKey}
              intent={intent as any}
            />
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
```

### Registro
```typescript
registry.register('tabs', AgnosticTabs);
```

### Nota para el resolver
`extractAllContexts` ya es recursivo — rastreará los contextos de los sub-bloques de `tabs` automáticamente porque itera `block.blocks`. No requiere cambios en el resolver.

---

## Bloque 3 — `text`

### Propósito
Bloque de contenido textual. Cubre párrafos, headings, labels, captions. Base para cualquier página pública.

### Contrato JSON
```json
{
  "type": "text",
  "visual": {
    "variant": "h1",
    "content": "Bienvenido a Veta de Oro",
    "align": "center",
    "className": ""
  }
}
```

### Variantes
`h1` | `h2` | `h3` | `body` | `caption` | `label` | `quote`

### Implementación
```typescript
// src/components/agnostic/blocks/AgnosticText.tsx
import { cn } from '@/lib/utils';

const VARIANT_STYLES: Record<string, string> = {
  h1:      "text-5xl font-black tracking-tighter",
  h2:      "text-3xl font-bold tracking-tight",
  h3:      "text-xl font-bold",
  body:    "text-base text-muted-foreground leading-relaxed",
  caption: "text-xs font-bold uppercase tracking-widest text-muted-foreground",
  label:   "text-sm font-semibold",
  quote:   "text-xl italic border-l-4 border-primary pl-4 text-muted-foreground",
};

interface Props {
  visual?: { variant?: string; content?: string; align?: string; className?: string };
  content?: string;
  variant?: string;
}

export function AgnosticText({ visual, content: propContent, variant: propVariant }: Props) {
  const content = propContent || visual?.content || '';
  const variant = propVariant || visual?.variant || 'body';
  const align   = visual?.align || 'left';

  return (
    <p className={cn(
      VARIANT_STYLES[variant] || VARIANT_STYLES.body,
      align === 'center' && 'text-center',
      align === 'right'  && 'text-right',
      visual?.className
    )}>
      {content}
    </p>
  );
}
```

---

## Bloque 4 — `hero`

### Propósito
Sección de hero para landings públicas. Title + subtitle + CTA button opcional.

### Contrato JSON
```json
{
  "type": "hero",
  "visual": {
    "title": "Alta Ebanistería y Diseño",
    "subtitle": "Transformamos materiales nobles en espacios que perduran.",
    "align": "center",
    "cta": { "label": "Ver Proyectos", "path": "/proyectos" },
    "cta_secondary": { "label": "Solicitar Cotización", "path": "/contacto" }
  }
}
```

### Implementación
```typescript
// src/components/agnostic/blocks/AgnosticHero.tsx
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  visual?: {
    title?: string;
    subtitle?: string;
    align?: 'left' | 'center';
    cta?: { label: string; path: string };
    cta_secondary?: { label: string; path: string };
    className?: string;
  };
}

export function AgnosticHero({ visual }: Props) {
  const { title, subtitle, align = 'center', cta, cta_secondary, className } = visual || {};

  return (
    <section className={cn(
      "py-24 px-6 w-full",
      align === 'center' && 'text-center flex flex-col items-center',
      className
    )}>
      {title && (
        <h1 className="text-6xl font-black tracking-tighter max-w-3xl mb-4">{title}</h1>
      )}
      {subtitle && (
        <p className="text-lg text-muted-foreground max-w-xl mb-10">{subtitle}</p>
      )}
      {(cta || cta_secondary) && (
        <div className="flex gap-4 flex-wrap justify-center">
          {cta && (
            <Button asChild size="lg" className="font-bold uppercase tracking-wider">
              <Link href={cta.path}>{cta.label}</Link>
            </Button>
          )}
          {cta_secondary && (
            <Button asChild size="lg" variant="outline" className="font-bold uppercase tracking-wider">
              <Link href={cta_secondary.path}>{cta_secondary.label}</Link>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
```

---

## Bloque 5 — `columns`

### Propósito
Layout de columnas para agrupar sub-bloques. Reemplaza el need de escribir grids en código.

### Contrato JSON
```json
{
  "type": "columns",
  "visual": { "cols": 3, "gap": 6 },
  "blocks": [
    { "type": "text", "visual": { "variant": "h3", "content": "Materiales Nobles" } },
    { "type": "text", "visual": { "variant": "h3", "content": "Diseño Personalizado" } },
    { "type": "text", "visual": { "variant": "h3", "content": "Entrega Garantizada" } }
  ]
}
```

### Implementación
```typescript
// src/components/agnostic/blocks/AgnosticColumns.tsx
'use client';
import dynamic from 'next/dynamic';

const AgnosticRenderer = dynamic(
  () => import('../engine/AgnosticRenderer').then(m => m.AgnosticRenderer),
  { ssr: false }
);

interface Props {
  blocks?: any[];
  visual?: { cols?: number; gap?: number };
  record?: any;
}

export function AgnosticColumns({ blocks = [], visual, record }: Props) {
  const cols = visual?.cols ?? 2;
  const gap  = visual?.gap  ?? 6;

  const colMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <div
      className={`grid w-full ${colMap[cols] || colMap[2]}`}
      style={{ gap: `${gap * 0.25}rem` }}
    >
      {blocks.map((block, i) => (
        <AgnosticRenderer key={block.id || i} block={block} record={record} />
      ))}
    </div>
  );
}
```

---

## Bloque 6 — `divider`

### Propósito
Separador visual. Simple pero evita el `<hr>` hardcodeado en layouts.

### Contrato JSON
```json
{ "type": "divider", "visual": { "variant": "line" } }
```

### Variantes
`line` | `space` | `dots`

### Implementación
```typescript
// src/components/agnostic/blocks/AgnosticDivider.tsx
interface Props { visual?: { variant?: string; spacing?: number } }

export function AgnosticDivider({ visual }: Props) {
  const variant = visual?.variant || 'line';
  const spacing = visual?.spacing ?? 4;
  if (variant === 'space') return <div style={{ height: `${spacing * 0.25}rem` }} />;
  if (variant === 'dots') return (
    <div className="flex justify-center gap-2 py-4">
      {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />)}
    </div>
  );
  return <hr className="border-border my-4" />;
}
```

---

## Bloque 7 — `card_static`

### Propósito
Tarjeta de contenido estático (sin datos del store). Para features sections, testimonios, servicios.

### Contrato JSON
```json
{
  "type": "card_static",
  "visual": {
    "icon": "Package",
    "title": "Maderas Nobles",
    "body": "Trabajamos con cedro, nogal y roble de proveedores certificados.",
    "variant": "bordered"
  }
}
```

### Implementación
```typescript
// src/components/agnostic/blocks/AgnosticCardStatic.tsx
import { Card, CardContent } from '@/components/ui/card';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  visual?: { icon?: string; title?: string; body?: string; variant?: string };
}

export function AgnosticCardStatic({ visual }: Props) {
  const { icon, title, body, variant = 'bordered' } = visual || {};
  const IconComp = icon && icon in Icons ? (Icons as any)[icon] : null;

  return (
    <Card className={cn(
      "h-full",
      variant === 'ghost' && "border-none shadow-none bg-transparent"
    )}>
      <CardContent className="p-6 space-y-3">
        {IconComp && <IconComp className="w-8 h-8 text-primary" />}
        {title && <h3 className="font-bold text-base tracking-tight">{title}</h3>}
        {body  && <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>}
      </CardContent>
    </Card>
  );
}
```

---

## Registry — resumen de todos los registros nuevos

```typescript
// src/lib/agnostic/Registry.ts — añadir estas líneas
import { AgnosticNavbar }     from '@/components/agnostic/blocks/AgnosticNavbar';
import { AgnosticTabs }       from '@/components/agnostic/blocks/AgnosticTabs';
import { AgnosticText }       from '@/components/agnostic/blocks/AgnosticText';
import { AgnosticHero }       from '@/components/agnostic/blocks/AgnosticHero';
import { AgnosticColumns }    from '@/components/agnostic/blocks/AgnosticColumns';
import { AgnosticDivider }    from '@/components/agnostic/blocks/AgnosticDivider';
import { AgnosticCardStatic } from '@/components/agnostic/blocks/AgnosticCardStatic';

registry.register('navbar',      AgnosticNavbar);
registry.register('tabs',        AgnosticTabs);
registry.register('text',        AgnosticText);
registry.register('hero',        AgnosticHero);
registry.register('columns',     AgnosticColumns);
registry.register('divider',     AgnosticDivider);
registry.register('card_static', AgnosticCardStatic);
```

---

## Vectores de entropía a evitar

1. **No pasar `context` de negocio a bloques estructurales.** `text`, `hero`, `divider`, `columns`, `card_static` son ciegos — no leen `useMateriaStore`. Solo presentan lo que dice su config JSON.

2. **`AgnosticNavbar` carga `app_navbars` lazy** (igual que `RelationField`). NO añadir `app_navbars` al loop de SSR del resolver. Es config de UI, no datos primarios.

3. **`AgnosticTabs` usa el array `blocks` existente** — no inventar una propiedad nueva `tabs[]`. El resolver ya extrae contextos de `block.blocks` recursivamente.

4. **No hardcodear clases de color** en los nuevos bloques. Usar `text-primary`, `text-muted-foreground`, `bg-muted` del sistema de tokens CSS.

5. **IDs de bloques siempre `crypto.randomUUID()`** — el roadmap usa placeholders `"uuid"` que Gemini debe reemplazar con UUIDs reales al ejecutar los MCPs.

---

## Post-implementación — MCP para activar

Una vez Gemini levante los bloques, ejecutar estos MCPs:

```
1. create_record context=app_navbars → crear navbar ERP con links a rutas existentes
2. create_record context=page_routes → crear /registros con bloque tabs (cotizaciones + clientes + catalogo)
3. update_block en cada ruta ERP → añadir block_erp_nav como primer bloque
```

---

*Documento generado 2026-05-19. Revisar Registry.ts antes de ejecutar para evitar colisiones de nombres de tipo.*
