# UI — pendiente

La interfaz del editor (subir clips crudos + pista de audio, ver el video compuesto) se escribe cuando exista el adapter real en `../../../adapters/shotstack-composer/` y al menos un workflow probado en `../workflows/`. No hay UI especulativa aquí todavía.

Cuando se escriba, sigue el patrón de registro en `agnostic.config.ts` (`blocks: { video_editor: () => import('./src/modules/video-editor/ui/VideoEditorStudio') }`).
