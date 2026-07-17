# ADR: Catálogo estructural y publicación

**Estado:** aceptada para diseño; la implementación requiere lanes y aprobaciones posteriores.

## Contexto

Las rutas, schemas y scripts determinan la estructura funcional del fork. Cuando el mismo catálogo puede modificarse tanto en archivos versionados como directamente en el storage remoto, producción puede divergir de `main` sin que un deploy revele el origen de la diferencia. El resultado no es reproducible ni tiene rollback inequívoco.

Esta decisión aplica a `page_routes`, `schema_definitions` y `scripts`. No redefine la propiedad de los datos operativos ni autoriza una migración en este cambio documental.

## Decisión

1. **Git es el estado deseado y versionado del catálogo estructural.** Los manifiestos declarativos del fork se revisan, validan y cambian mediante ramas, PR y merge a `main`.
2. **Neon es el catálogo aplicado que usa el runtime de producción**, y también es el canon de los datos operativos. La copia estructural en Neon es una proyección aplicada desde Git; no una segunda fuente editable.
3. **Vercel ejecuta una revisión ya aplicada.** Producción se publica desde `main`; un deploy manual local solo puede ser preview y no recibe el alias de producción.
4. El flujo de estructura es unidireccional:

   ```text
   Git/main (estado deseado)
     -> validación y migración idempotente
     -> Neon (catálogo aplicado)
     -> Vercel/runtime (ejecución)
   ```

5. El runtime productivo lee el catálogo desde Neon. Git no se consulta como fallback de producción ni Neon se exporta automáticamente para sobreescribir Git.

## Flujo autorizado

1. Un cambio estructural nace en una rama con contrato de lane y superficie delimitada.
2. La CI valida invariantes, referencias, encoding y una revisión identificable del catálogo.
3. Tras el merge a `main`, una migración idempotente aplica exactamente esa revisión a Neon y registra evidencia de aplicación.
4. La promoción de Vercel se permite solo cuando la revisión aplicada de Neon coincide con el commit esperado y los smoke tests pasan.

Las futuras migraciones deberán conservar IDs estables, registrar commit, checksum, fecha y resultado, y poder detectar una reaplicación sin duplicar registros.

## Exclusiones y límites

- Los datos operativos (por ejemplo clientes, proyectos, cotizaciones, inventario, pagos y usuarios) siguen siendo canónicos en Neon y se cambian mediante las APIs y permisos de negocio; no se versionan como catálogo Git.
- Secretos pertenecen a la configuración segura de Vercel u otro gestor de secretos; nunca al catálogo ni a Git.
- Archivos binarios pertenecen a su storage de objetos, con metadatos operativos en Neon.
- El diseñador no modifica el catálogo activo de producción. Inicialmente genera borradores o cambios revisables; un flujo de publicación en vivo requerirá una ADR y aprobación propias.
- Esta ADR no implementa tablas, scripts, CI, variables de entorno, sincronización ni cambios de estrategia de storage.

## Rollback

Antes de aplicar una revisión estructural a Neon se toma un snapshot recuperable de los namespaces afectados y se conserva junto con la evidencia de la migración. El rollback consiste en aplicar una revisión estructural anterior aprobada mediante una migración explícita y luego promover el commit compatible de Vercel. No se revierte mediante edición manual ni payloads parciales.

Si una migración toca registros existentes, debe leer el registro completo, combinar el cambio en memoria y escribir el objeto completo con el protocolo de metadatos requerido; esto evita la pérdida por reemplazo parcial documentada en `storage/AGENTS.md`.

## Consecuencias

- Un commit y una revisión aplicada pasan a identificar con precisión qué estructura sirve producción.
- Se elimina la ambigüedad entre JSON local y catálogo remoto, a costa de introducir un pipeline de migración y gates explícitos para estructura.
- Los cambios estructurales pierden la inmediatez de la edición directa, pero ganan revisión, trazabilidad, pruebas y rollback.
- Local y producción deben converger hacia el mismo modelo de persistencia; los JSON de `storage/db/` quedan como manifiesto/fixture local, no como base editable de producción.

## Implementación posterior

Esta decisión se ejecutará en lanes secuenciales, después de los checkpoints humanos correspondientes: observabilidad de revisiones, pipeline de migración con staging, gobernanza de deploy y límite de publicación del diseñador. Ninguna lane puede asumir que el pipeline existe hasta que su contrato, QA y auditoría lo evidencien.
