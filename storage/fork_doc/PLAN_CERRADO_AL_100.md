# Plan Cerrado al 100%

## Objetivo

Dejar el fork en un estado que pueda considerarse operativo, sincronizable y publicable sin romper la arquitectura del engine ni la capa de adapters del fork.

## Alcance

Este plan cubre solo el fork `empresa_muebles_clone` y su relación con el seed:

- carga pública del sitio
- panel admin protegido
- bootstrap inicial
- sincronización engine -> fork
- adapters registrados por contrato
- storage y docs vivos del fork

## Criterio de cierre

El fork se puede declarar "cerrado al 100%" cuando se cumplan estas condiciones:

1. Las rutas públicas cargan sin depender del panel admin.
2. `/schema` y las APIs administrativas quedan restringidas a admin autenticado.
3. El bootstrap del primer usuario se ejecuta por una vía explícita y no por escritura genérica en `vault`.
4. `getVaultData` no repite lecturas evitables en una misma request.
5. Los adapters se sincronizan por el contrato del CLI, no por edición manual paralela de dos registros.
6. `storage/progreso/` y `storage/fork_doc/` describen el estado real del fork.
7. El sync con el seed no pisa el trabajo beta del fork sin revisión humana.

## Invariantes que no se negocian

- `block.context === schema.data.name === data_file_name_without_json`
- `snake_case` en data, schemas y relaciones
- nada de rutas privadas expuestas al público
- nada de lógica de negocio del fork dentro del engine
- nada de copy-based sync para el engine

## Protocolo de sincronización

1. Partir de árbol limpio o commit previo.
2. Sincronizar engine por Git, nunca por copia de carpetas.
3. Validar encoding y storage después del merge.
4. Verificar que `agnostic.config.ts` y `src/lib/integrations/adapters.server.ts` sigan alineados.
5. Revisar cualquier cambio beta de adapters antes de publicar el fork.

## Riesgos que siguen existiendo

- El fork todavía puede tener costuras si alguien edita manualmente el registro de adapters.
- Los cambios de engine pueden reintroducir contratos viejos si se sincronizan sin revisar.
- La carga pública sigue dependiendo de que no se monten bundles de admin innecesarios en el camino crítico.

## Estado esperado

Cuando este plan quede satisfecho, el fork no se considera "perfecto". Se considera estable, publicable y listo para seguir iterando sin miedo a que el sync rompa la arquitectura.
