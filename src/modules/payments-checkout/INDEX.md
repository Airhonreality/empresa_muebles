# Payments Checkout — Module Index

Producto: checkout de pago, armado importando el adapter `wompi` (y a futuro, internacionales) de [`../../adapters/`](../../adapters/INDEX.md).

## Estado

**Fase: investigación completa, Wompi recomendado. Pendiente escribir `adapter.ts`.**

## Qué existe

- [README.md](README.md) — qué es este módulo.
- [docs/01_arquitectura_paquete.md](docs/01_arquitectura_paquete.md) — camino de crecimiento.
- [docs/02_contrato_universal_pagos.md](docs/02_contrato_universal_pagos.md) — razón de ser del contrato compartido.
- [`../../adapters/_contracts/payment-adapter.ts`](../../adapters/_contracts/payment-adapter.ts) — `PaymentAdapter`.
- [`../../adapters/wompi/`](../../adapters/wompi/INDEX.md) — investigado y recomendado, sin código todavía.
- `ui/` — vacío hasta que exista un provider real.

## Próxima acción concreta

1. Revisar [`../../adapters/_research/payments_co_2026.md`](../../adapters/_research/payments_co_2026.md) y confirmar si `payment-adapter.ts` necesita ajustes.
2. Implementar `../../adapters/wompi/adapter.ts`.
3. Panorama internacional (Stripe/PayPal/dLocal/MercadoPago) queda en la misma investigación como referencia — se activa cuando el negocio decida expandirse, sin adapter nuevo hasta entonces.

## Fuera de alcance por ahora

- Elegir pasarela internacional — deliberadamente abierto.
- Publicación npm / promoción a `packages/` del seed — no hasta 2+ providers reales.
- UI de checkout — depende de tener un provider real.
