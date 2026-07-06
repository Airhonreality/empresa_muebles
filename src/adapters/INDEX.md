# src/adapters — Index (Capa 1: atómicos, agnósticos)

Cada carpeta es el ARNÉS (plan + estado) de un microservicio atómico — una llamada, una acción (`charge`, `sendMessage`, `chat`, `compose`, `submit`). Un adapter **no sabe** qué proyecto ni qué workflow lo invoca; eso vive en la capa de arriba (`../modules/`).

**Decisión de arquitectura (sesión 2026-07-03, pendiente de ratificar vía `plan_aprobado`):** el CÓDIGO de cada adapter no vive aquí sino en `src/integrations/<id>/` (subsistema de adapters del seed: `manifest.ts` + `adapter.ts`, registro solo vía `agno install <id>`, rutas de red bajo `src/app/api/` — es el contrato no negociable de `CLAUDE.md`). Aquí quedan los `INDEX.md` de arnés y los contratos compartidos. Esto resuelve la colisión de vocabulario `src/adapters/` vs `src/integrations/` detectada en [`AUDITORIA_HOMEOSTASIS_2026-07-03.md`](AUDITORIA_HOMEOSTASIS_2026-07-03.md).

## Contratos compartidos (`_contracts/`)

Un contrato = una capability. Varios adapters pueden implementar el mismo contrato. Todos en **v2** desde 2026-07-03 (ajustes de las investigaciones absorbidos; sin implementadores activos al momento de la mutación).

| Contrato | Capability (`AdapterManifest.kind`) | Implementado por |
|---|---|---|
| [`messaging-adapter.ts`](_contracts/messaging-adapter.ts) | `messaging` (existe en el seed) | `whatsapp`, `meta`, `tiktok` |
| [`payment-adapter.ts`](_contracts/payment-adapter.ts) | `payment` (existe en el seed) | `wompi` |
| [`render-adapter.ts`](_contracts/render-adapter.ts) | `visual-generation` (**no existe en el seed — `kind: 'other'`**) | `—` (capability provista vía HTTP por el proyecto satélite `estudio_multimedia`) |
| [`video-composer-adapter.ts`](_contracts/video-composer-adapter.ts) | `video-composition` (**no existe en el seed — `kind: 'other'`**) | `—` (capability provista vía HTTP por el proyecto satélite `estudio_multimedia`) |
| [`llm-adapter.ts`](_contracts/llm-adapter.ts) | `llm` (existe en el seed) | `llm` |
| [`conversion-adapter.ts`](_contracts/conversion-adapter.ts) | `ad-conversion` (**no existe en el seed — `kind: 'other'`**) | `—` (capability provista vía HTTP por el proyecto satélite `adapters_archive`) |

Reglas de vocabulario de los contratos (homeostasis): consulta post-creación = `getResult` en todos los contratos asíncronos; verificación de firma = `verifyWebhook(rawBody, headers)`; handshake GET = `resolveWebhookChallenge(query)`.

## Investigación consolidada (`_research/`)

- [`messaging_2026.md`](_research/messaging_2026.md) — WhatsApp, Meta, TikTok, Gmail. **Cerrada.**
- [`payments_co_2026.md`](_research/payments_co_2026.md) — Wompi (recomendado), ePayco, Bold, MercadoPago + panorama internacional. **Cerrada.**
- [`render_2026.md`](_research/render_2026.md) — RunPod/ComfyUI, ControlNet, IP-Adapter, licencias. **Cerrada** (reubicada el 2026-07-03 desde la carpeta huérfana `src/modules/render/`).
- [`video_2026.md`](_research/video_2026.md) — composición de video serverless, Shotstack/EDL, escenas/BPM/LLM multimodal. **Cerrada.**
- [`ad_conversions_2026.md`](_research/ad_conversions_2026.md) — Google Ads (Data Manager API — la Google Ads API cerró a nuevos adoptantes jun-2026), Meta CAPI. **Cerrada** (hallazgos pegados el 2026-07-03).

## Adapters

| Adapter | Capability | Estado | Orden pase 1 | Consumido por |
|---|---|---|---|---|
| [`llm/`](llm/INDEX.md) | llm | implementado | 1 | `modules/video-editor`, `modules/inbox` |
| [`whatsapp/`](whatsapp/INDEX.md) | messaging | implementado | 2 | `modules/inbox` |
| [`wompi/`](wompi/INDEX.md) | payment | implementado | 3 (pista paralela) | `modules/payments-checkout` |
| [`meta/`](meta/INDEX.md) | messaging | implementado | 4 | `modules/inbox` |
| [`tiktok/`](tiktok/INDEX.md) | messaging | implementado | 5 | `modules/inbox` |
| `runpod-comfyui` | visual-generation | extraído | — | (capability provista vía HTTP por el proyecto satélite `estudio_multimedia`) |
| `shotstack-composer` | video-composition | extraído | — | (capability provista vía HTTP por el proyecto satélite `estudio_multimedia`) |
| [`gmail/`](gmail/INDEX.md) | messaging | implementado (modo test; G0 pendiente) | 8 (código al final; trámite CASA sigue en paralelo) | `modules/inbox` |
| `meta-conversions-api` | ad-conversion | extraído | — | (capability provista vía HTTP por el proyecto satélite `adapters_archive`) |
| `google-ads-conversions` | ad-conversion | extraído | — | (capability provista vía HTTP por el proyecto satélite `adapters_archive`) |

Semáforo operativo actual:

- Verde: `llm`, `whatsapp`, `wompi`, `meta`, `tiktok`
- Amarillo: `gmail` (código listo, G0 humano pendiente, watch por cerrar)

La verdad operativa ya vive en `src/integrations/<id>/adapter.ts` para los adapters verdes; `runpod-comfyui`, `shotstack-composer`, `meta-conversions-api` y `google-ads-conversions` han sido extraídos del repositorio principal a carpetas/satélites externos (`estudio_multimedia` y `adapters_archive`) resolviendo las dependencias externas y permitiendo un motor más acotado.

## Infraestructura transversal: runner CLI de adapters

Estado: plan_borrador (parte de esta misma sesión — prerrequisito de la última tarea de cada DAG).

Un solo comando genérico en `scripts/agno.ts` (patrón `cli-reporter.ts`/`storage-repository.ts`): `npx tsx scripts/agno.ts adapter <id> <verbo> [args] [--json] [--dry]`. Regla de vocabulario: **verbo CLI = método del contrato en kebab-case** (`send-message`, `charge`, `get-result`, `list-workflows`, `chat`, ...) — cero verbos inventados por adapter, cero colisiones nuevas con el baseline (`install`, `list-adapters`, `remove-adapter`, `validate`, `docs`, ...). Verbos con efecto externo (enviar, cobrar, renderizar) exigen `--dry` como primer uso (imprime el payload exacto sin ejecutar), coherente con el ciclo `plan → dry → confirm` del harness. El runner resuelve el adapter desde el REGISTRY de instalados y despacha por reflexión sobre el contrato.

DoD del runner: `npx tsc --noEmit`; `npx tsx scripts/agno.ts adapter --help` lista adapters instalados y sus verbos; `npx vitest run scripts` (despacho, `--dry`, error tipado con adapter no instalado).

## Camino de crecimiento

Sin cambios: construir en el fork → probar con adapters reales → promover `_contracts/` a `packages/` del seed (`git mv`) → distribuir vía `sync-workspaces.ps1`. Ver [`../modules/INDEX.md`](../modules/INDEX.md).
