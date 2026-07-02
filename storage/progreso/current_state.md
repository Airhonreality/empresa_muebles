# Current State

## Summary

This repository is the Agnostic Seed baseline for forked projects.

The working model is:

```text
seed repo -> project forks
engine -> domain-blind
fork -> owns storage and specialized UI
```

## Current Contract

- No runtime multi-tenant selector.
- Local JSON data lives in `storage/db/`.
- Schemas are defined in `storage/db/schema_definitions.json`.
- Routes are defined in `storage/db/page_routes.json`.
- Zaps are records in `storage/db/scripts.json`.
- Project progress and audits live under `storage/progreso/`.
- Fork documentation lives under `storage/fork_doc/`.
- Agent-facing generated docs live under `storage/progreso/`.

## Completed Milestones

- `ComercialKanban.tsx` renders the interactive sales canvas.
- `ProjectDetails.tsx` provides the production dialog with sheets-style tables and manual stock entry.
- `WidgetArmadoOrdenCompra.tsx` consolidates supply orders by supplier or by project.
- Specialized fork modules now exist for:
  - `equipo_directory`
  - `proveedores_directory`
  - `user_profile`
  - `catalogo_manager`
- `FinanzasShell.tsx` now includes `ConciliacionBancaria` for movement vs obligation reconciliation.
- `/app/catalog` now uses the custom `catalogo_manager` block.
- Backend phase 1 is validated: `zap_activar_produccion` passes `validate:zaps`, and `reimprimir_snapshot` now reads from `proyectos` instead of a missing snapshot namespace.

## Pending Next Session

- Add a literal "Pasar a produccion" button in `ComercialKanban` and `CotizadorPro`.
- Add an intermediate modal before moving a project to production.
- Gate the button on contract availability, but keep the production step as an explicit user action; contract signature alone does not activate production.
- Improve the commercial kanban visual language so it matches the production kanban family more closely.
- Test a commercial kanban layout split into tabs by status instead of a vertical tree.
- Reuse the engine-provided calendar scheduler instead of creating a fork-only calendar subsystem unless a real gap appears.
- Keep the fork context clean and avoid reloading the old financial refactor discussion unless it is directly needed.

## Notes

- The old financial refactor discussion has been removed from this state file so it does not contaminate the next session.
- The current fork now has a cleaner module baseline and the next work should focus on the production transition flow.
- The engine update already provides a default calendar scheduler, so the fork should prefer wiring that in before proposing custom calendar UI.
- Remaining `validate:zaps` warnings are inherited aliases in older scripts (`cotizacion_id`, `producto_id`, `cuenta_id`) and nonstandard `body`-stored zaps; they do not block the phase 1 backend path.
