# Progress Index

This index is the curated entry point for project progress.

Agents should keep this file short. Link only active or still-useful documents.

## Active Context

- [current_state.md](current_state.md): current state of the fork.
- [ADR: catálogo estructural y publicación](../fork_doc/ADR_CATALOGO_ESTRUCTURAL_Y_RELEASE.md): autoridad de Git, Neon y Vercel; decisión de diseño, no pipeline ya implementado.
- [Runbook: catálogo estructural](../fork_doc/RUNBOOK_CATALOGO_ESTRUCTURAL.md): discovery, publicación y rollback procedimentales; controles técnicos pendientes se indican explícitamente.
- [Definition revisions runtime](../fork_doc/DEFINITION_REVISIONS_RUNTIME.md): contrato, controles y activación del catálogo estructural por revisión.

## Architecture Decisions

- [ADR_CATALOGO_ESTRUCTURAL_Y_RELEASE.md](../fork_doc/ADR_CATALOGO_ESTRUCTURAL_Y_RELEASE.md): Git como estado deseado del catálogo estructural; Neon como catálogo aplicado/runtime y datos operativos; Vercel como ejecutor de la revisión aprobada.
- [DEFINITION_REVISIONS_RUNTIME.md](../fork_doc/DEFINITION_REVISIONS_RUNTIME.md): contrato de revisión CAS, bloqueo de vault y verificación hash en runtime.

## Generated Snapshots

- `storage/docs/`: auto-regenerated architecture trees (`agno docs all`). Never hand-edit; not curated context.

## Active Plans

- [ESTRATEGIA_DATOS_LOCAL_VS_PROD.md](../fork_doc/ESTRATEGIA_DATOS_LOCAL_VS_PROD.md): estrategia local (`LocalStrategy` + mocks trazables via `seed_registros`, lote `webstore_r2`) vs producción (env vars del panel Netlify), con procedimiento de limpieza y checklist pre-push.
- [SESION_2026-07-02_HOME_SEO_EMBUDO/00_INDICE.md](../fork_doc/SESION_2026-07-02_HOME_SEO_EMBUDO/00_INDICE.md): carpeta de sesión temporal — planes ejecutables para reconstruir el Home (Luz & Biofilia), el embudo híbrido de leads y el JSON-LD/SEO técnico. Se elimina tras el cierre (ver `07_PROGRESO_Y_CIERRE.md` dentro de la carpeta).
- [PLAN_IMPLEMENTACION_ERP.md](../fork_doc/PLAN_IMPLEMENTACION_ERP.md): plan y lista de chequeo de cambios pendientes.
- [ERGONOMIA_COGNITIVA_CANVAS.md](../fork_doc/ERGONOMIA_COGNITIVA_CANVAS.md): análisis de ergonomía cognitiva de las interfaces tipo canvas.
- [DISENO_DETALLE_MODULO_PRODUCCION.md](../fork_doc/DISENO_DETALLE_MODULO_PRODUCCION.md): diseño de detalle de la Ficha Técnica Tabulada para el Taller.
- [DISENO_DETALLE_CANVAS.md](../fork_doc/DISENO_DETALLE_CANVAS.md): diseño de detalle y planos del Tablero Canvas en formato de Filas (Tree Schema).
- [MAPA_MODULOS_Y_AUXILIARES_ERP.md](../fork_doc/MAPA_MODULOS_Y_AUXILIARES_ERP.md): mapa y planos de integración de módulos auxiliares del ERP.
- [src/modules/INDEX.md](../../src/modules/INDEX.md): índice de módulos autocontenidos (inbox, payments, render) — todos en fase de diseño de contrato, investigación externa pendiente.

## Active Lanes

- [goal-catalog-authority-adr.md](lanes/goal-catalog-authority-adr.md): lane documental cerrada — decisión de autoridad del catálogo; no implementa pipeline ni modifica producción.
- [goal-neon-cotizaciones-recovery.md](lanes/goal-neon-cotizaciones-recovery.md): KEYSTONE — recuperación de datos huérfanos Neon (cotizaciones->proyectos) + caso Lorena Vaca (cobros + reconexión de espacio) + diagnóstico de `zap_activar_produccion`. Fases 0-3 cerradas y auditadas (2026-07-07); Fase 4 (limpieza de huérfanos) bloqueada, requiere aprobación aparte.
- [goal-cotizador-iva-opcional.md](lanes/goal-cotizador-iva-opcional.md): IVA opcional en cotizador (placeholder 19%). CERRADA (2026-07-07) — campos `aplica_iva`/`porcentaje_iva` en `proyectos`, cálculo con fallback en `CotizadorPro.tsx`. Hallazgo de gobernanza abierto: `add-field` no crea backup automático (ver el archivo).
- [goal-cotizador-obra-civil.md](lanes/goal-cotizador-obra-civil.md): estimado referencial de obra civil (mano de obra/logística/materiales) por espacio, catálogo opcional + valor bruto manual, aislado del total vinculante del contrato. `Estado: plan_borrador`, Fase 1 completa, lista para aprobación.

## Active Audits

- [AUDITORIA_ADAPTERS_IA_2026-07-06.md](AUDITORIA_ADAPTERS_IA_2026-07-06.md): Auditoría exhaustiva y mapa de referencias para la extracción de los 4 adapters de IA y conversiones.
- [CRUCE_SCHEMAS_ZAPS_ENTROPIA.md](../fork_doc/CRUCE_SCHEMAS_ZAPS_ENTROPIA.md): auditoría de cruce axiomático de elementos interactivos contra schemas, zaps y rutas.
- [AUDITORIA_RENDIMIENTO_CARGA.md](AUDITORIA_RENDIMIENTO_CARGA.md): dos hallazgos confirmados en código (layout raíz monta auth/admin en toda ruta; `getVaultData` se lee hasta 3 veces por request) + pre-plan de fix, sin tocar código todavía.

## Archived Notes

None.
