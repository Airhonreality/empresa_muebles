# UI — pendiente

La herramienta de renderizado (subir plano + foto del espacio, elegir workflow, ver resultado) se escribe cuando exista el adapter real en [`../../../adapters/runpod-comfyui/`](../../../adapters/runpod-comfyui/INDEX.md) y al menos un workflow probado en `../workflows/`. No hay UI especulativa aqui todavia.

Cuando se escriba, sigue el patron de registro en `agnostic.config.ts` (`blocks: { render_studio: () => import('./src/modules/render-studio/ui/RenderStudio') }`).
