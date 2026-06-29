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
