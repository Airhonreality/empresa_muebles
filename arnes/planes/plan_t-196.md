# Plan t-196 — Verificación de salud de montos: propuesta pública, PDF y formateadores

**Autorizado por el Supervisor (2026-11-25):** "ejecuta todo en secuencia, excepto el bloqueo por ×10".

## Hallazgos del barrido (grep literal + lectura)
- Propuesta pública web y PDF de propuesta calculaban totales por su cuenta (IVA con `Math.round` sobre suma sin redondear; hitos con `Math.round` suelto). **Corregido:** ambos usan `calcularTotalesCotizacion` y `repartirHitos`.
- `lib/utils/format.ts` (`formatCurrency`), usado por listado y detalle de cotizador, clientes y catálogo, quitaba todo lo que no fuera dígito: "250000.00" mostraba ×100. **Corregido** con `parteEnteraDb`.
- Herramientas y pedidos-web: mismo filtro en formateo, guardado y orden. **Corregido.**
- Verificado y **sin cambio** (intencional): campos de rango de precio de portafolio ("desde $8.000.000 COP", regla F-03 R2 de nunca dar cifra exacta). `NumberInput` de finanzas solo son porcentajes y umbrales de gates.
- Verificado sin problema: `lib/pdf/cotizacion.ts` no calcula totales; `Number(...)` sobre strings de BD es correcto; `numero-a-letras` solo formatea texto.
- Pendiente de cleanup (no es bug): ~25 copias locales de `formatCOP(number)`. Reciben números, así que son correctas; consolidarlas es mantenimiento, no riesgo de montos.

## Criterios de aceptación
1. `formatCurrency("250000.00")` = `$ 250.000` (test en `lib/utils/format.test.ts`).
2. Propuesta web y PDF usan el mismo cálculo que el ERP.
3. Tests, `tsc`, eslint y `next build` en verde.
