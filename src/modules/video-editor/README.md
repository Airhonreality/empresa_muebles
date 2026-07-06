# Módulo: Video Editor

Edición automática de video: clasifica clips crudos (workflow sobre el LLM adapter existente) y los compone en un video con ritmo musical. La capability técnica de composición (anteriormente implementada localmente en el adapter `shotstack-composer`) ha sido extraída y se provee vía HTTP delegando al proyecto satélite `estudio_multimedia`. Capability genérica — no depende de `render-studio` ni está atada a ningún fork específico, aunque las verticales que la usen (Vetadorada, u otra) se orquestan por fuera, en workflows transversales de cada fork.

## Por qué vive en `src/modules/` y no en `storage/`

Mismo razonamiento que los otros tres módulos hermanos (`inbox`, `payments-checkout`, `render-studio`).

## Cómo retomar el trabajo

Empieza por `INDEX.md` en esta misma carpeta.
