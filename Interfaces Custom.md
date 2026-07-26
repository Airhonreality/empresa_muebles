# Interfaces Custom

Guia minima para crear o modificar componentes en `src/components/specialized/`.

## Contexto Minimo

Antes de trabajar en componentes especializados, lee:

1. `AGENTS.md`
2. `storage/AGENTS.md`
3. `storage/progreso/current_state.md`
4. `src/generated/agnostic-schemas.ts`
5. `agnostic.config.ts`
6. `src/components/specialized/_TEMPLATE.tsx`

Lee otros documentos solo si `storage/progreso/INDEX.md` los marca como activos o si la tarea los pide.

## Regla De Capas

Un componente especializado puede conocer el dominio del fork.

Un componente del engine no.

```text
Permitido:
src/components/specialized/ProyectoDashboard.tsx
agnostic.config.ts
storage/db/*.json

Prohibido para necesidades de negocio:
packages/
src/components/agnostic/
src/app/api/ engine routes genericas
```

## Registro De Bloques

Los bloques custom se registran en `agnostic.config.ts`:

```typescript
import { defineConfig } from './packages/core/src/config'

export default defineConfig({
  blocks: {
    proyecto_dashboard: () => import('./src/components/specialized/ProyectoDashboard'),
  },
})
```

Luego se usan en `storage/db/page_routes.json`:

```json
{
  "type": "proyecto_dashboard",
  "context": "proyectos"
}
```

## Rutas Publicas (paginas comerciales)

Hay dos formas de servir una pagina publica. Se pueden combinar; **no** hay que
desactivar una para usar la otra.

1. **Data-driven (por defecto)**: `src/app/[...slug]/page.tsx` resuelve cualquier
   ruta desde `storage/db/page_routes.json`. Ideal para paginas que encajan en el
   modelo schema-driven (dashboards, catalogos data-driven).

2. **Modulo explicito**: crea un archivo de ruta Next real, p.ej.
   `src/app/tienda/page.tsx`, que renderiza tu componente de `specialized/`. Ideal
   para superficies bespoke (landing, tienda, checkout) que necesitan SEO por ruta,
   `generateMetadata`, datos server especificos o JSON-LD.

En Next.js **una ruta explicita gana sobre `[...slug]`** (segmento mas especifico).
Por eso `login/`, `schema/`, `setup/` conviven con el catch-all sin tocarlo. Un fork
comercial simplemente **agrega** sus archivos de ruta explicitos; el `[...slug]`
sigue cubriendo el resto. No hace falta hacer `notFound()` en el catch-all.

- El titulo/SEO de cada ruta explicita sale de su propio `generateMetadata`; si no
  define titulo, hereda la identidad del sitio (ver `configuracion_comercial`).
- `src/app/page.tsx` y `src/app/[...slug]/page.tsx` son **puntos de entrada finos**
  (solo delegan en `AgnosticRoutePage`): un fork puede reemplazarlos por su home /
  ruteo propio sin tocar engine profundo.

## Identidad y SEO (por datos)

La identidad de navegador/SEO del sitio sale de `configuracion_comercial`
(namespace de storage). El layout la inyecta; **nunca edites `layout.tsx`**.

Campos (matcheados por nombre; todos opcionales): `site_title`, `site_description`,
`favicon_url`, `ga_measurement_id`, `brand_name`, `website_url`, `logo_url`,
`same_as`, `telephone`, `contact_email`, `locality`/`region`/`country`.

Producen: `<title>` por defecto (las paginas lo overridean con su `generateMetadata`),
`<meta description>`, favicon, el tag de Google Analytics y el JSON-LD `Organization`.
Sin config -> defaults neutros (fork virgen limpio). Logica: `src/lib/seo/siteConfig.ts`.

## Theming, fuentes y CSS custom (por datos)

Nunca edites `globals.css` (engine). El fork tiene DOS capas propias:

1. **Variables CSS -> `design_tokens`** (namespace de storage). Cada registro
   `{ name, value }` genera `--<name>: <value>` en `storage/styles/tokens.css`
   (via `POST /api/tokens/sync`). Incluye tipografia: un token
   `sat-font-sans = 'Mi Fuente', sans-serif` cambia la fuente base. `tokens.css`
   se inyecta DESPUES de `globals.css`, asi que gana por cascada.

2. **CSS libre -> `storage/styles/custom.css`** (fork-owned, deployable). Para lo
   que no es una variable: `@font-face` de fuentes propias (no-Google), clases de
   tema (`.theme-*`), overrides puntuales. El layout lo inyecta DESPUES de
   `tokens.css` (maxima prioridad). Opcional; ausente en fork virgen.

Regla: variables -> `design_tokens`; `@font-face`/clases/temas -> `custom.css`.
Asi `globals.css` queda identico al seed y nunca genera conflicto en el upstream.

## Tipos De Datos

Importa tipos del contrato generado:

```typescript
import type { AgnosticDataItem } from '@/generated/agnostic-schemas'
```

No inventes tipos de negocio a mano si ya existen en `src/generated/agnostic-schemas.ts`.

Despues de cambiar schemas:

```bash
npm run agnostic:compile
```

## Props Esperadas

Los bloques reciben props del engine. Usa el template local como fuente principal.

Patron general:

```typescript
type Props = {
  block?: unknown
  context?: string
  data?: AgnosticDataItem[]
  api?: {
    saveItem?: (context: string, item: unknown) => Promise<unknown>
    removeItem?: (context: string, id: string) => Promise<unknown>
  }
}
```

Mantén el componente tolerante a datos vacios. El engine puede renderizar antes de que exista contenido de negocio.

## UI Disponible

Preferir componentes existentes en `src/components/ui/`:

- `Button`
- `Input`
- `Textarea`
- `Select`
- `Checkbox`
- `Switch`
- `Slider`
- `Tabs`
- `Dialog`
- `Sheet`
- `Popover`
- `Tooltip`
- `Badge`
- `Card`, solo para items repetidos o herramientas enmarcadas

Para iconos, usar `lucide-react` cuando exista un icono adecuado.

## Bloques Del Engine Reutilizables

Puedes componer bloques genericos dentro de specialized cuando sea coherente:

- `AgnosticForm`
- `AgnosticCollection`
- `AgnosticTable`
- `AgnosticAction`

No los modifiques para una necesidad de un fork.

## Relaciones

Para datos relacionados, usa el hook del engine:

```typescript
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'

const { data, isLoading } = useRelationData('clientes')
```

No leas relaciones directamente desde stores internas si existe un hook publico.

## Escritura

Las mutaciones deben pasar por APIs del engine o por helpers recibidos en props.

No escribas archivos desde el navegador. No hardcodees campos de negocio en componentes genericos.

## Zaps Y Eventos

Si un boton debe ejecutar logica de negocio portable, usa un zap en `storage/db/scripts.json` y `AgnosticAction`.

Eventos soportados por el cliente:

```text
notify
materia_sync
print_pdf
download_pdf
download_file
redirect
open_url
clipboard
```

## Checklist Antes De Terminar

- El bloque esta registrado en `agnostic.config.ts`.
- El `type` en `page_routes.json` coincide con el registro.
- El `context` coincide con schema y archivo de datos.
- No se tocaron archivos del engine para logica de negocio.
- TypeScript pasa.
- La UI no depende de datos hardcodeados del seed.
