# Contrato universal de video

## Dos adapters distintos, no un pipeline compuesto

Corrección de diseño hecha en esta sesión: la edición automática de video (clasificar clips → filtrar → componer con ritmo musical) **no es una capability compuesta especial** — son dos capabilities atómicas, cada una un adapter agnóstico normal:

- **Clasificación de clips** — "¿este clip es estable o movido?", "¿qué tipo de toma es?" — es una llamada multimodal a un LLM. **No es un adapter nuevo**, es el `LlmAdapter` que ya existe (`src/adapters/llm/`, mismo que usa el auto-responder de `inbox`), usado con un **workflow** de clasificación (un prompt específico), no un contrato nuevo.
- **Composición** — unir clips en un video, sincronizar con audio — sí es un adapter atómico genuino: `VideoComposerAdapter` (`src/adapters/_contracts/video-composer-adapter.ts`), provisto vía HTTP delegando al proyecto satélite `estudio_multimedia` (anteriormente implementado localmente en `shotstack-composer`).

La secuencia "clasificar → filtrar → componer" es un **workflow** (la receta, en `../workflows/`), exactamente el mismo concepto que los JSON de ComfyUI en `render-studio` — solo que aquí el workflow encadena dos adapters en vez de parametrizar uno solo. Sigue siendo config, no código de adapter.

## Forma actual del contrato de composición (borrador)

- `ComposeRequest` — `decisions: EditDecision[]` (qué clip, qué segmento, en qué orden), `audioTrackUrl` opcional, `outputFormat`.
- `ComposeResult` — asíncrono (`status`), como `render`, no instantáneo como un webhook de pago.
- `VideoComposerAdapter` — `compose`, `getResult` (polling). Nada de clasificación adentro.

No se expande especulativamente — se ajusta con la primera implementación real.

## Relación con `AdapterManifest` del seed

`kind: 'video-composition'` **no existe todavía** en el enum del seed (`packages/core/src/adapter.ts`) — mismo caso que `visual-generation` de `render-studio`. Al haberse delegado la capability vía HTTP, no se requiere registrar un manifest local.

`permissions.network` será `'outbound-api'` con `runsOutsideSandbox: true` si el composer corre como servicio externo (RunPod/contenedor propio) — o `'none'` si ffmpeg corre embebido en la misma función serverless sin llamada de red, dependiendo de lo que confirme la investigación.

## Qué falta antes de escribir el adapter

Ver `03_prompt_deep_research.md`.
