# gmail — adapter atómico

Estado: amarillo (implementado en modo test)
Sesión: 2026-07-04. El código ya está en `src/integrations/gmail/` y la ruta Pub/Sub está montada; la tarea humana G0 de CASA/GCP sigue en paralelo y mantiene el canal fuera de producción real.

- **Capability:** `messaging` (`_contracts/messaging-adapter.ts` — `MessagingAdapter` v2)
- **Investigación (cerrada):** sección Gmail de [`../_research/messaging_2026.md`](../_research/messaging_2026.md). El producto correcto es la **Gmail API** estándar; Google Business Messages está descontinuado.
- **Consumido por:** [`../../modules/inbox/`](../../modules/inbox/INDEX.md).

## Arquitectura de implementación

- `src/integrations/gmail/{manifest.ts,adapter.ts,index.ts,ConfigPanel.tsx}` con `class GmailAdapter implements MessagingAdapter`.
- La integración usa `fetch` nativo contra Gmail API + OAuth2 refresh token. No se añadieron dependencias nuevas porque el repo no trae `googleapis` ni `nodemailer`; el MIME se compone con una implementación local mínima y testable.
- Sin webhook directo: Google entrega notificaciones vía Cloud Pub/Sub. La ruta `src/app/api/integrations/gmail/pubsub/route.ts` verifica OIDC con audiencia configurada, recibe `{emailAddress, historyId}` y reconcilia con `users.history.list` -> `users.messages.get`, con fallback a full sync si el `historyId` quedó obsoleto.
- `listThreads` usa `users.threads.list/get`; `listMessages` usa `users.threads.get`.
- `sendMessage` compone MIME con `subject`, `cc`, `bcc`, `In-Reply-To` y adjuntos descargados desde `attachments[].url`.
- Manifest: `kind: 'messaging'`, `permissions: { network: 'outbound-api', outboundHosts: ['gmail.googleapis.com', 'oauth2.googleapis.com', 'www.googleapis.com'], runsOutsideSandbox: true }`.
- Env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GMAIL_PUBSUB_TOPIC`, `GMAIL_PUBSUB_VERIFICATION_AUDIENCE`.

## DAG de tareas

- [ ] **G0 (humana, sigue en paralelo)**: proyecto en Google Cloud Console, scopes `gmail.modify` + `gmail.send`, y arranque del proceso CASA Tier 2. El adapter ya funciona en modo test con buzón de prueba.
- [x] **G1. Esqueleto** + auth OAuth2 con refresh token.
- [x] **G2. `listThreads`/`listMessages`**: mapeo thread -> `NormalizedThread` con `subject`, y extracción de texto plano/HTML desde `payload.parts`.
- [x] **G3. `sendMessage`**: ensamblado MIME local con `subject`/`cc`/`bcc`/`In-Reply-To` y adjuntos, codificado a base64url en `raw`.
- [x] **G4. Pub/Sub + watch**: route receptora con reconciliación por `historyId` y fallback a full sync ante `404`, con verificación OIDC y audiencia en la puerta de entrada. El helper `renewGmailWatch` ya existe; la ejecución periódica sigue pendiente del pase operativo G0 / scheduler externo.
- [x] **G5. Registro + CLI**: `list-adapters` lo muestra; `adapter gmail list-threads --json` y `adapter gmail send-message --dry` están conectados.

## Superficie CLI

Misma forma que el resto de messaging (`list-threads`, `list-messages`, `send-message --dry`). Sin verbos nuevos.

## Vectores de entropía

| Vector | Riesgo | Mitigación |
|---|---|---|
| CASA Tier 2 (meses, costo real) | Producción bloqueada aunque el código esté listo | G0 sigue fuera del repo y el canal opera en test |
| `users.watch` caduca a 7 días | Flujo entrante muere en silencio | Helper `renewGmailWatch` listo; falta enganchar cron/scheduler |
| `historyId` caducado -> 404 | Pérdida de continuidad del buzón | Full sync automático en la route |
| Webhook sin identidad OIDC | Entrada no autenticada | Validación de JWT firmado y audiencia configurada |
| MIME / `payload.parts` fractal | Parsing frágil con correos reales | Recorrido recursivo con fixtures de prueba |
| Falta de `googleapis` / `nodemailer` | No se puede depender de composer externo | MIME local mínima, explícita y documentada |
| Adjuntos sin binary payload | No se puede ensamblar el archivo | El adapter exige `attachments[].url` para descargar el binario antes de componer MIME |
