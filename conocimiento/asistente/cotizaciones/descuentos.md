---
titulo: Descuento comercial en una cotización
dueno: "area-cotizaciones"
revisado: 2026-11-26
permiso: cotizador:escribir
---

# Descuento comercial en una cotización

## Qué es

- El descuento comercial de un proyecto es un **monto en pesos**, no un porcentaje. Se guarda en el campo `descuentoComercial`.
- Se resta del subtotal de la cotización. El IVA, si aplica, se calcula **después** del descuento.

## Quién puede aplicarlo

- Aplicar un descuento (o un precio libre) desde el asistente requiere **rol admin**. No existe un permiso aparte para esto: la matriz del chat reserva la función solo a admin.
- Quien no es admin que pida un descuento recibe un rechazo y no se crea nada.
- Si no se indica descuento, la cotización queda sin descuento (valor 0).

## Límite

- Un descuento no puede ser mayor que el total de materiales de la cotización. En esta versión el asistente no aplica descuentos; se hace en el cotizador.

## Cómo se calcula

- Subtotal = materiales + mano de obra + costos operativos + imprevistos − descuento + ajuste. Cada concepto se redondea a pesos enteros antes de sumar.
- Total = subtotal + IVA.

Fuente en el código: `calcularTotalesCotizacion` en `lib/dinero/calculo.ts`, y la validación de permisos en `lib/asistente/matriz-chat.ts` (`puedeDescontarChat`).
