# whatsapp — adapter atómico

Estado: implementado
Sesión: 2026-07-03 (arquitecto). Orden sugerido en el pase 1: **2 de 8** (primero de messaging — paradigma REST más claro, fuerza a construir la infraestructura común: webhook routes, MessageStore, CLI runner).

- **Capability:** `messaging` (`_contracts/messaging-adapter.ts` — `MessagingAdapter` v2)
- **Investigación (cerrada):** sección WhatsApp de [`../_research/messaging_2026.md`](../_research/messaging_2026.md). Producto: WhatsApp Cloud API (On-Premise deprecada oct-2025). Sin SDK — cliente REST con `fetch` nativo (el SDK oficial es inmaduro según la comunidad).
- **Consumido por:** [`../../modules/inbox/`](../../modules/inbox/INDEX.md).

## Arquitectura de implementación

- Código en `src/integrations/whatsapp/` (subsistema de adapters del seed, referencia: `src/integrations/notion/`): `manifest.ts` + `adapter.ts` exportando `class WhatsappAdapter implements MessagingAdapter`.
- Canal push-only: `listThreads`/`listMessages` delegan en un `MessageStore` inyectado (ver contrato); la fuente entrante es el webhook.
- Ruta de webhook: `src/app/api/integrations/whatsapp/webhook/route.ts` (`GET` → `resolveWebhookChallenge`, `POST` → `verifyWebhook` sobre raw body + `handleWebhook`). Nunca en un zap.
- Manifest: `kind: 'messaging'`, `permissions: { network: 'outbound-api', outboundHosts: ['graph.facebook.com'], runsOutsideSandbox: true }`.
- Env vars: `WHATSAPP_ACCESS_TOKEN` (System User Token permanente, sensitive), `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WABA_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (sensitive), `WHATSAPP_APP_SECRET` (sensitive, firma X-Hub-Signature-256).

## DAG de tareas

- [x] **W1. Esqueleto**: `src/integrations/whatsapp/{manifest.ts,adapter.ts}` con la clase implementando el contrato (métodos con `throw new Error('not_implemented')` tipados). DoD: `npx tsc --noEmit` limpio.
- [x] **W2. `sendMessage`**: POST a `https://graph.facebook.com/v22.0/{phone-number-id}/messages`; texto libre dentro de ventana, `templateRef`/`templateParams` fuera; middleware de normalización E.164 (prefijos LATAM: +57, +52, +54, +55). DoD: `npx vitest run src/integrations/whatsapp` (fetch mockeado: payload texto vs plantilla, normalización +57 con y sin prefijo `1`).
- [x] **W3. Webhooks**: `resolveWebhookChallenge` (hub.mode/challenge/verify_token), `verifyWebhook` (HMAC del raw body vs `X-Hub-Signature-256`), `handleWebhook` (iterar `entry[].changes[].value.messages[]` — N mensajes por POST, nunca asumir uno) + resolución en dos pasos de `media_id` → URL temporal → attachment. DoD: `npx vitest run src/integrations/whatsapp` con payloads reales de la doc (texto, imagen, múltiples mensajes) y firma inválida rechazada.
- [x] **W4. Ruta API**: `src/app/api/integrations/whatsapp/webhook/route.ts` leyendo el body como texto ANTES de parsear, persistiendo attachments al recibirlos, respondiendo 200 rápido. DoD: `npx tsc --noEmit` + test de la route con `vitest`.
- [x] **W5. Registro**: `npx tsx scripts/agno.ts install whatsapp` (ciclo gobernado del harness). DoD: `npx tsx scripts/agno.ts list-adapters` muestra `whatsapp`; `npx tsx scripts/agno.ts validate` limpio.
- [x] **W6. CLI**: verbos vía el runner transversal (ver `../INDEX.md` § CLI). DoD: `npx tsx scripts/agno.ts adapter whatsapp send-message <threadId> --type text --body "ping" --dry` imprime el payload exacto sin enviarlo; envío real contra el número sandbox de Meta responde con `NormalizedMessage`.

## Superficie CLI

| Verbo | Entrada | Salida | Efecto externo |
|---|---|---|---|
| `adapter whatsapp list-threads` | `--cursor? --limit? --json` | `ListPage<NormalizedThread>` (JSON) | No (lee MessageStore) |
| `adapter whatsapp list-messages <threadId>` | `--cursor? --limit? --json` | `ListPage<NormalizedMessage>` | No |
| `adapter whatsapp send-message <threadId>` | `--type --body?|--template? --params? --dry` | `NormalizedMessage` | **Sí** — `--dry` obligatorio antes del primer envío real |

## Vectores de entropía

| Vector | Riesgo | Mitigación en el plan |
|---|---|---|
| Ventana de servicio 24h | Envío de texto libre rechazado fuera de ventana | `serviceWindowExpiresAt` en el thread; fuera de ventana solo `template` (W2) |
| Facturación por plantilla (jul-2025) | Costo silencioso por mensaje (marketing CO ~$0.0125) | El CLI reporta la categoría de plantilla; presupuesto es decisión del módulo inbox, no del adapter |
| Números LATAM (+57 prefijo `1`) | Fallos de entrega con el número tal cual lo da el usuario | Middleware E.164 explícito con tests (W2) |
| Cambio de CA mTLS (mar-2026) | Webhooks mueren en silencio si el trust store no tiene `meta-outbound-api-ca-2025-12.pem` | Vector de infraestructura: documentado aquí; verificar en el deploy, no en código |
| Payload de arrays anidados | Asumir 1 mensaje por POST pierde mensajes | `handleWebhook` itera todos los niveles (W3, test con payload múltiple) |
| `media_id` efímero | Binario inaccesible después | Resolver y persistir el attachment al procesar el webhook (W4) |
| Business Verification 2–14 días | Producción bloqueada; sandbox limita 250 conversaciones/24h | Iniciar la verificación del negocio en paralelo a W1 (tarea humana) |
