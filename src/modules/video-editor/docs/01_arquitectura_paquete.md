# Arquitectura del paquete — camino de crecimiento

## Decisión

Editor de video automatizado: recibe clips crudos, los clasifica (workflow sobre el LLM adapter — ver `02_contrato_universal_video.md`), y los compone en un video editado con ritmo musical (capability provista vía HTTP por el proyecto satélite `estudio_multimedia`, anteriormente implementada en el adapter local `shotstack-composer`). Nace en `empresa_muebles_clone` por el mismo motivo que `inbox`, `payments-checkout` y `render-studio`: es donde hay un uso real confirmado (más de un repo, según lo discutido en diseño), y se construye aquí hasta probarlo antes de considerar promoverlo.

## Capability genérica, no atada a un fork

Este módulo, igual que `render-studio`, no tiene absolutamente nada de negocio específico en su contrato — un editor de video automático sirve para cualquier fork con footage crudo (catálogo de muebles, contenido de otro proyecto, lo que sea). Lo único específico de cada fork es el workflow (reglas de corte, criterio de clasificación) y el uso que se le da — no el adapter.

## Camino de tres pasos (mismo que los otros tres módulos)

1. **Ahora — construir aquí.** `src/modules/video-editor/` autocontenido, delegando la composición vía HTTP al proyecto satélite `estudio_multimedia` e importando de `src/adapters/llm/`.
2. **Cuando el contrato esté probado** (funcionando con al menos un caso real de clasificación + composición), promover a `packages/video-editor/` en el seed.
3. **Distribución vía `scripts/admin/sync-workspaces.ps1`.**

## Relación con `render-studio`

Son capabilities hermanas ("creativa/medios"), no una dependencia obligatoria de la otra. Un workflow transversal de un fork puede encadenarlas (render genera fotos fijas → video-editor las compone en un video), pero ninguno de los dos macro módulos importa código del otro — esa orquestación vive en las rutas del fork (`src/app/api/cron/...`), no aquí.
