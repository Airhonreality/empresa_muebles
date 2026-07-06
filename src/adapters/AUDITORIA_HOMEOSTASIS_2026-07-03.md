# Fase 0 — Auditoría de homeostasis (2026-07-03)

Artefacto de la sesión de planificación (MODO: PLANIFICACION, ver
[`PROMPT_FABLE5_ARQUITECTO_ARNES.md`](PROMPT_FABLE5_ARQUITECTO_ARNES.md)).
Emitido por Fable 5 (arquitecto). Bloquea la Fase 1: las colisiones marcadas ⛔
requieren decisión humana antes de planificar el objetivo afectado.

Insumos comparados: los 6 contratos de `_contracts/`, los 10 `INDEX.md` de
adapters, `INDEX.md` raíz, `src/modules/INDEX.md`, `packages/core/src/adapter.ts`
y el estado real de `_research/`.

## 1. Capabilities duplicadas o casi-duplicadas ("hermanos de riesgo")

| Par | Veredicto |
|---|---|
| `meta` (messaging) vs `meta-conversions-api` (ad-conversion) | Controlado — mismo proveedor, credenciales y propósito distintos; ya documentado con nota explícita "no fusionar sin confirmar" en `meta-conversions-api/INDEX.md`. |
| `llm` (contrato fork) vs `src/app/api/chat/route.ts` (seed) | Controlado — documentado como formalización importable del mismo patrón, no reemplazo. |
| `social-publish` (identificado, no programado) | Vigilar — si alguien crea un adapter de publicación separado en vez de un segundo contrato sobre `meta`/`tiktok`, se materializa el duplicado. Regla ya escrita en `src/modules/INDEX.md`. |
| ⛔ `ffmpeg-composer` vs recomendación real de la investigación | **Colisión nueva.** `_research/video_2026.md` (volcado reciente, aún sin commit) recomienda que la composición la haga un servicio hospedado de EDL (Shotstack) — no ffmpeg propio, que declara insostenible en serverless. Los adapters atómicos se nombran por proveedor (`wompi`, `whatsapp`, `runpod-comfyui`); si el primer provider real es Shotstack, la carpeta/clase `ffmpeg-composer`/`FfmpegComposerAdapter` miente. Decisión humana: renombrar por proveedor real, o mantener ffmpeg propio como primer provider contradiciendo la investigación. |
| ⛔ Clasificación de clips: `llm/INDEX.md` vs `video_2026.md` | **Recomendaciones en conflicto para el mismo workflow.** `llm/INDEX.md` recomienda Groq para "clasificar frames" (alto volumen, bajo razonamiento); la investigación de video recomienda Gemini 2.5 Flash (ingesta multimodal nativa de video, caché de contexto). El contrato `LlmAdapter` es provider-agnostic así que no rompe tipos, pero el plan de `video-editor` debe fijar uno — decisión explícita en su DAG, no default silencioso. |
| Gap sin contrato: detección de escenas y BPM | La arquitectura recomendada en `video_2026.md` asume detección de cortes (FFmpeg `select` / PySceneDetect vía FaaS tipo Rendi.dev) y BPM (cliente, Web Audio API). Ninguna cabe en `VideoComposerAdapter` (deliberadamente atómico, solo compose) ni en `LlmAdapter`. Al planificar `video-editor` hay que decidir dónde viven: workflow del módulo, o contrato nuevo. No inventar el contrato sin esa decisión. |

## 2. Vocabulario inconsistente

### Entre contratos

- `verifyWebhook`: en `messaging-adapter.ts` es `(query) => string | null`
  (resuelve el handshake `hub.challenge`); en `payment-adapter.ts` es
  `(payload, headers) => boolean` (verifica firma). **Mismo nombre, semántica
  distinta.** Propuesta para Fase 1 (mutación segura, cero implementadores):
  renombrar el de messaging a algo tipo `resolveWebhookChallenge` y reservar
  `verifyWebhook` para verificación de firma.
- Poll de trabajo asíncrono: `RenderAdapter.getResult` y
  `VideoComposerAdapter.getResult` vs `PaymentAdapter.getStatus`. Unificar el
  verbo de consulta cuando se toquen esos contratos. El verbo de creación
  (`charge`, `submit`, `compose`, `reportConversion`) es capability-specific y
  se acepta como está.

### CLI (baseline del seed)

Verbos existentes en `scripts/agno.ts`: `context`, `validate`, `bootstrap`,
`create-schema`, `create-record`, `refactor-schema`, `docs`, `list-adapters`,
`install`, `remove-adapter`. Ya hay asimetría en el propio seed:
`install` (sin sufijo) vs `remove-adapter` / `list-adapters`. Los verbos CLI
nuevos por adapter (Fase 1) deben declarar su convención en cada INDEX.md y no
agravar la asimetría; la convención elegida se valida contra este baseline en
el QA del paso 2.

## 3. Capabilities asumidas por el plan vs seed real

`AdapterKind` (`packages/core/src/adapter.ts:18`) =
`'data-source' | 'messaging' | 'payment' | 'llm' | 'other'`. Verificado:

| Capability asumida | ¿Existe en el seed? | Workaround documentado |
|---|---|---|
| `visual-generation` | No | Sí — `kind: 'other'` en `runpod-comfyui/INDEX.md`. |
| `video-composition` | No | Por referencia ("mismo caso") en `ffmpeg-composer/INDEX.md`. |
| `ad-conversion` | No | **Incompleto** — los dos INDEX de conversions dicen que el kind no existe pero no fijan `kind: 'other'`. Cerrar en Fase 1. |

Ampliar `AdapterKind` es cambio del seed, fuera del alcance de este fork (ya
marcado así en `runpod-comfyui/INDEX.md`).

## 4. Cabos sueltos ya documentados (deuda existente — se reporta, no se corrige aquí)

1. **`video_2026.md` desincronizado tras el volcado de investigación** (cambio
   en working tree, sin commit): la sección "Ajustes acordados al contrato"
   quedó vacía, y tanto `ffmpeg-composer/INDEX.md:4` como
   `src/adapters/INDEX.md:25` siguen diciendo "sin investigar". Tres punteros
   stale sobre el mismo hecho.
2. **Paths de implementación muertos en 3 contratos** — apuntan a carpetas que
   no existen; la convención vigente (todos los INDEX.md) es
   `src/adapters/<id>/adapter.ts`:
   - `messaging-adapter.ts:72` → `src/modules/inbox/providers/<id>/adapter.ts`
   - `payment-adapter.ts:61` → `src/modules/payments/providers/` (además el módulo real se llama `payments-checkout`)
   - `render-adapter.ts:42` → `../providers/runpod-comfyui/adapter.ts`
   Corregirlos = mutación de contratos sin implementadores activos (segura);
   propuesta como parte del diff de contrato de cada objetivo en Fase 1.
3. **Carpeta huérfana `src/modules/render/`** (solo
   `docs/04_hallazgos_investigacion.md`) junto a `render-studio/` — sobra de un
   rename. Los headers de messaging/payment referencian un
   `docs/04_hallazgos_investigacion.md` que no existe en sus módulos.
4. **Puntero stale al prompt maestro**: `src/adapters/current_state.md:50` dice
   que vive en `_research/PROMPT_FABLE5_ARQUITECTO_ARNES.md`; vive en
   `src/adapters/PROMPT_FABLE5_ARQUITECTO_ARNES.md`.
5. **Investigación no cerrada para 3 objetivos**: `render_2026.md` y
   `ad_conversions_2026.md` siguen siendo plantillas. `runpod-comfyui`,
   `google-ads-conversions` y `meta-conversions-api` no tienen insumo cerrado —
   planificarlos hoy exige que la primera tarea de su DAG sea correr la
   investigación, o dejarlos fuera de la lista cerrada de esta sesión.
6. **(Detectado durante la Fase 1) Dos vocabularios para "adapter"**: el
   contrato del seed en `CLAUDE.md` exige que todo adapter instalable viva en
   `src/integrations/<id>/` (manifest + `agno install`), mientras los INDEX de
   `src/adapters/` decían "clase exportada desde `src/adapters/<id>/adapter.ts`".
   Resolución propuesta (aplicada en los planes, se ratifica con
   `plan_aprobado`): código en `src/integrations/<id>/` implementando los
   contratos de `src/adapters/_contracts/`; `src/adapters/<id>/` queda solo
   como arnés (INDEX.md).

---

## Addendum — resoluciones de la misma sesión (2026-07-03, con input humano)

- ⛔ ffmpeg-composer: **RESUELTA** — humano aprobó renombrar por proveedor →
  `shotstack-composer` (git mv + referencias actualizadas).
- ⛔ Groq vs Gemini: **DISUELTA a nivel de arquitectura** — el proveedor se fija
  por workflow en `ai_config` (registro de storage), no en código. Ver
  `llm/INDEX.md`.
- Cabo 4.1: **CORREGIDO** — hallazgos de render reubicados de
  `src/modules/render/` (carpeta eliminada) a `_research/render_2026.md`;
  INDEX de video/render actualizados. El humano confirmó que la investigación
  de render y video ya estaba corrida.
- Cabo 4.2: **CORREGIDO** — paths de implementación de los 3 contratos ahora
  apuntan a `src/integrations/<id>/` (v2, sin implementadores activos).
- Cabo 4.4: **CORREGIDO** — puntero al prompt maestro arreglado en
  `current_state.md`.
- Cabo 4.5: **CERRADO** — render y video cerradas en la mañana; los hallazgos
  de ads se pegaron en `_research/ad_conversions_2026.md` el mismo día y los
  2 adapters de conversions pasaron a `plan_borrador` (pase 2 planificado).
- Mutación adicional aplicada (sin implementadores activos):
  `conversion-adapter.ts` v2 **invierte la regla de hasheo de v1** — el
  adapter recibe PII en crudo y normaliza+hashea por plataforma (reglas
  Gmail de Google; IP/user-agent en claro para el EMQ de Meta). El
  invariante pasa de "el adapter nunca ve PII" a "el PII nunca sale, se
  loguea ni se persiste". Justificación completa en la sección "Ajustes
  acordados al contrato" de `_research/ad_conversions_2026.md`. Se ratifica
  con el `plan_aprobado` de los 2 objetivos de conversions.
- Vocabulario §2: **APLICADO en contratos v2** — `getResult` unificado,
  `verifyWebhook(rawBody, headers)` para firmas, `resolveWebhookChallenge`
  para el handshake GET. CLI: regla "verbo = método del contrato en
  kebab-case" bajo el runner transversal `agno adapter <id> <verbo>` (ver
  `INDEX.md` raíz).
