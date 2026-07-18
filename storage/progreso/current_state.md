# Current State

## Snapshot operativo vigente — 2026-07-17

### Autoridad del catálogo (contrato arquitectónico)

- **Decisión de catálogo:** Git/`main` es el estado deseado de `page_routes`,
  `schema_definitions` y `scripts`; Neon es la proyección aplicada que usa producción;
  Vercel debe ejecutar una revisión aplicada. Ver
  [`ADR_CATALOGO_ESTRUCTURAL_Y_RELEASE.md`](../fork_doc/ADR_CATALOGO_ESTRUCTURAL_Y_RELEASE.md).
- **Estado de implementación:** decisión y runbook documentados; migración idempotente,
  registro de revisión/checksum, CI de reconciliación, guardas del diseñador y promoción
  verificable todavía **no están implementados**.
- **Regla vigente:** no se autoriza escritura directa del catálogo activo de producción ni
  deploy manual al alias productivo. Es un contrato operativo; no afirmar que esté bloqueado
  técnicamente hasta que una lane lo evidencie.
- **Siguiente trigger:** antes de cualquier sincronización o cambio remoto, ejecutar
  discovery para identificar el provider/deployment efectivo, estrategia de storage y
  diferencias Git–Neon–producción. Si falta evidencia o aprobación humana para producción,
  el trabajo queda BLOQUEADO.
- **Memoria:** este bloque es el estado de arranque. Los cierres históricos siguientes se
  conservan como evidencia, no son instrucciones vigentes sin validación contra el snapshot.

### Runtime de revisiones (implementación)

- Implementados export read-only, bundle con hash, publicador inmutable con CAS, `DefinitionReader`
  y bloqueo de escritura estructural directa de Vault en modo `revision`.
- La activación real permanece pendiente de gate humano: migración autorizada en Neon, publicación
  de primera revisión y variables de Vercel. Hasta entonces `AGNOSTIC_DEFINITION_MODE` se mantiene
  en `legacy`.
- Ver [DEFINITION_REVISIONS_RUNTIME.md](../fork_doc/DEFINITION_REVISIONS_RUNTIME.md). La unidad de
  publicación es siempre `schemas + routes + zaps`; nunca se sincronizan colecciones por separado.

## Summary

This repository is the Agnostic Seed baseline for forked projects.

The working model is:

```text
seed repo -> project forks
engine -> domain-blind
fork -> owns storage and specialized UI
```

## Daily Closeout


Date: 2026-07-14 (PM) — Lane obra civil CERRADA + auditoría contrato

**CIERRE: `goal/cotizador-obra-civil-estimada` mergeada a `dev` (commit `bd22330`)**
- Fases 1-4 completas: schema `items_obra_civil` (9 campos, opcional catálogo), UI (3 categorías 
  en EspacioCard, modo catálogo + manual), PDF (sección referencial + descargo legal).
- Bug detectado/fixeado: `agnostic-schemas.ts` commitado en `725a05c`.
- Matriz V1-V9 auditada: todas verificaciones verdes.
- Worktree aislado limpiado.

**Auditoría en paralelo — cambios flujo contrato (rama `goal/webstore-checkout-pagos`):**
Centralización `visible_pdf !== false` en ContratoModal, generar_contrato, zap_activar_produccion.
Commits `471490d`, `8369306` con tests propios. Verificados funcionalmente pero **fuera de proceso** 
(modificaron superficie "prohibida" de la lane de obra civil). Documentado como desviación, no revertido.

---

## Daily Closeout

Date: 2026-07-06

**Ronda 2 WEB-STORE — 4 de 7 lanes cerradas + incidente git recuperado.**

Incidente (mediodía): dos rondas de agentes en paralelo sobre el mismo `.git` + `worktree
remove` abortado por rutas largas + watcher GitKraken → se perdió `.git/objects` (historia
local 07-02→07-06). CONTENIDO recuperado íntegro: trasplante de `.git` desde
`Airhonreality/empresa_muebles`, commit de recuperación `f96092b` pusheado. Detalle y reglas
nuevas: `INCIDENTE_GIT_2026-07-06.md` (push obligatorio al cierre de lane, git ops
serializadas, longpaths, sin GUI git durante agentes). Respaldo completo en
`../RESCATE_empresa_muebles_2026-07-06/`.

Lanes cerradas e integradas en `dev` (todas auditadas, dev pusheado):
- `webstore-data-mocks`: `ESTRATEGIA_DATOS_LOCAL_VS_PROD.md` (local=JSON+mocks trazables,
  prod=Neon por env vars Netlify), schema `seed_registros` (lote `webstore_r2`).
- `webstore-producto-compositor`: prefabricados extendidos (publicado_web, precio_publico,
  slug...), zap `recalcular_precio_prefabricado`, tab "Módulos y Productos" en CatalogoManager.
- `webstore-portfolio-publico`: schemas `portfolio_publico`/`imagenes_portfolio`, campo
  `barrio` en proyectos, form ERP `/app/erp/portfolio`, página pública `/portafolio` con
  overlay "ver más" sin precios.
- `webstore-tienda-ui` (+ `webstore-tienda-completar`): `/tienda` y `/tienda/:slug`,
  carrito localStorage con CTA WhatsApp y ancla `data-checkout-slot`, nav actualizada,
  5 productos publicados. **Smoke 4/4: /, /tienda, /tienda/:slug, /portafolio → 200.**

En progreso: `webstore-clientes` — WIP commiteado y pusheado en su rama (zap
`consultar_portal_cliente` + `register/route.ts` + `VetaCuenta` + `ClienteAccesoWeb`
escritos, DoD SIN verificar; falta ruta `/cuenta`, registro de bloques, user mock, seeds,
matriz). Continúa un worker EXTERNO (modo sin subagentes por presupuesto de tokens; el
Orquestador Fable 5 solo audita/mergea/pushea y entrega prompts).

Pendientes de la ronda: `webstore-checkout-pagos`, `webstore-seo-lanzamiento` (LANE
RE-PLANIFICADA 2026-07-07 — alcance expandido: eliminar `/tienda`, migrar carrito a
`/colecciones`, fix VetaPortfolio POST→GET, fix Wompi validación prefabricados, + SEO).
Hallazgos abiertos: deuda tsc 21 errores (7 de componentes tienda → lane `ts-debt`), `cobro.json` sin destino, re-run `ai_config`,
limpieza de worktrees/ramas huérfanos del incidente.

### Hallazgos estructurales detectados 2026-07-07 (pre-lane)
- **Ruta corrupta:** `page_routes.json` contiene `"C:/Program Files/Git/tienda"` como path (línea 372-382) — basura config.
- **VetaPortfolio.tsx error:** `readRecords()` usa `POST /api/vault` con `action: 'READ'` no soportado (solo GET). Causa error 400 en `/portafolio`.
- **Wompi checkout bug:** `checkout/route.ts` solo valida items contra `productos_catalogo`, ignora `prefabricados` → 400 error si el carrito contiene prefabs.
- **Duplicación catálogo:** `/colecciones` y `/tienda` comparten datos de `productos_catalogo`. Decisión del usuario: eliminar `/tienda`, dejar `/colecciones` como ruta canónica.
- **schemaGenerator.ts** completo pero no integrado con `generateMetadata` de ninguna página.

---

## Daily Closeout

Date: 2026-07-05

**Ronda 1 de orquestación multiagente (Fable-5) — COMPLETA.** Modelo de trabajo en
`storage/progreso/ORQUESTACION.md` (2 ejes, 3 roles, DoD commit-por-goal, tablero de lanes
con triggers, bucle maestro). Contrato de concurrencia/ramas en `storage/AGENTS.md`.

Saneamiento y homeostasis:
- **Encoding:** reparada mojibake que bloqueaba todos los commits (origen migración/sync,
  no escritura). Lane-0 `goal/encoding-homeostasis` (`16c14eb`). Guarda M1 en `.githooks/pre-push`.
- **Adapters:** 7 implementaciones respaldadas e integradas; lane con su propio orquestador, aprobada.

Lanes ERP cerradas e integradas en `dev` (todas auditadas por el Orquestador):
- `goal/erp-comercial-state` (`ca6f7b4`): canon de `proyectos.estado` en snake_case (activa,
  enviada, en_contrato, pre_produccion, produccion, entregado, perdida, cancelada) + `MATRIZ_ESTADOS.md`.
- `goal/design-system-tokens` (`9e7e596`): marca canónica consolidada en `storage/styles/tokens.css`
  (capa fork) + `MANUAL_MARCA_TOKENS.md`.
- `goal/erp-lifecycle-zaps` (`6ffc63a`): `zap_validar_transicion_estado` cableado en kanban y zaps.
- `goal/erp-finanzas-ux` (`08ae9d3`): FinanzasShell = KPI strip + colecciones; style jsx → tokens.

Herramienta nueva: `scripts/lane-qa.mjs` — QA mecánico de superficie (paso 2 Fable-5), caza
scope creep automáticamente vía la marca `<!-- lane-surface: ... -->` de cada contrato.

Hallazgos abiertos → próxima ronda: `db/` raíz duplica `storage/db/`; `storage/db/` fuera del
whitelist de `.gitignore`; terminar `goal/erp-ai-config-schema` (checkpoint `e3ad372`).

**Siguiente estancia (nuevo chat Fable-5): WEB-STORE.** Abrir una nueva serie de lanes para la
tienda web bajo el mismo modelo (ORQUESTACION.md). Contratos en `storage/progreso/lanes/`,
QA con `lane-qa.mjs`, integración `--no-ff` a `dev` tras auditoría.

---

## Daily Closeout

Date: 2026-07-03

Work completed today:

- Se completó la generación de los planes de adapters en `src/adapters/*/INDEX.md`.
- Se ejecutó el pase mecánico de QA sobre los objetivos en `plan_borrador`.
- Se aprobaron para implementación los adapters que pasaron el QA estructural:
  - `llm`
  - `whatsapp`
  - `wompi`
  - `meta`
  - `tiktok`
  - `runpod-comfyui`
  - `shotstack-composer`
- Se dejaron fuera de esta primera ola los objetivos que requieren ajuste manual antes de poder pasar a implementación:
  - `gmail`
  - `meta-conversions-api`
  - `google-ads-conversions`
- Se acordó que la segunda ola cubrirá esas tareas manuales, y que después de eso se continuará con el resto del flujo de aprobación e implementación adapter por adapter.
- Hardened text encoding validation and the fork sync flow in the seed.
- Synced the engine into the active forks:
  - `empresa_muebles_clone`
  - `HUG_WORKS`
  - `Airhon_web_site`
- Left `nomon_clone` synced locally but blocked on publish because its `origin` remote points to a missing repository.
- Confirmed the repository ignores the top-level `/progreso/` path in Git.
- Confirmed `storage/progreso/` is intentionally tracked because the harness uses it as live project context.
- Kept fork-specific progress separate from engine code paths and avoided changing fork business logic while syncing the engine.
- Closed a half-finished migration: generated architecture snapshots (`agno docs all`) now live under `storage/docs/`, not `storage/progreso/`. Removed the 5 stale duplicate `.md` files left behind in `storage/progreso/` and realigned `Comandos CLI.md`, `storage/AGENTS.md`, and root `CLAUDE.md` to the new path.
- Documented the `cli-reporter.ts` / `storage-repository.ts` primitives as the required pattern for new `agno.ts` commands, and formalized the existing `plan -> dry -> confirm -> backup` mutation cycle (used by `refactor-schema`) as the required pattern for any future command that mutates `storage/` or `agnostic.config.ts`.
- Built the adapter subsystem: `AdapterManifest` type (`packages/core/src/adapter.ts`), `notion` retrofitted with a reference `manifest.ts`, `src/lib/integrations/adapters.server.ts` rewritten from a hardcoded per-id switch to a declarative `REGISTRY` maintained by the CLI, and three governed commands (`list-adapters`, `install`, `remove-adapter`) in `scripts/agno-adapters.ts` with a collision resolver ("risky siblings": already-installed, env-key collisions, missing required schemas, unset env vars) and a hard rule rejecting adapters that claim network access without `runsOutsideSandbox: true`. Verified with a full remove/install round-trip (byte-identical `adapters.server.ts`, cosmetic-only line-ending diff in `agnostic.config.ts`) and a clean `tsc --noEmit`. Also fixed a pre-existing bug where `IntegrationsSection.tsx` posted the wrong payload shape to `/api/admin/config/save`, and excluded `storage/progreso/backups/` from `tsconfig.json` (backups of `agnostic.config.ts` were being type-checked as if they lived at the repo root).

## Current Contract

- No runtime multi-tenant selector.
- Local JSON data lives in `storage/db/`.
- Schemas are defined in `storage/db/schema_definitions.json`.
- Routes are defined in `storage/db/page_routes.json`.
- Zaps are records in `storage/db/scripts.json`.
- `system_groups` is an optional metadata namespace for organizing routes, schemas, and scripts by subsystem.
- Project progress and audits live under `storage/progreso/`.
- Fork documentation lives under `storage/fork_doc/`.
- Agent-facing generated docs (auto-regenerated architecture snapshots) live under `storage/docs/`.
- The top-level `/progreso/` path is ignored by Git and is not part of the tracked seed context.
- `storage/progreso/` remains tracked on purpose so the fork harness stays available.

## Completed Milestones

- `ComercialKanban.tsx` renders the interactive sales canvas.
- `ComercialKanban.tsx` now defaults to state tabs, with tree view as fallback.
- `ProjectDetails.tsx` provides the production dialog with sheets-style tables and manual stock entry.
- `WidgetArmadoOrdenCompra.tsx` consolidates supply orders by supplier or by project.
- Phase 2 commercial integration is implemented: literal pass-to-production button, intermediate modal, and manual confirmation in Comercial and Cotizador.
- Phase 3 operational calendar is implemented: route `/app/erp/calendar`, `calendar_scheduler`, department filter, and agenda / weekly / daily views.
- Specialized fork modules now exist for:
  - `equipo_directory`
  - `proveedores_directory`
  - `user_profile`
  - `catalogo_manager`
- `system_groups` is now a real fork schema and the designer can create, edit, and group routes, schemas, and scripts by `system_group`.
- `FinanzasShell.tsx` now includes `ConciliacionBancaria` for movement vs obligation reconciliation.
- Session `2026-07-02_HOME_SEO_EMBUDO` implemented: `testimonios` schema, expanded `leads` fields, real NAP records in `configuracion_comercial`, and zaps `capturar_lead_embudo` / `actualizar_score_lead`.
- Home public (`VetaHome.tsx`) migrated to Luz & Biofilia with a reusable hybrid embudo modal, testimonial section, and light header/footer treatment.
- Home assets now resolve from local mock portfolio records when `espacio_variantes` is absent, so the page stays functional under local JSON strategy.
- SEO technical layer added through fork-owned JSON-LD helpers with `Organization` in the layout and `LocalBusiness` / `WebSite` on the Home.
- Typography tokens now default to `Futura BT` across `globals.css`, `storage/styles/tokens.css`, and the design-token editor.
- ERP navigation is canonized under `/app/erp/*` for comercial, cotizador, taller, finanzas, calendar, equipo, proveedores, catalogo, and perfil.
- Development now defaults to `LocalStrategy` unless `AGNOSTIC_STORAGE_STRATEGY` explicitly forces `postgres`, `github`, or `supabase`.
- Backend phase 1 is validated: `zap_activar_produccion` passes `validate:zaps`, and `reimprimir_snapshot` now reads from `proyectos` instead of a missing snapshot namespace.

## Pending Next Session

- Start the next implementation wave only for the approved adapters from QA.
- Handle the manual prerequisite tasks for `gmail`, `meta-conversions-api`, and `google-ads-conversions` in a second wave before re-entering implementation.
- Keep the approval flow adapter-by-adapter so each `plan_aprobado` can move cleanly into the next prompt of implementation.
- Improve the commercial kanban visual language so it matches the production kanban family more closely.
- Keep `system_groups` fork-owned and use it only as metadata for grouping in the designer.
- Legacy non-ERP paths were removed from the active route tree so the nav is the primary way into ERP modules.
- Keep the fork context clean and avoid reloading the old financial refactor discussion unless it is directly needed.

## Notes

- The old financial refactor discussion has been removed from this state file so it does not contaminate the next session.
- The current fork now has a cleaner module baseline and the next work should focus on the production transition flow.
- The calendar phase now uses a fork-owned wrapper over the operative task data, with a route and navigation entry in place.
- Remaining `validate:zaps` warnings are inherited aliases in older scripts (`cotizacion_id`, `producto_id`, `cuenta_id`) and nonstandard `body`-stored zaps; they do not block the phase 1 backend path.
- The commercial-to-production transition is now explicit and manual; the contract signature still does not auto-activate production.
- The designer grouping model now lives in fork storage through `system_groups`; it is not an engine rule.
