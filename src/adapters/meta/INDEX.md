# meta — adapter atómico

Estado: implementado
Sesión: 2026-07-03 (arquitecto). Orden sugerido en el pase 1: **4 de 8** (reusa la infraestructura de webhook/handshake construida para whatsapp — misma red de Meta).

- **Capability:** `messaging` (`_contracts/messaging-adapter.ts` — `MessagingAdapter` v2). Candidato futuro a un segundo contrato `social-publish` — mismas credenciales, ver `../../modules/INDEX.md`; NO crear un adapter aparte para publicar.
- **Investigación (cerrada):** sección Meta (Messenger + Instagram) de [`../_research/messaging_2026.md`](../_research/messaging_2026.md). Productos: Messenger API + Messenger API for Instagram (la Basic Display API no sirve — no lee DMs).
- **Consumido por:** [`../../modules/inbox/`](../../modules/inbox/INDEX.md).

## Arquitectura de implementación

- `src/integrations/meta/{manifest.ts,adapter.ts}` con `class MetaAdapter implements MessagingAdapter`. Un solo adapter cubre Messenger e Instagram (misma Graph API); `channel` distingue `messenger`/`instagram`.
- `listThreads`/`listMessages` consultan al proveedor (`GET /me/conversations`) — canal con listado nativo, no requiere `MessageStore`.
- Ruta de webhook: `src/app/api/integrations/meta/webhook/route.ts` (mismo handshake `hub.challenge` que whatsapp — extraer el helper compartido a `src/integrations/_shared/meta-webhook.ts` si se repite, decisión en M1).
- Manifest: `kind: 'messaging'`, `permissions: { network: 'outbound-api', outboundHosts: ['graph.facebook.com', 'graph.instagram.com'], runsOutsideSandbox: true }`.
- Env vars: `META_PAGE_ACCESS_TOKEN` (sensitive), `META_IG_USER_ID`, `META_APP_SECRET` (sensitive), `META_WEBHOOK_VERIFY_TOKEN` (sensitive).

## DAG de tareas

- [x] **M1. Esqueleto** + decisión de helper compartido de handshake con whatsapp (evitar dos copias del mismo GET hub.challenge). DoD: `npx tsc --noEmit`.
- [x] **M2. `sendMessage`**: POST `graph.instagram.com/v23.0/{IG_USER_ID}/messages` (IGSID destinatario); dentro de 24h texto libre; `messageTag: 'human_agent'` mapea a `HUMAN_AGENT` SOLO si el caller lo pide explícito (nunca default). DoD: `npx vitest run src/integrations/meta` (payload con y sin tag; envío fuera de ventana sin tag → error tipado antes de llamar a la API).
- [x] **M3. Webhooks + resolución de `asset_id`**: `handleWebhook` resuelve attachments vía `GET /{asset_id}?fields=media_url` y marca `url` como efímera; la route persiste el binario inmediatamente (los links de historias caducan en 24h). DoD: `npx vitest run src/integrations/meta` con payloads de imagen/historia; firma X-Hub-Signature-256 inválida rechazada.
- [x] **M4. `listThreads`/`listMessages`** sobre `GET /me/conversations` con paginación por cursor. DoD: `npx vitest run src/integrations/meta` (mapeo conversación→NormalizedThread con `serviceWindowExpiresAt` calculado desde el último mensaje entrante).
- [x] **M5. Registro + CLI**: `npx tsx scripts/agno.ts install meta`; DoD: `list-adapters` lo muestra, `validate` limpio, `adapter meta list-threads --json` responde contra tokens del Graph API Explorer.

## Superficie CLI

Misma forma que whatsapp (`list-threads`, `list-messages`, `send-message --dry`). Sin verbos nuevos — cero vocabulario adicional.

## Vectores de entropía

| Vector | Riesgo | Mitigación en el plan |
|---|---|---|
| App Review (`instagram_manage_messages`) | Semanas de espera; sin permisos no hay producción | Tarea humana en paralelo a M1; desarrollo con Graph API Explorer |
| Ban wave 2025 / automatización no autorizada | Bloqueo permanente de la app | Solo respuestas a interacciones iniciadas por el usuario; nada de mensajes fríos — regla dura en el módulo inbox |
| Deprecación de message tags (abr-2026) | Solo `HUMAN_AGENT` sigue vivo; usarlo para bots = bloqueo | El adapter lo expone pero nunca lo aplica por default (M2); auditable en el payload del CLI `--dry` |
| Cadena de tokens (corto→largo→page token) | Tokens caducan a 60 días; flujo de renovación multi-paso | Documentar la cadena en `manifest.ts`; alerta operativa cuando falte <7 días (módulo inbox) |
| `asset_id` / URLs efímeras (24h) | Imágenes rotas en la bandeja | Persistir binario al procesar el webhook (M3) |
| Rate limit 200 msg/h por cuenta | Bloqueo temporal del canal | `outboundQuotaRemaining` en el thread; throttling es responsabilidad del módulo inbox |
| Cuenta IG debe ser Professional + vinculada a página FB | Onboarding del cliente falla en silencio | Checklist de onboarding en el módulo inbox, no código del adapter |
