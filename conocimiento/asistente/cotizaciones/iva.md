---
titulo: IVA en una cotización
dueno: "area-cotizaciones"
revisado: 2026-11-26
permiso: cotizador:leer
---

# IVA en una cotización

## Campos

- `aplicaIva`: indica si la cotización lleva IVA. Por defecto es **no** (false).
- `porcentajeIva`: porcentaje que se aplica. Por defecto es **19**.

## Cómo se calcula

1. Se calcula el subtotal (ver el documento de descuentos).
2. Si `aplicaIva` es verdadero, el IVA = subtotal × porcentaje / 100, redondeado a pesos enteros (mitad hacia arriba) **una sola vez**.
3. Total = subtotal + IVA.
4. Si `aplicaIva` es falso, el IVA es 0 y el total es igual al subtotal.

## En el asistente

- Al crear una cotización, el asistente aplica IVA solo si el empleado lo pide. Si no lo dice, la cotización va sin IVA.
- El asistente usa el porcentaje por defecto (19). No hay otro porcentaje disponible desde el chat.

Fuente en el código: `calcularTotalesCotizacion` en `lib/dinero/calculo.ts` (política de montos aprobada por el Supervisor, 2026-11-25).
