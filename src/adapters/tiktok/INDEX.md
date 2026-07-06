# tiktok — adapter atómico

Estado: implementado
Sesión: 2026-07-03 (arquitecto). Orden sugerido en el pase 1: **5 de 8** (después de meta — introduce el paradigma de firma HMAC sobre raw body y el modelo de sesión asimétrico).

- **Capability:** `messaging` (`_contracts/messaging-adapter.ts` — `MessagingAdapter` v2). Mismo candidato futuro a `social-publish` que `meta`.
- **Investigación (cerrada):** sección TikTok de [`../_research/messaging_2026.md`](../_research/messaging_2026.md). Producto: TikTok Business Messaging API (suite Organic API, portal business-api.tiktok.com). Sin SDK — REST directo.
- **Consumido por:** [`../../modules/inbox/`](../../modules/inbox/INDEX.md).

## Arquitectura de implementación

- `src/integrations/tiktok/{manifest.ts,adapter.ts}` con `class TiktokAdapter implements MessagingAdapter`.
- Canal push-only y asimétrico (el negocio NUNCA inicia conversaciones): `listThreads`/`listMessages` sobre `MessageStore` inyectado; `sendMessage` valida ventana de 48h y cuota de 10 mensajes ANTES de llamar a la API.
- Ruta de webhook: `src/app/api/integrations/tiktok/webhook/route.ts` — sin handshake GET; cada POST se verifica con `verifyWebhook` (HMAC-SHA256 de `t=<timestamp>.<rawBody>` con el client secret, tolerancia 5s contra replay).
- Manifest: `kind: 'messaging'`, `permissions: { network: 'outbound-api', outboundHosts: ['business-api.tiktok.com'], runsOutsideSandbox: true }`.
- Env vars: `TIKTOK_CLIENT_ID`, `TIKTOK_CLIENT_SECRET` (sensitive), `TIKTOK_ACCESS_TOKEN` (sensitive, vida ~24h), `TIKTOK_REFRESH_TOKEN` (sensitive).

## DAG de tareas

- [x] **T1. Esqueleto** + gestor de ciclo de token (access ~24h, refresh caduca a 30 días de inactividad → estado `requiere_reauth` visible, nunca fallo silencioso). DoD: `npx tsc --noEmit`; `npx vitest run src/integrations/tiktok` (refresh expirado → error tipado `requiere_reauth`).
- [x] **T2. `verifyWebhook` + `handleWebhook`**: HMAC sobre raw body exacto (sin JSON.parse previo), rechazo por firma o por desfase >5s. DoD: `npx vitest run src/integrations/tiktok` (firma válida, firma corrupta, timestamp viejo → replay rechazado).
- [x] **T3. `sendMessage` con guardas**: contador de ventana 48h y cuota 10 mensajes leídos del thread (`serviceWindowExpiresAt`, `outboundQuotaRemaining`); solo `text` e imagen estándar (video/PDF/nota de voz → error tipado, la API los falla en silencio). DoD: `npx vitest run src/integrations/tiktok` (mensaje 11 rechazado localmente; tipo no soportado rechazado localmente).
- [x] **T4. Registro + CLI**: `npx tsx scripts/agno.ts install tiktok`. DoD: `list-adapters` lo muestra; `validate` limpio; `adapter tiktok send-message <threadId> --type text --body "..." --dry` imprime payload y estado de cuota.

## Superficie CLI

Misma forma que whatsapp/meta. Sin verbos nuevos.

## Vectores de entropía

| Vector | Riesgo | Mitigación en el plan |
|---|---|---|
| El negocio no puede iniciar conversaciones | Diseñar flujos salientes que la API no permite | Guardas locales en T3; el módulo inbox nunca ofrece "nuevo mensaje" en este canal |
| Cuota dura: 10 mensajes continuos / ventana 48h | Bloqueo indefinido hasta que el cliente responda | Contador en el thread + rechazo local antes del mensaje 11 (T3) |
| 100–200 conversaciones/día → error `[40064]` | Parón total del canal | Backoff y presupuesto diario en el módulo inbox; el adapter solo reporta el error tipado |
| Token access 24h / refresh caduca a 30 días inactivo | Canal muerto en silencio; "Requiere Reautorización" | Estado `requiere_reauth` explícito (T1) |
| Firma `t=`/`s=` sobre raw body con tolerancia 5s | Verificación imposible si el framework parsea antes | Route lee texto crudo primero (patrón común con wompi) |
| Geo-bloqueo EEA/UK | Cuentas europeas no conectan | Documentado; LATAM (Bogotá) confirmado viable |
| `is_ai_generated` (Content Posting, 2026) | Shadow ban si el futuro `social-publish` omite el flag | Nota para el contrato `social-publish` futuro — no aplica a messaging hoy |
