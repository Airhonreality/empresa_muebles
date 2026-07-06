# llm — adapter atómico

Estado: implementado
Sesión: 2026-07-03 (arquitecto). Orden sugerido en el pase 1: **1 de 8** (el más pequeño; desbloquea consumidores en inbox y video-editor y estrena el subsistema de integración con el menor riesgo).

- **Capability:** `llm` (`_contracts/llm-adapter.ts` — `LlmAdapter`). `kind: 'llm'` ya existe en el seed.
- **Sin investigación dedicada (decisión sostenida):** el seed ya implementa el patrón en `src/app/api/chat/route.ts` (Vercel AI SDK, provider-swapping vía `ai_config`). Dos consumidores reales identificados: clasificación de clips (video-editor) y auto-responder (inbox).
- **Resolución de la colisión Groq vs Gemini (auditoría 2026-07-03 §1):** el adapter es provider-agnostic; el proveedor se fija POR WORKFLOW en el registro `ai_config` de storage, no en código. La clasificación de clips usará el proveedor que `ai_config` diga (la investigación de video recomienda Gemini 2.5 Flash; el default barato general es Groq) — cambiarlo es editar un registro, no un deploy. La colisión se disuelve: no hay dos códigos, hay una config.

## Arquitectura de implementación

- `src/integrations/llm/{manifest.ts,adapter.ts}` con `class LlmAdapter` (wrapper delgado sobre `ai`/`@ai-sdk/*`, ya dependencias del seed — nunca REST a mano por proveedor).
- `chat()` lee el prompt de sistema y el proveedor/modelo desde `ai_config` (mismo mecanismo que la route del seed, extraído a helper importable — sin duplicar la lógica de la route, y sin tocarla: es engine).
- `classifyImage?()` con proveedor multimodal según `ai_config` del workflow que llama.
- Manifest: `kind: 'llm'`, `requiresSchemas: ['ai_config']`, `permissions: { network: 'outbound-api', runsOutsideSandbox: true }` (hosts según proveedores configurados).
- Env vars: las llaves de los proveedores habilitados (`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`/`GROQ_API_KEY`/`GOOGLE_GENERATIVE_AI_API_KEY`, todas sensitive, ninguna required — required es que exista al menos una para el proveedor activo en `ai_config`; el manifest lo documenta y el adapter falla tipado si falta la del proveedor configurado).

## DAG de tareas

- [x] **L1. Esqueleto** + helper de resolución proveedor/modelo desde `ai_config` (reusando el patrón de la route del seed sin modificarla). DoD: `npx tsc --noEmit`.
- [x] **L2. `chat`**: mensajes + systemPrompt (de `ai_config`, nunca concatenado con contenido de usuario). DoD: `npx vitest run src/integrations/llm` (provider mockeado; system y user separados en la llamada).
- [x] **L3. `classifyImage`**: instrucciones + imageUrl → `{label, confidence?}` parseado de forma tolerante (el modelo puede devolver prosa — extraer label con salida estructurada del SDK, no regex frágil). DoD: `npx vitest run src/integrations/llm`.
- [x] **L4. Registro + CLI**: `npx tsx scripts/agno.ts install llm`. DoD: `list-adapters` lo muestra; `validate` limpio; `adapter llm chat --message "ping" --json` responde con el proveedor configurado en `ai_config`.

## Superficie CLI

| Verbo | Entrada | Salida | Efecto externo |
|---|---|---|---|
| `adapter llm chat` | `--message <str> [--system <str>] --json` | `ChatResult` | Sí (costo por token — el CLI imprime proveedor/modelo usado) |
| `adapter llm classify-image` | `--url <imageUrl> --instructions <str> --json` | `ClassifyImageResult` | Sí (ídem) |

## Vectores de entropía

| Vector | Riesgo | Mitigación en el plan |
|---|---|---|
| Free tiers/límites cambian (Groq, Gemini 250 req/día free) | Fallas 429 en cascada en runtime automatizado | No asumir cifras: proveedor de runtime en `ai_config` con fallback documentado; volúmenes altos = pay-as-you-go |
| Prompt injection desde contenido de usuario | Auto-responder manipulado por un mensaje entrante | System prompt siempre separado (L2); el módulo inbox añade su propia sanitización |
| Costo silencioso por token | Flows en loop queman presupuesto | El CLI reporta proveedor/modelo por llamada; presupuestos son del orquestador de flows, no del adapter |
| Dependencia del registro `ai_config` | Adapter instalado sin config → fallo en runtime | `requiresSchemas: ['ai_config']` — `agno install` lo valida en el ciclo gobernado |
| Salida no estructurada del modelo | `classifyImage` devuelve prosa en vez de label | Salida estructurada del SDK (L3), nunca regex sobre texto libre |
