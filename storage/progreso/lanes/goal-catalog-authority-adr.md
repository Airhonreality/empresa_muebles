# Contrato de lane: goal/catalog-authority-adr

## Identidad

- Rama: no creada — cambio documental solicitado en el workspace actual.
- Worktree: no aplica — ejecución secuencial, sin concurrencia.
- Rol/modelo: worker documental.
- Estado: EN_REVISION.
- Solicitante/orquestador: usuario / orquestador de la ronda de alineación total.
- Ejecutor: worker documental delegado; no autoriza cambios de arquitectura, datos ni producción.

## Entradas versionadas

- `main` y estado del fork inspeccionados el 2026-07-17 antes de la ADR; la revisión exacta debe fijarse en la rama aislada de integración, porque esta corrección no crea rama, commit ni tag.
- [ADR_CATALOGO_ESTRUCTURAL_Y_RELEASE.md](../../fork_doc/ADR_CATALOGO_ESTRUCTURAL_Y_RELEASE.md): decisión de diseño que esta lane debe hacer recuperable en el arnés.
- `storage/AGENTS.md`, `storage/progreso/ORQUESTACION.md` y `storage/progreso/current_state.md`: contratos vigentes que condicionan la redacción y futura auditoría.

## Goal

Dejar una decisión arquitectónica verificable que separe el estado deseado del catálogo estructural, su estado aplicado de runtime y los datos operativos, sin implementar el pipeline que la hará cumplir.

## Tipo de cambio

Documentación de arquitectura y gobernanza.

## Superficie (y SOLO esta)

`storage/fork_doc/ADR_CATALOGO_ESTRUCTURAL_Y_RELEASE.md`, runbook de publicación,
`storage/progreso/INDEX.md`, `storage/AGENTS.md`,
`storage/progreso/ORQUESTACION.md`, `storage/progreso/current_state.md` y este contrato.

<!-- lane-surface: storage/fork_doc/ADR_CATALOGO_ESTRUCTURAL_Y_RELEASE.md | storage/fork_doc/RUNBOOK_CATALOGO_ESTRUCTURAL.md | storage/progreso/INDEX.md | storage/AGENTS.md | storage/progreso/ORQUESTACION.md | storage/progreso/current_state.md | storage/progreso/lanes/goal-catalog-authority-adr.md -->

## Fuera de alcance

- Código, datos locales o remotos, configuración de Vercel/Neon, variables de entorno, migraciones, CI y despliegues.
- Implementación del pipeline, del runbook operativo o del límite de publicación del diseñador durante esta corrección documental.

## Dependencias y bloqueos

- Depende de: decisión humana de adoptar la arquitectura documentada.
- Bloquea: observabilidad de catálogo, migración idempotente, gobernanza de despliegue y publicación del diseñador. Cada una requiere contrato y aprobación propios.

## Riesgo y permisos

- Riesgo: medio; la superficie prevista modifica el arnés contextual y puede condicionar futuras operaciones, aunque no cambia estado de aplicación.
- Permisos usados en esta corrección: escritura local solo sobre este contrato.
- Permisos previstos por la lane: escritura local limitada a la superficie declarada, con auditoría independiente antes de integrar cambios de arnés.
- Permisos no usados: escritura remota, deploy y operaciones Git estructurales o irreversibles.

## DAG y Definition of Done

1. Redactar ADR de autoridad, flujo, exclusiones, rollback y consecuencias.
   - DoD: el archivo existe en `storage/fork_doc/` y declara explícitamente Git, Neon y Vercel con sus responsabilidades.
2. Preparar el runbook y las reglas del arnés dentro de la superficie declarada, sin implementar pipeline.
   - DoD: cada documento distingue la decisión de diseño de una operación efectivamente realizada y contiene gates humanos para datos reales, producción y cambios de arnés.
3. Hacer recuperable la decisión desde el índice curado y el estado actual.
   - DoD: `storage/progreso/INDEX.md` y `storage/progreso/current_state.md` apuntan a la ADR, el runbook y la siguiente lane bloqueada.
4. Auditoría e integración durable.
   - DoD: auditor independiente emite veredicto conforme; los cambios viven en una rama aislada, con commit y push antes de marcar la lane como cerrada.

## Checkpoint humano

La ADR documenta una decisión aprobada para diseño. Antes de ejecutar una lane que escriba en Neon, configure CI/Vercel o despliegue producción, se requiere aprobación explícita del usuario para esa operación. Cualquier mutación de `storage/AGENTS.md` u `ORQUESTACION.md` requiere además auditoría independiente antes de la integración.

## Handoff, expiración y reintento

- Handoff: el siguiente worker comienza leyendo este contrato, la ADR, el runbook cuando exista, `storage/AGENTS.md`, `storage/progreso/ORQUESTACION.md` y `storage/progreso/current_state.md`; después fija el commit de `main` en una rama aislada antes de editar la superficie restante.
- Expiración: esta lane no puede cerrarse con la evidencia actual. Expira si `main`, las reglas del arnés o la ADR cambian antes de su integración; el orquestador debe revalidar entradas, superficie y DoD.
- Reintento: crear una nueva ejecución en worktree y rama `goal/catalog-authority-adr`, actualizar las entradas a la revisión real, completar los documentos pendientes, ejecutar QA, obtener auditoría independiente, commit y push. No aplica reintento remoto: esta lane no tiene operaciones remotas autorizadas.

## Evidencia de cierre

- Evidencia disponible: ADR creada, este contrato actualizado e índice enlazado; queda pendiente el resto de la superficie declarada.
- Validación disponible: inspección de superficie declarada, enlaces relativos y codificación UTF-8 sin BOM mediante las verificaciones del repositorio.
- Auditoría: pendiente; esta corrección responde a su hallazgo y no sustituye el veredicto independiente.
- Commit/push: pendientes. El cierre durable queda bloqueado hasta integrar en rama aislada, crear commit y hacer push; esta corrección no ejecuta esas operaciones.
- Rollback: mientras no haya integración, revertir únicamente cambios documentales locales mediante una futura operación Git aprobada; no existe estado remoto que revertir.

## Veredicto de auditoría documental

**PENDIENTE.** La lane documenta la autoridad del catálogo y sus guardas, pero aún no tiene auditoría independiente, rama aislada, commit ni push. No afirma la existencia ni ejecuta una migración, CI, cambio de estrategia o deploy.
