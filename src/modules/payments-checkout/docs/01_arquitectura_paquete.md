# Arquitectura del paquete — camino de crecimiento

## Decision

Igual que `../../inbox/`: este modulo nace en `empresa_muebles_clone` porque es donde se usa primero — Vetadorada necesita cobrar ventas de muebles a nivel nacional ya. No nace en el seed (`agnostic system`) ni como servicio externo.

## Camino de tres pasos (mismo que inbox)

1. **Ahora — construir aqui, shaped como paquete.** El adapter (`../../../adapters/wompi/`) es 100% agnostico, sin imports que crucen hacia codigo especifico de muebles. Este macro modulo (`src/modules/payments-checkout/`) lo ensambla en un checkout.
2. **Cuando el contrato este probado con 2+ providers reales** (al menos un nacional funcionando + evidencia de que un segundo, nacional o internacional, encaja en el mismo contrato sin romperlo), promover a `packages/payments/` en el seed — mismo patron que `packages/core`. `git mv` + ajustar paths, no reescritura.
3. **Distribucion a otros forks via `scripts/admin/sync-workspaces.ps1`** — el mismo mecanismo git-merge que ya sincroniza el engine. npm real solo si algun fork futuro necesita instalacion selectiva.

## Diferencia con `inbox`: alcance nacional primero, internacional deliberadamente abierto

A diferencia de mensajeria (donde los 4 proveedores eran conocidos desde el inicio), aqui el usuario fue explicito: construir el `PaymentAdapter` agnostico primero, dejar que la investigacion **recomiende** el sub-adapter nacional (no adivinar el nombre de antemano), y dejar el terreno listo para sub-adapters internacionales sin comprometerse a un proveedor especifico todavia — se decide cuando el negocio realmente expanda a otro mercado. La investigacion ya recomendo Wompi (ver `../../../adapters/wompi/INDEX.md`) — por eso esa carpeta ya existe con nombre real, a diferencia de los internacionales, que no se crean hasta que haya un mercado definido.

## Por que no un adapter "generico de pasarela" con adaptadores forzados a la fuerza

Las pasarelas de pago nacionales (PSE, agregadores colombianos) y las internacionales (Stripe, PayPal, etc.) tienen modelos de integracion estructuralmente distintos: unas son redirect-based (el cliente sale a un banco y vuelve), otras son API directa con tokenizacion de tarjeta. El contrato (`../../../adapters/_contracts/payment-adapter.ts`) ya contempla esto con `checkoutUrl` opcional en `ChargeResult` — un provider redirect-based lo llena, uno API-directa lo deja vacio. Esto se valida con el primer provider real, no se sobre-diseña ahora.
