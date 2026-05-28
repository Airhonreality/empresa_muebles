# ADR-001 — Blind Renderer y los Cinco Átomos

**Fecha:** 2026-05-27  
**Estado:** Activo — fundación permanente  
**Autores:** Agnostic Seed team  

---

## Contexto

Se necesita un sistema que renderice interfaces a partir de estructuras de datos sin conocer el dominio de negocio. El engine no puede saber nada de "clientes", "facturas" o "productos". Todo el significado de negocio vive en la capa de datos.

## Decisión

El engine es un **blind renderer**. `src/` no contiene lógica de negocio. Todo significado de dominio vive en `storage/{project}/db/*.json`.

## Los Cinco Átomos

El sistema completo está construido exactamente de cinco conceptos. No existe ningún sexto.

| Átomo | Shape | Responsabilidad |
|-------|-------|-----------------|
| **Schema** | `{ name, fields[] }` | Contrato de forma de los datos |
| **Record** | `{ id, context, data }` | Instancia de un schema |
| **Adapter** | `read / write / remove` | Interfaz de persistencia |
| **Block** | `{ type, context, schema_id? }` | Directiva de proyección visual |
| **Page** | `blocks[] @ url path` | Composición de bloques en una ruta |

## El Invariante Central

```
block.context === schema.data.name === nombre_archivo_datos (sin .json)
```

Si estos tres valores divergen, el engine renderiza nada silenciosamente. **Todo bug histórico en este sistema traza a esta violación.**

## Cadena de Arquitectura (solo lectura mental)

```
Request
  → layout.tsx          → getVaultData([routes, schemas, config])   ← SSR, React.cache
  → page.tsx            → getVaultData([routes, schemas, + contextos])
  → resolveAgnosticRoute()  → memoria pura, sin I/O
  → AgnosticShell       → hidrata Zustand UNA VEZ por navegación
  → AgnosticRenderer    → enruta block.type a componentes registrados
  → /api/vault          → ÚNICO gateway de escritura → Adapter → storage/
```

## Anti-patrones prohibidos para siempre

```typescript
// 1. Prefijos band-aid — los contextos deben coincidir exactamente con nombres de schema
context.replace('vault_', '')   // FORBIDDEN
context.replace('schema_', '')  // FORBIDDEN

// 2. camelCase junto a snake_case
{ schemaId: x, schema_id: x }  // FORBIDDEN — solo snake_case

// 3. SSR eager para datos de relación
for (const field of schema.fields) {
  if (field.type === 'relation') load(field.config.relation.entity)
}  // FORBIDDEN — los selectores de relación cargan lazy en RelationField

// 4. IDs con Math.random() o Date.now()
id: `block_${Date.now()}`  // FORBIDDEN — usar crypto.randomUUID()

// 5. Hidratación fuera de AgnosticShell o AppContext
hydrateDNA(...)    // Solo en AppContext (designer) y AgnosticShell (pages)
hydrateMateria(…)  // Solo en AppContext (designer) y AgnosticShell (pages)

// 6. Leer datos de relación directamente del store
const list = materiaStore[rel.entity] || []  // FORBIDDEN sin useRelationData

// 7. Hardcodear campos de negocio en src/
saveItem(ctx, { data: { direccion_obra: "", costos: 0 } })  // FORBIDDEN en src/

// 8. Scripts como archivos .js en el filesystem
// storage/{project}/logic/*.js   // FORBIDDEN — los scripts son DataItems en scripts.json
```

## Lo que nunca cambia

Esta ADR es la **fundación permanente** del sistema. Las otras ADRs extienden o refinan esta base, pero ninguna la contradice. Los cinco átomos, el invariante central, y los anti-patrones son inmutables.

## Consecuencias

- El engine puede renderizar cualquier dominio de negocio sin modificación
- Cambiar lo que muestra la app = editar `storage/`, nunca `src/`
- Cualquier AI asistiendo en el proyecto puede generar código correcto sin conocer el dominio si respeta estos contratos
