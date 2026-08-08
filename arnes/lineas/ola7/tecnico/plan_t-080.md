# Plan: F3 — Schema cronograma doble + gate E-33 (desfase con causa)

**ID de tarea:** t-080
**Zona:** datos
**Tipo:** datos_contrato
**Riesgo:** alto

## Objetivo

El ERP podrá guardar el cronograma de cada proyecto de producción en dos líneas (`contractual` inmutable e `interna` recalculable) y registrar desfases de fechas solo cuando tengan causa estructurada (`interna`, `externa`, `cambio_contrato`), motivo y composición causal. Al aplicar un desfase se recalculan SOLO las fechas de la línea interna. Esto da base de datos para auditar atrasos y alimentar comisiones en F6.

## Archivos afectados

- `lib/db/schema.ts`: añadir tablas `cronogramas`, `cronograma_etapas`, `desfases_cronograma`, `check_produccion`, `novedades_criticas` (y las de gates `verificaciones`, `schemas_proyecto`, `bom_materiales`, `retomas`, `reprocesos` que existan en el consolidado F3) + ampliar `proyectos` con `verificador_id`, `fecha_entrada_desarrollo`, `comercial_vendedor_id` (la mayoría ya en schema de F0/F1).
- `drizzle/0002_cronograma_f3.sql`: migración aditiva contra dev-local.
- `lib/modules/f3/cronograma.ts`: lógica del gate E-33 (predicado P33, aplicar desfase, recalcular solo línea interna).
- `lib/modules/f3/cronograma.test.ts`: tests del gate contra dev-local.
- `lib/modules/f0/eventos.ts`: (si el catálogo no cubre E-14/E-33/E-59/E-60) completar códigos.
- `arnes/planes/plan_t-080.md` (este plan).

## Decisiones cerradas que respeta (no se re-discuten)

- I-034: cronograma doble — contractual inmutable, interna recalcula.
- I-025/E-59: cronograma ideal 15 días; check 15 días con 3 desenlaces; adelanto NO pasa por E-33.
- E-33: desfase con causa {interna,externa,cambio_contrato} + motivo + composición_causal; recálculo SOLO `linea='interna'`.
- I-026/I-035: verificador único = comercial vendedor (`proyectos.verificador_id`).

## Criterios de aceptación

1. `npx tsc --noEmit` → 0 errores en todo el árbol.
2. `npx eslint .` → 0 errores.
3. `npm run db:migrate` contra dev-local crea las tablas F3 (ver inventario de tablas en `d3_schema_consolidado.md`) sin errores (solo NOTICE por longitud de constraint, no bloqueante).
4. Predicado P33 (test `cronograma.test.ts`): retorna true SOLO con desfase aplicado + causa válida + motivo no vacío + composición no vacía; false en todo lo demás.
5. Verificación por query: al aplicar un desfase, SOLO `cronograma_etapas.linea='interna'` ve cambios de fecha; la `contractual` queda intacta.
6. Round-trip: desfase registrado y releído contra dev-local sin pérdida de causa/motivo/composición.

## Verificación

- `npx tsc --noEmit` → criterios 1
- `npx eslint .` → criterio 2
- `DATABASE_URL='postgres://<dev-local>' npm run db:migrate` → criterio 3
- `DATABASE_URL='postgres://<dev-local>' npx tsx lib/modules/f3/cronograma.test.ts` → criterios 4,5,6

## Notas

- Contra `dev-local` únicamente. Nunca producción.
- `tipo_evento` de cronograma como `text` validado en la app (decisión F0), no enum DB.
- t-081 (P-09) y t-082 (logs) dependen de este schema: serializar tras QA de t-080.

## Aprobación del plan

- **Revisor:** Javier (Supervisor)
- **Estado:** pendiente
- **Fecha de aprobación:** __