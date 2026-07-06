# wompi — adapter atómico

Estado: implementado
Sesión: 2026-07-03 (arquitecto). Orden sugerido en el pase 1: **3 de 8** (pista paralela a messaging — no comparte infraestructura con Meta, puede avanzar en simultáneo).

- **Capability:** `payment` (`_contracts/payment-adapter.ts` — `PaymentAdapter` v2)
- **Investigación (cerrada):** [`../_research/payments_co_2026.md`](../_research/payments_co_2026.md) — recomendación única (línea ~113): Wompi, por eficiencia serverless (REST + `fetch`, sin SDK pesado), tokenización client-side 100% headless, y tolerancia a tickets altos (muebles >15M COP) frente al riesgo de suspensión algorítmica (MercadoPago) o bloqueos antifraude (ePayco). La Parte 3 de la investigación ya está absorbida en el contrato v2 (union discriminada de métodos, tokens legales, `nextAction`, HMAC sobre raw body).
- **Consumido por:** [`../../modules/payments-checkout/`](../../modules/payments-checkout/INDEX.md).

## Arquitectura de implementación

- `src/integrations/wompi/{manifest.ts,adapter.ts}` con `class WompiAdapter implements PaymentAdapter`. `fetch` nativo contra la API REST — sin SDK (decisión de la investigación, cold-start).
- La tokenización de tarjeta, `acceptance_token`, `accept_personal_auth` y `session_id` antifraude se generan en el CLIENTE (widget/librería JS de Wompi) — el adapter recibe los tokens ya hechos en `ChargeRequest`. La UI es del módulo payments-checkout.
- Ruta de webhook: `src/app/api/integrations/wompi/webhook/route.ts` — lee el body como TEXTO antes de `JSON.parse` (el HMAC-SHA256 de `signature.properties` + timestamp + events secret se calcula sobre el texto exacto, comparado contra `X-Event-Checksum`).
- Manifest: `kind: 'payment'`, `permissions: { network: 'outbound-api', outboundHosts: ['production.wompi.co', 'sandbox.wompi.co'], runsOutsideSandbox: true }`.
- Env vars: `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY` (sensitive), `WOMPI_EVENTS_SECRET` (sensitive), `WOMPI_ENV` (`sandbox` | `production`).

## DAG de tareas

- [x] **P1. Esqueleto**: manifest + clase con métodos tipados.
- [x] **P2. `charge`**: mapear `PaymentMethodInput` discriminado a los payloads de Wompi (card+installments, PSE+bankCode+userType, Nequi+phone); mapear respuesta a `ChargeResult` con `nextAction` (`PENDING` de Nequi → `awaiting_push_notification`; PSE → `redirect_to_bank` + `checkoutUrl`).
- [x] **P3. `getResult`** (polling de transacción por id) **+ `refund?`**: el adapter expone `refund` como rechazo tipado y explícito porque el flujo de refund no quedó confirmado como seguro/estable para esta cuenta.
- [x] **P4. Webhook**: `verifyWebhook` (HMAC sobre raw body) + `handleWebhook` idempotente (mismo evento reintentado por Wompi no duplica el resultado — clave por `externalId`+estado).
- [x] **P5. Registro + CLI**: `npx tsx scripts/agno.ts install wompi`. `list-adapters` lo muestra; `validate` limpio; `adapter wompi charge --file cobro.json --dry` imprime el payload exacto; `adapter wompi get-result <chargeId>` consulta la transacción.

## Superficie CLI

| Verbo | Entrada | Salida | Efecto externo |
|---|---|---|---|
| `adapter wompi charge` | `--file <payload.json> --dry` | `ChargeRequest` impreso (`--dry`) o `ChargeResult` | **Sí** — siempre `--dry` primero; real solo con `WOMPI_ENV` explícito |
| `adapter wompi get-result <chargeId>` | `--json` | `ChargeResult` | No |

## Vectores de entropía

| Vector | Riesgo | Mitigación en el plan |
|---|---|---|
| HMAC sobre raw body en App Router | Firma inválida si se parsea el JSON antes | Route lee texto crudo primero (P4) — mismo patrón que tiktok |
| Estados `PENDING` asíncronos (Nequi: minutos) | Backend bloqueado o UX rota esperando respuesta síncrona | `nextAction` en el contrato; el frontend hace polling/instrucciones (P2) |
| Montos en centavos | Error x100 en cobros de muebles de alta gama | Nunca float; tests con montos reales del negocio (P2) |
| Tokens legales client-side | `charge` server-side inventando tokens = rechazo | El adapter valida presencia de `legalTokens`/`fraudSessionId` para `card` y falla tipado (P2) |
| Reintentos de webhook | Doble confirmación de pago en storage/db | Idempotencia por `externalId` (P4) |
| Sandbox vs producción | Cobro real accidental durante desarrollo | `WOMPI_ENV` default `sandbox`; el CLI imprime el entorno en cada verbo |
| KYC manual de Bancolombia en onboarding | Días sin credenciales productivas | Tarea humana en paralelo a P1 |
