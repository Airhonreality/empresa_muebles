# Plan t-194 — Fase A: corrección de formato y edición de montos (dinero)

**Estado:** ejecutando (autorizado por el Supervisor, 2026-11-25: "de nuevo" → continuar con Fase A).
**Zona:** cotizador (primitivas `components/veta/` + página del cotizador + parámetros financieros).
**Riesgo:** medio — toca solo presentación/edición; no cambia schema ni escrituras de totales.

## Diagnóstico (causa raíz verificada)

1. Las columnas monetarias son `numeric(14,2)` (`lib/db/schema.ts:337, 998-1000`). Postgres devuelve `"250000.00"`.
2. `aDigitos()` (página del cotizador y `parametros-financieros-modal.tsx`) borra el punto y pega los decimales como dígitos: `"250000.00"` → `"25000000"` (×100). Verificado con Node.
3. `precioUnitario` llega como string crudo a `MoneyInput`; su `handleChange` quita no-dígitos, así que un clic con cursor en la parte decimal y una tecla persiste un valor con ceros de más.
4. Al enfocar, `select()` se pierde con el `mouseup` del clic, y el cursor cae sobre un decimal.

## Alcance de Fase A (no incluye Fase B)

- `lib/utils/dinero.ts` (nuevo): `parteEnteraDb(s)` — toma la parte entera de un string numérico de Postgres sin multiplicar (`"250000.00"` → `"250000"`, `null` → `""`, sin dígitos → `""`).
- `components/veta/money-input.tsx`: normaliza el `value` entrante con `parteEnteraDb` (guarda sistémica para todos los llamadores, incluidos finanzas/compras) y corrige la selección al enfocar (selección en el primer `mouseup`).
- `components/veta/number-input.tsx`: misma corrección de selección.
- `app/erp/(modern)/cotizador/[proyectoId]/page.tsx` y `components/veta/parametros-financieros-modal.tsx`: `aDigitos` pasa a usar `parteEnteraDb` (mismo resultado para enteros, sin ×100).
- Pruebas: `lib/utils/dinero.test.ts` con `node:assert` (valores de la tabla diagnóstica).

## Fuera de alcance (Fase B, requiere checkpoint)

- Totales calculados en servidor, política de redondeo, auditoría de cambios de monto, validación Zod de montos (t-164 Lote 1), y limpieza de datos ya corruptos en producción (requiere consulta de solo lectura autorizada).
- Pantallas de finanzas/contratos: se tocan solo donde el primitivo `MoneyInput` las cubre automáticamente; las revisiones específicas de contratos van en Fase B.

## Criterios de aceptación

1. `parteEnteraDb("250000.00") === "250000"`, `parteEnteraDb("300000.00") === "300000"`, `parteEnteraDb("1234.56") === "1234"`, `parteEnteraDb(null) === ""`.
2. `MoneyInput` con `value="250000.00"` no muestra ni persiste valores ×100 al enfocar y desenfocar sin editar (no dispara `onChange`).
3. Al hacer clic en un `MoneyInput`/`NumberInput` enfocado por primera vez, el texto queda completamente seleccionado.
4. `npx tsc --noEmit`: 0 errores nuevos en archivos tocados.
5. `npx eslint` sobre archivos tocados: 0 errores nuevos.
6. `npx tsx lib/utils/dinero.test.ts`: pasa.

## Verificación pendiente de QA manual

- En `npm run dev` con datos reales de dev-local: campos de costos, imprevistos, descuento y ajuste muestran el valor correcto al enfocar; precio unitario idem.
