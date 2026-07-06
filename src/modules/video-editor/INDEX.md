# Video Editor — Module Index

## Estado

**Fase: investigación cerrada. Capability delegada vía HTTP.** La composición de video se realiza delegando mediante llamadas HTTP al proyecto satélite `estudio_multimedia` (el adapter local `shotstack-composer` fue extraído).

**Decisión pendiente de este módulo (no del adapter):** dónde viven detección de escenas (Rendi.dev / FFmpeg `select` vía FaaS) y BPM (cliente, Web Audio API) — la investigación las resuelve técnicamente, pero su lugar (workflow del módulo vs contrato nuevo) se decide al planificar este módulo.

## Qué existe

- [README.md](README.md) — qué es este módulo.
- [docs/01_arquitectura_paquete.md](docs/01_arquitectura_paquete.md) — camino de crecimiento + relación con `render-studio` (hermanos, no dependientes).
- [docs/02_contrato_universal_video.md](docs/02_contrato_universal_video.md) — la distinción central: clasificación = workflow sobre el LLM adapter existente, composición = delegación externa vía HTTP.
- `../../adapters/_contracts/video-composer-adapter.ts` — `VideoComposerAdapter`. Borrador, tipa limpio.
- *(Nota: el adapter local shotstack-composer ha sido extraído; la capability se provee vía HTTP por el proyecto satélite estudio_multimedia)*
- `../../adapters/llm/` — reusado para el workflow de clasificación, sin implementación propia en este fork todavía.
- `workflows/` — vacío hasta la investigación.
- `ui/` — vacío hasta tener adapter + workflow real.

## Próxima acción concreta

1. ~~Investigación~~ — hecha (2026-07-03, `video_2026.md`).
2. Integrar la composición de video mediante llamadas HTTP al servicio expuesto en el satélite `estudio_multimedia`.
3. Crear el primer workflow real en `workflows/` y decidir aquí el lugar de escenas/BPM.

## Fuera de alcance por ahora

- Publicación npm / promoción a `packages/` del seed — no hasta el contrato probado.
- UI (`ui/VideoEditorStudio.tsx`) — depende de adapter + workflow real.
- Ampliar `AdapterManifest.kind` en el seed con `'video-composition'` — cambio del seed, no de este fork.
