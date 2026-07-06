# UI — pendiente

El checkout/formulario de pago (el que consuma `PaymentAdapter` de Wompi) se escribe cuando exista el adapter real en [`../../../adapters/wompi/`](../../../adapters/wompi/INDEX.md). No hay UI especulativa aqui todavia — la forma exacta del formulario (tokenizacion en cliente via el script de Wompi, ver `../../../adapters/_research/payments_co_2026.md`) depende del adapter implementado.

Cuando se escriba, sigue el patron de registro en `agnostic.config.ts` (`blocks: { checkout: () => import('./src/modules/payments-checkout/ui/CheckoutForm') }`).
