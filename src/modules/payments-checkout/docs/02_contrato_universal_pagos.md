# Contrato universal de pagos

## Razon de ser

La venta de muebles a nivel nacional necesita cobrar hoy; a futuro se agregan mercados/proveedores internacionales. Para que el resto del sistema (cotizador, ordenes de venta) no dependa de cual pasarela esta activa, cada `../../../adapters/<id>/adapter.ts` implementa el mismo contrato — ver `../../../adapters/_contracts/payment-adapter.ts`.

## Forma actual (borrador)

- `ChargeRequest` / `ChargeResult` — cobrar, con `checkoutUrl` opcional para flujos con redireccion (tipico de pasarelas nacionales tipo PSE) y `raw` como escape hatch.
- `RefundRequest` — reembolso parcial o total, opcional porque no toda pasarela lo soporta via API.
- `PaymentAdapter` — `charge` y `getStatus` obligatorios; `refund`/`handleWebhook`/`verifyWebhook` opcionales porque el modelo de confirmacion (sincrono vs webhook asincrono) varia por proveedor.

Igual que el contrato de mensajeria: **no se expande especulativamente**. Cada campo nuevo se justifica con un proveedor real, confirmado por `../../../adapters/_research/payments_co_2026.md`.

## Relacion con `AdapterManifest` del seed

`AdapterManifest.kind` (`packages/core/src/adapter.ts` del seed) ya incluye `'payment'` — no hace falta ampliar el enum como si pasa con `render-studio`. Cuando este fork sincronice el subsistema de adapters:

- `../../../adapters/wompi/` gana un `manifest.ts` con `kind: 'payment'`, siguiendo la convencion de `src/integrations/notion/manifest.ts` en el seed.
- `permissions.network` sera `'outbound-api'` con `runsOutsideSandbox: true` en casi todos los casos — cobrar y recibir confirmaciones por webhook requiere red real, que el sandbox de zaps no permite.
- Datos sensibles (numeros de tarjeta, tokens) **nunca** pasan por `storage/db` en texto plano — el contrato solo mueve referencias (`id`, `externalId`, `checkoutUrl`), el dato sensible se queda del lado del proveedor (tokenizacion) o en variables de entorno para credenciales de comercio.

## Que falta antes de escribir el adapter

Ya se investigó — ver `../../../adapters/_research/payments_co_2026.md`, recomendación en la línea ~113.
