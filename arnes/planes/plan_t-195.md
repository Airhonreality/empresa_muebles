# Plan t-195 — Fase B: cálculo único de montos, auditoría, validación y reglas de contrato/finanzas

**Aprobado por el Supervisor (2026-11-25):** "perfecto aprobado", con la política de redondeo propuesta
(línea a pesos enteros half-up; IVA una sola vez sobre la base; hitos con suma exacta).
**Zonas:** cotizador (totales, contrato, cuenta de cobro), datos/finanzas (pago de obligaciones, validación de movimientos), `lib/dinero` (nuevo).
**Riesgo:** alto — toca cálculos de dinero y escrituras de proyecto. **No cambia schema.**

## Entregables

1. `lib/dinero/calculo.ts` (nuevo, puro): `redondearPesos` (half-up simétrico), `calcularTotalLinea`, `calcularTotalesCotizacion`, `repartirHitos` (la diferencia de redondeo la absorbe el último hito porcentual, máx. 1 peso por hito; no fuerza diferencias que no son redondeo).
2. Un solo cálculo de totales: página del cotizador usa `calcularTotalesCotizacion`; `calcularTotalLinea` de `lib/data/queries/optimistic.ts` delega en `lib/dinero/calculo`.
3. Contrato y cuenta de cobro usan `repartirHitos` (antes cada una redondeaba por su lado); el plan base 50/25/25 también.
4. Validación en el borde (`lib/validacion/cotizador.ts`, `lib/validacion/finanzas.ts`): montos en pesos enteros, máx. 12 dígitos, acepta `250000` y `250000.00`, rechaza decimales reales. `precioUnitario` queda con la misma regla.
5. Auditoría: `actualizarParametrosFinancierosAction` escribe en `audit_logs` (campo, antes, después, usuario, rol) **en la misma transacción** que el UPDATE. Solo registra los campos que realmente cambian.
6. Edición de montos: el primitivo `MoneyInput` ya no escribe por pausa; confirma con Enter o al salir del campo, y Escape revierte sin escribir (`useDebouncedInput`, `delayMs = 0`, `revertir()`).
7. Contratos: con montos fijos mezclados, la suma en pesos debe cuadrar con el valor total (`requisitosPendientes` recibe `diferenciaMontosHitosCOP`; el modal lo calcula con `repartirHitos`).
8. Finanzas: el pago de obligación rechaza montos no enteros o no positivos, y un pago que supera el saldo lanza un error con el saldo pendiente (antes devolvía `null` en silencio).

## Fuera de alcance (decisión del Supervisor pendiente)

- **Corrección de datos de producción.** Auditoría de solo lectura (2026-11-25, `READ ONLY`): proyectos sin decimales ni montos > 50M; ítems: 4 precios de miles de millones **anulados** (`ae81a9ed…`, `0c844c18…`, `54cda256…`, `daeacca7…`) y 2 ítems activos con `total_linea` fraccionario (`3ce90dbb…` → 2.491.762,50 y `d1d08f6e…` → 867.502,50; política: 2.491.763 y 867.503). **No se escribió nada en producción.** Cada corrección requiere decisión fila por fila.
- Bloqueo por ×10 en la UI (hoy solo queda en el plan; no se implementó la confirmación).
- Módulos congelados (compras, taller, garantía, etc.).

## Verificación ejecutada

- `npx tsx` (todas en verde): `lib/dinero/calculo.test.ts` 10/10; `lib/validacion/montos.test.ts` 5/5; `lib/validacion/cotizador.test.ts` 21/21; `lib/validacion/finanzas.test.ts` OK; `lib/utils/dinero.test.ts` 3/3; `lib/utils/numero.test.ts` OK; `lib/data/contrato-hitos-montos.test.ts` 4/4; `lib/data/queries/optimistic.test.ts` 36/36; `lib/data/contrato-validacion.test.ts` OK.
- `npx tsc --noEmit`: 0 errores. `npx eslint` sobre archivos tocados: 0 errores.
- `lib/data/mock-store.test.ts`: falla preexistente en línea 1199 (f3-portafolio); también requiere `SESSION_SECRET` por la cadena de importación (preexistente, no introducido aquí).
- `next build` con placeholder: compilado con éxito.

## Pendiente antes de dar por cerrada

- QA manual en `npm run dev` / producción: escribir y confirmar montos con Enter, Escape, y salir del campo; ver el reparto de hitos en contrato y cuenta de cobro.
