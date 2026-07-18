# Runbook: catálogo estructural

**Estado:** procedimiento objetivo. Describe el flujo autorizado por la ADR; no prueba que
los controles técnicos, CI o bloqueos de API ya estén implementados.

## Propósito y alcance

Aplica a `page_routes`, `schema_definitions` y `scripts`. La autoridad está definida en la
[ADR de catálogo estructural y publicación](ADR_CATALOGO_ESTRUCTURAL_Y_RELEASE.md): Git
expresa el estado deseado, Neon conserva el catálogo aplicado que usa producción y Vercel
ejecuta una revisión ya aplicada. No cubre datos operativos, secretos ni archivos binarios.

## 1. Discovery antes de un cambio

1. Abrir una lane con superficie, dependencias, permisos, rollback y DoD verificable.
2. Registrar la revisión de `main` candidata y obtener el estado efectivo de producción:
   proveedor de deploy, identificador del deployment, estrategia de storage y revisión del
   catálogo aplicado. Si alguno es desconocido, detenerse y marcar la lane **BLOQUEADA**.
3. Comparar manifiestos Git, catálogo aplicado y rutas observables. Clasificar diferencias
   como deseada, legacy o conflicto; no copiar registros a ciegas.
4. Tomar y conservar un snapshot recuperable de los namespaces afectados antes de toda
   escritura. Para un registro existente, leer el objeto completo, combinar el cambio y
   preservar metadatos requeridos; nunca enviar un payload parcial.
5. Obtener gate humano antes de cualquier escritura de producción, cambio de despliegue,
   cambio de secreto o aceptación de una excepción.

## 2. Preparación y validación

1. El cambio estructural se diseña en una rama y entra mediante revisión a `main`.
2. Validar encoding, integridad de storage, invariantes de contextos, rutas únicas,
   referencias schema–bloque y compatibilidad con las rutas que se prueban.
3. Crear una revisión identificable: commit de Git, checksum de manifiestos y resultado
   esperado. La futura migración debe ser idempotente y conservar IDs estables.
4. Validar primero en staging o una copia recuperable. Un worker liviano puede ejecutar
   verificaciones mecánicas, pero no decidir conflictos ni escribir producción.
5. Auditor independiente contrasta contrato, diff, snapshot y evidencia. Si falta una
   precondición, el estado es **BLOQUEADA**; si hay excepción aceptada, es
   **CERRADA_CON_DEUDA_ACEPTADA**, no conforme.

## 3. Publicación autorizada (objetivo)

1. Tras merge a `main`, aplicar exactamente la revisión aprobada al catálogo de Neon y
   registrar commit, checksum, fecha, resultado y referencia al snapshot.
2. Verificar que el catálogo aplicado coincide con el commit/checksum esperado.
3. Promover únicamente el deployment de `main` compatible con esa revisión. Un deployment
   manual local sirve solo como preview y no recibe el alias productivo.
4. Ejecutar smoke tests de rutas públicas y autenticadas definidos por la lane. Registrar
   resultados y la revisión visible para administradores.

Este flujo es la meta arquitectónica. Hasta implementar sus migraciones, CI y guardas, cada
paso de producción exige verificación humana explícita; no asumir automatización existente.

## 4. Rollback seguro

1. Declarar incidente y detener nuevas publicaciones estructurales.
2. Identificar la última revisión aprobada compatible y su snapshot; no editar el catálogo
   activo manualmente para “arreglar rápido”.
3. Preparar una migración explícita hacia esa revisión y someterla al mismo gate humano,
   auditoría y validación de compatibilidad.
4. Aplicar la revisión anterior, verificar coincidencia de checksum y promover el commit de
   aplicación compatible.
5. Registrar causa, alcance, evidencia y lane correctiva. El snapshot no es licencia para
   restaurar datos operativos no relacionados.

## 5. Evidencia mínima de cierre

- Commit y checksum del catálogo deseado.
- Identificador y resultado de la revisión aplicada.
- Referencia al snapshot previo.
- Evidencia de auditoría independiente y gate humano cuando corresponda.
- Resultado de smoke tests y deployment promovido.
- Si hay deuda: riesgo, dueño, vencimiento y lane de remediación.
