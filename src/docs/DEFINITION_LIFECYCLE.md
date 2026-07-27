# Architecture: Definition Lifecycle

## Decisión

La gramática agnóstica permanece intacta:

```text
Schema -> estructura de información
Route  -> composición de interfaz
Zap    -> comportamiento ejecutable
```

La evolución añade el ciclo operacional que faltaba. Las tres colecciones se
leen como una sola `DefinitionRevision`; los demás namespaces continúan en
`RecordStore`.

Esta decisión no prescribe Git, SQL, filesystem, proveedor cloud ni dominio de
negocio. `AgnosticBridge` continúa siendo el puerto físico neutral.

## Contratos

| Puerto | Responsabilidad |
|---|---|
| `DefinitionReader` | leer una revisión coherente |
| `DefinitionPublisher` | validar y activar mediante CAS |
| `DefinitionRevisionStore` | bundles inmutables y puntero activo |
| `RecordStore` | CRUD de records por namespace |
| `AgnosticBridge` | adaptación física de persistencia |

Una revisión contiene `schema_definitions`, `page_routes` y `scripts`, se
identifica por SHA-256 del contenido canónico y declara consistencia
`observed` o `atomic`.

`observed` existe solo para compatibilidad y comparación. Una publicación
persistente siempre es `atomic`.

## Modos

| Modo | Lectura | Escritura | Propósito |
|---|---|---|---|
| `legacy` | bridge histórico | bridge histórico | forks existentes |
| `shadow` | legacy; compara revisión | legacy | detectar divergencias |
| `revision` | bundle activo estricto | publisher revisionado | operación gobernada |

No existe fallback de `revision` a `legacy`. Un backend inaccesible, bundle
corrupto o puntero ausente falla de forma explícita.

## Publicación

```text
candidate
  -> validación de shapes e IDs
  -> validación schema/context/zap
  -> serialización canónica
  -> SHA-256
  -> escritura inmutable
  -> relectura e integridad
  -> activate(expected, next)
```

La activación usa compare-and-set. Dos publicaciones concurrentes no pueden
sobrescribirse silenciosamente.

## Compatibilidad

- No cambian los JSON, IDs, contexts ni contratos de bloques.
- Un fork sin variables nuevas permanece en `legacy`.
- SSR y Vault mantienen el shape de hidratación.
- El diseñador conserva escritura inmediata en `legacy`; en `revision` cada
  mutación válida produce una nueva revisión.
- CLI, MCP, zaps y refactorizadores usan la fachada consciente de namespaces.
- Los records continúan usando la estrategia activa.

## Adopción de un fork

```text
1. Fijar baseline y ejecutar tests.
2. Ejecutar `npm run definitions -- plan`.
3. Publicar con expected revision explícita.
4. Activar `shadow` y resolver cualquier divergencia.
5. Exportar el snapshot usado por el build.
6. Activar `revision`.
7. Verificar health, rutas, schemas, zaps y generated types.
8. Ensayar rollback antes de declarar estable.
```

Para primera activación:

```bash
npm run definitions -- apply -- --expected none --yes
```

Para una actualización:

```bash
npm run definitions -- apply -- --expected <revision_actual> --yes
```

## Build reproducible

En modo `revision`, `agnostic:compile` no lee
`storage/db/schema_definitions.json`. Lee el bundle indicado por
`AGNOSTIC_DEFINITION_SNAPSHOT`, verifica su hash y escribe el ID de revisión en
el encabezado de los tipos generados. El snapshot se exporta a una ruta
versionada, por ejemplo `storage/definition-revision.json`; no se guarda bajo
`.agno/`, porque ese directorio no se propaga al build remoto.

`AGNOSTIC_DEFINITION_REVISION` fija el mismo ID en build y runtime. En
producción, el modo `revision` falla si falta el pin o si el puntero activo no
coincide. Las mutaciones estructurales se publican antes del despliegue y
requieren actualizar snapshot, pin y artefacto como una sola promoción.

## Rollback

Los bundles no se borran ni modifican. El rollback reactiva un ID anterior con
la revisión activa como precondición CAS. Si la precondición no coincide, se
detiene para no sobrescribir una publicación concurrente.

```bash
npm run definitions -- activate -- \
  --revision <revision_anterior> \
  --expected <revision_actual> \
  --yes
```

## Evidencia mínima

Antes de propagar a otros forks deben pasar:

```text
npm run validate:encoding
npx tsc --noEmit
npm test
npm run agnostic:compile
node scripts/validate-storage.mjs
npm run build
git diff --check
```

Además se verifica un fixture legacy, shadow sin divergencias, activación
revisionada, conflicto concurrente y rollback real.
