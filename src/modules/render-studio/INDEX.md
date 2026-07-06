# Render Studio — Module Index

Producto: herramienta de renderizado, con capability provista vía HTTP por el proyecto satélite `estudio_multimedia` (anteriormente implementada localmente en el adapter `runpod-comfyui`).

## Estado

**Fase: diseño del contrato, investigación de hosting/técnica pendiente. Capability delegada vía HTTP.**

## Qué existe

- [README.md](README.md) — qué es este módulo y de dónde se traduce.
- [docs/01_arquitectura_paquete.md](docs/01_arquitectura_paquete.md) — camino de crecimiento + deslinde explícito del proyecto de origen de la idea.
- [docs/02_contrato_universal_render.md](docs/02_contrato_universal_render.md) — la distinción central: adapter (puente a ComfyUI) vs workflow (JSON de configuración).
- [`../../adapters/_contracts/render-adapter.ts`](../../adapters/_contracts/render-adapter.ts) — `RenderAdapter`.
- *(Nota: el adapter local runpod-comfyui ha sido extraído; la capability se provee vía HTTP por el proyecto satélite estudio_multimedia)*
- `workflows/` — donde viven los JSON de ControlNet/LoRA/IP-Adapter, vacío hasta la investigación.
- `ui/` — vacío hasta que exista adapter + workflow real.

## Próxima acción concreta

1. Integrar mediante llamadas HTTP al servicio expuesto en el satélite `estudio_multimedia`.
2. Crear el primer workflow real en `workflows/` (probablemente el de ControlNet Depth + IP-Adapter, el caso más exigente).
3. Para el uso proactivo (generación programada, ej. publicación semanal), ver el patrón de cron en [`../inbox/docs/05_orquestacion_automatizacion.md`](../inbox/docs/05_orquestacion_automatizacion.md) — aplica igual aquí, solo cambia qué adapter se llama.

## Fuera de alcance por ahora

- Lógica de negocio de generación de contenido/personaje simulado (proyecto de origen de la idea) — deliberadamente no se trae, ver `docs/01_arquitectura_paquete.md`.
- Publicación npm / promoción a `packages/` del seed — no hasta el contrato probado con 2+ workflows.
- UI (`ui/RenderStudio.tsx`) — depende de tener adapter + workflow real.
- Ampliar `AdapterManifest.kind` en el seed con `'visual-generation'` — cambio del seed, no de este fork.
