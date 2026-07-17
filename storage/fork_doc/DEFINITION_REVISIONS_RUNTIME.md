# Catálogo estructural por revisiones

## Contrato específico del fork

El seed no prescribe una fuente de autoría única. En este fork, Git es la fuente de
autoría de los cambios candidatos para `schema_definitions`, `page_routes` y `scripts`.
La decisión siempre debe expresar una fuente de autoría, una revisión activa y una vía de
publicación explícitas.

```text
Git candidato
  -> CI / DefinitionPublisher valida
  -> revisión inmutable con hash
  -> Neon activa mediante CAS
  -> Vercel verifica la revisión esperada
  -> DefinitionReader entrega un catálogo coherente
```

## Límites de responsabilidad

| Componente | Responsabilidad |
|---|---|
| `DefinitionPublisher` | valida el bundle completo, publica una revisión inmutable y cambia el puntero activo con CAS. |
| `DefinitionReader` | lee exclusivamente el bundle asociado al puntero activo y verifica su hash. |
| `RecordStore` | mantiene datos operativos; no participa en la publicación estructural. |
| `/api/vault` en `legacy` | CRUD compatible, incluidas definiciones durante la transición. |
| `/api/vault` en `revision` | CRUD de datos operativos; rechaza mutaciones directas de definiciones. |

Neon contiene dos dominios separados: el almacenamiento de definiciones contiene únicamente
revisiones publicadas; los datos operativos se mantienen separados mediante `RecordStore`.

## Controles implementados

- `npm run catalog:export -- --out <archivo>` toma un snapshot read-only consistente. Solo
  acepta `NEON_CATALOG_READONLY_URL`, nunca `DATABASE_URL`.
- `npm run catalog:publish -- --snapshot <archivo> --revision <id> --source-commit <sha> --expected-active <id|none>`
  verifica el hash del bundle, inserta la revisión de forma inmutable y activa con compare-and-swap.
  Solo acepta `NEON_DEFINITION_PUBLISHER_URL`.
- `scripts/sql/definition-revisions.sql` crea el almacenamiento de revisiones. Se aplica una
  vez con un rol de migración autorizado; lectores runtime no ejecutan DDL.
- Con `AGNOSTIC_DEFINITION_MODE=revision`, `DefinitionReader` sustituye las lecturas de los tres
  namespaces estructurales. El runtime exige `AGNOSTIC_EXPECTED_DEFINITION_REVISION`; una
  diferencia con la revisión activa falla el request explícitamente.

## Reglas de release

Un build de Vercel debe recibir `AGNOSTIC_EXPECTED_DEFINITION_REVISION` igual al ID publicado.
Si Neon activa otra revisión, el build no puede continuar contra una definición distinta: debe
fallar y requerir un deploy asociado a la nueva revisión. No se permite publicar schemas, rutas
o zaps individualmente: el hash siempre representa el bundle completo.

## Activación pendiente

La implementación no autoriza ni ejecuta cambios remotos. Antes de habilitar `revision` en
producción: medir divergencia, aprobar el candidato, aplicar la migración SQL con el rol
autorizado, publicar una primera revisión, configurar variables de Vercel y verificar el
deployment. El gate humano sigue siendo obligatorio para Neon de producción, Vercel y secretos.
