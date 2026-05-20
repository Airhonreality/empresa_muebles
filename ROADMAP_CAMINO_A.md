# ROADMAP CAMINO A — Relational Queries at the Adapter Layer

> **Estado**: Propuesta. Implementar solo cuando el volumen de datos en cualquier contexto supere ~500 registros o cuando la latencia de hidratación sea perceptible.
> **Prerequisito**: Camino B implementado y estable.

---

## El argumento filosófico — por qué no hay contradicción

El renderer agnóstico es ciego a los *nombres* del dominio, no a la *estructura* de los datos. El concepto de "filtrar registros hijos por su FK parent" es universal — no es `cotizacion_id`, es `{ field, value }`. 

Del mismo modo en que SQL ejecuta `WHERE field = value` sin saber qué significa "cotización", el adapter puede ejecutar un `DataQuery` sin saber qué significa el negocio. La ceguera se preserva porque:

- El renderer nunca escribe `cotizacion_id` en código fuente
- El filtro se deriva de `block.parent_key` (dato en JSON) + URL slug (contexto del request)
- El adapter ejecuta `filter(field, value)` — semántica puramente estructural

**El axioma de independencia no se rompe. Se extiende al adapter.**

---

## Diagnóstico del problema que resuelve

Con el modelo actual (Camino B), el servidor SSR carga **todos** los registros de **todos** los contextos de la ruta y los envía al cliente. El cliente filtra en memoria.

```
SSR: getVaultData(['cotizaciones', 'espacio_variantes', 'items_variante'])
     → 1 cotización + 500 espacios + 5000 items  ← todo viaja al HTML
Client: filter(item => item.data.cotizacion_id === currentId)
     → 1 cotización + 3 espacios + 30 items  ← lo que realmente se muestra
```

El dolor aparece cuando:
- La tabla `espacio_variantes` acumula miles de registros multi-tenant
- El HTML de hidratación inicial supera 500KB
- `getVaultData` tarda >300ms por la lectura completa del fichero

---

## Arquitectura propuesta

### 1. Extender el interface `DataStrategy`

**Archivo**: `packages/core/src/indra.ts`

```typescript
export interface DataFilter {
  field: string
  op?: 'eq' | 'in' | 'gte' | 'lte'
  value: unknown
}

export interface DataQuery {
  context: string
  filters?: DataFilter[]
  limit?: number
  offset?: number
}

export interface DataStrategy {
  read(context: string): Promise<DataItem[]>          // backward compat — sin filtros
  query(query: DataQuery): Promise<DataItem[]>         // nuevo — con filtros opcionales
  write(context: string, record: DataItem): Promise<DataItem>
  remove(context: string, id: string): Promise<void>
}
```

`read()` se mantiene como alias de `query({ context })` sin filtros. Cero breaking changes.

### 2. Implementación por estrategia

#### LocalStrategy
```typescript
async query({ context, filters, limit, offset }: DataQuery): Promise<DataItem[]> {
  const all = await this.read(context)  // lee el JSON completo
  let result = all
  if (filters?.length) {
    result = result.filter(item =>
      filters.every(f => applyFilter(item.data, f))
    )
  }
  if (offset) result = result.slice(offset)
  if (limit)  result = result.slice(0, limit)
  return result
}
```

Para `LocalStrategy` no hay ganancia de I/O (el JSON se lee completo igualmente), pero sí de payload — el servidor filtra antes de serializar al HTML.

#### GitHubStrategy
Igual que `LocalStrategy`: fetch del archivo completo, filter en memoria server-side. GitHub Contents API no soporta queries.

#### SupabaseStrategy ← aquí está el beneficio real
```typescript
async query({ context, filters, limit, offset }: DataQuery): Promise<DataItem[]> {
  let q = this.client.from(context).select('*')
  for (const f of filters ?? []) {
    if (f.op === 'eq' || !f.op) q = q.eq(`data->>${f.field}`, f.value)
    if (f.op === 'in')          q = q.in(`data->>${f.field}`, f.value as unknown[])
  }
  if (limit)  q = q.limit(limit)
  if (offset) q = q.range(offset, offset + (limit ?? 1000) - 1)
  const { data, error } = await q
  if (error) throw error
  return data as DataItem[]
}
```

Con Supabase, el filtro viaja a PostgreSQL. Solo llegan los registros relevantes. Este es el salto de escala real.

### 3. Extender `getVaultData` para recibir queries

**Archivo**: `src/core/server/vault.ts`

```typescript
// Hoy:
export async function getVaultData(contexts: string[]): Promise<Record<string, DataItem[]>>

// Camino A:
export type ContextSpec = string | DataQuery

export async function getVaultData(specs: ContextSpec[]): Promise<Record<string, DataItem[]>> {
  const strategy = await getStrategy()
  const entries = await Promise.all(
    specs.map(async (spec) => {
      if (typeof spec === 'string') {
        return [spec, await strategy.read(spec)] as const
      }
      return [spec.context, await strategy.query(spec)] as const
    })
  )
  return Object.fromEntries(entries)
}
```

Backward compatible: pasar `string[]` sigue funcionando igual.

### 4. El resolver extrae DataQueries del árbol de bloques

**Archivo**: `src/lib/agnostic/resolver.ts`

```typescript
function extractContextSpecs(blocks: any[], parentSlug?: string): ContextSpec[] {
  const specs: ContextSpec[] = []
  for (const block of blocks) {
    const ctx = block.context || block.data?.context
    if (!ctx || ctx === 'system') continue

    const parentKey = block.parent_key || block.data?.parent_key
    if (parentKey && parentSlug) {
      specs.push({ context: ctx, filters: [{ field: parentKey, value: parentSlug }] })
    } else {
      specs.push(ctx)
    }

    const children = block.blocks || block.data?.blocks
    if (Array.isArray(children)) {
      // Los sub-bloques no tienen parent conocido en tiempo de SSR; se cargan sin filtro
      // (serán filtrados client-side por el parentId explícito que reciben como prop)
      specs.push(...extractContextSpecs(children))
    }
  }
  return specs
}
```

La regla para sub-bloques anidados (ej: `items_variante` dentro de una card) es: **cargar sin filtro en SSR, filtrar client-side**. El filtro SSR aplica solo al primer nivel relacional (cotización → espacios). Los niveles más profundos son candidatos a lazy load (ver Fase 2).

### 5. `page.tsx` — integración final

```typescript
// Pass 1: extraer estructura de bloques
const partialResolution = await resolveAgnosticRoute(slug, coreData)

// Pass 2: construir queries relacionales
const parentSlug = Array.isArray(slug) ? slug.at(-1) : slug
const contextSpecs = extractContextSpecs(partialResolution.route.data.blocks, parentSlug)
const specsToHydrate: ContextSpec[] = [
  ...coreContexts,
  ...contextSpecs
]

// Pass 3: cargar con filtros — el adapter decide si usa WHERE o filter()
const initialData = await getVaultData(specsToHydrate)

// Pass 4: re-resolver con datos completos
const resolution = await resolveAgnosticRoute(slug, initialData)
```

---

## Contrato de migración — sin breaking changes

| Escenario | Comportamiento |
|-----------|----------------|
| Bloque sin `parent_key` | Se carga el contexto completo (igual que hoy) |
| Bloque con `parent_key` + URL tiene slug | DataQuery con filtro |
| Bloque con `parent_key` + URL sin slug (ruta lista) | Se carga completo (intent: list) |
| Sub-bloque anidado (nivel 2+) | Sin filtro SSR, filtrado client-side por prop explícito |
| `LocalStrategy` / `GitHubStrategy` | Filter en memoria server-side — mismo I/O, menos payload |
| `SupabaseStrategy` | Filter en PostgreSQL — menos I/O y menos payload |

---

## Vectores de entropía a evitar

**1. No inferir `parent_key` desde el schema en el resolver.**
El resolver debe leer solo lo que está declarado en el bloque (`block.parent_key`). Inferir relaciones desde schemas rompe la independencia axiomática y replica el anti-patrón `inferredRelations` que fue eliminado intencionalmente.

**2. No filtrar sub-bloques de nivel 2+ en SSR en el primer corte.**
`items_variante` depende del `activeItem` dentro de una grouped card — un estado que solo existe en el cliente. Intentar filtrarlo en SSR requeriría conocer qué card está activa, lo que introduce acoplamiento UI↔SSR. Dejarlo client-side es correcto.

**3. No cambiar el contrato de `DataItem`.**
Los filtros operan sobre `item.data[field]`, no sobre el envoltorio `{ id, context, data }`. El adapter nunca expone la estructura interna al caller.

**4. `read()` nunca desaparece.**
Los contextos de sistema (`page_routes`, `schemas`) siempre se cargan completos. `read()` es su interface permanente.

**5. No usar este mecanismo para lógica de acceso.**
Los filtros de `DataQuery` son filtros de relación, no de autorización. El acceso por rol sigue siendo responsabilidad de `visibility_whitelist` en los datos o del `AgnosticGuard` en la UI.

---

## Fases de implementación

### Fase 1 — Adapter + vault (3-4 días)
1. Añadir `DataFilter`, `DataQuery` a `indra.ts`
2. Implementar `query()` en `LocalStrategy`
3. Implementar `query()` en `GitHubStrategy`  
4. Implementar `query()` en `SupabaseStrategy` con cláusula SQL
5. Actualizar `getVaultData` para aceptar `ContextSpec[]`
6. Tests: verificar que `read()` y `query({ context })` son equivalentes

### Fase 2 — Resolver + page.tsx (1-2 días)
1. Extraer `extractContextSpecs()` del resolver
2. Actualizar `page.tsx` con el Pass 2 de construcción de queries
3. Verificar que los sub-bloques de nivel 2+ siguen funcionando con filtrado client-side

### Fase 3 — Lazy load para niveles 2+ (futuro, opcional)
Cuando `items_variante` también crezca a escala, implementar carga lazy via `fetch('/api/vault?context=items_variante&filter=variante_id:eq:${activeItem.id}')` en `AgnosticCollection` cuando `parentId` viene de prop (sub-colección) en vez de URL.

Esto completa el círculo: nivel 1 → SSR filtrado, nivel 2+ → lazy fetch filtrado, nivel 0 (schemas/routes) → SSR completo siempre.

---

## Métricas de éxito

- HTML de hidratación para `/cotizacion/:id` baja de Xkb a <50kb
- `getVaultData` en SupabaseStrategy responde en <50ms por query vs >200ms lectura completa
- Cero cambios en archivos de `storage/` ni en definiciones de bloques en `page_routes.json`
- `AgnosticCollection`, `AgnosticGroupedCard`, `AgnosticRenderer` no necesitan modificación

---

*Documento generado en sesión 2026-05-19. Revisar antes de implementar — verificar que `indra.ts`, `vault.ts` y las estrategias no hayan cambiado de contrato.*
