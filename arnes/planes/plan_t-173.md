# plan_t-173 — Catálogo de acabados con marca + tabla relacional espacio_variante_acabados

## Objetivo

`catalogo_acabados` gana un campo `marca` propio (hoy solo tiene nombre/familia/color/textura/imagen).
Se crea una tabla nueva `espacio_variante_acabados` que relaciona un espacio cotizado con N acabados
del catálogo, cada relación con su propio texto libre de destino (ej. "fachadas módulo X", "mesón de
isla") y un orden. Esta tabla reemplaza por completo a `espacio_variantes.colores` (jsonb) como fuente
de verdad de qué acabados tiene un espacio.

## Contexto (diagnóstico, 2026-09-30)

Javier quiere subir texturas de distintas marcas de melamina/mesones como catálogo tipado y asociar
varios acabados a un mismo espacio, cada uno con una nota de a qué parte del mueble aplica. Ya existe
la entidad "catálogo tipado" (`catalogo_acabados`, `lib/db/schema.ts:1501-1510`) con imagen y nombre,
y un patrón de puente CLASE (`catalogo_producto_acabados`, producto↔acabado posible, `es_default`
boolean). Lo que falta es el puente INSTANCIA con texto libre: hoy esa información vive solo como un
`jsonb` plano en `espacio_variantes.colores` (`lib/db/schema.ts:263`), sin fila relacional por
asociación y sin ningún campo de "para qué parte es". `arnes/nucleo/REGISTRO_DE_ENTIDADES.md:137-139`
documenta un concepto análogo (`modulos_acabados`) pero es para `modulos` (producción, post-contrato,
NUNCA implementado en schema.ts) — no se reutiliza aquí para no romper la separación cotización/
producción que el equipo ya decidió a propósito (mismo patrón que `grupos_item` vs `modulos`, t-157).

**Decisiones de Javier (2026-09-30, en vivo):**
1. Nivel de asociación: al **espacio** completo (`espacio_variantes`), no al ítem ni al grupo_item.
2. `espacio_variantes.colores` se **reemplaza por completo**, no convive como legacy permanente.
3. `catalogo_acabados` gana columna `marca` explícita.

## Zona única afectada

Zona: `datos` (`lib/db/schema.ts`, `drizzle/v3/`, las 3 implementaciones del store, `lib/data/actions/`)

## Tipo de tarea y riesgo derivado

```
Tipo: Datos / schema / contrato
Riesgo: alto
Frena al humano: sí
```

**Por qué alto pese a ser aditivo:** este mismo repo tiene DOS incidentes de producción documentados
(2026-09-10 `column "comentario" does not exist`, 2026-09-29 `column "plazo_semanas" does not exist`)
causados por agregar columnas/tablas a `schema.ts` sin aplicar la migración a la base real de
producción ANTES del deploy. Drizzle arma `SELECT`s que incluyen toda columna declarada — una tabla
nueva no es más segura que una columna nueva en este sentido.

## Archivos afectados

- `lib/db/schema.ts` (modificar): `catalogoAcabados` gana `marca: text()`; nueva tabla
  `espacioVarianteAcabados`:
  ```ts
  export const espacioVarianteAcabados = pgTable("espacio_variante_acabados", {
    id: uuid().defaultRandom().primaryKey().notNull(),
    espacioVarianteId: uuid("espacio_variante_id").notNull(),
    acabadoId: uuid("acabado_id").notNull(),
    descripcionUso: text("descripcion_uso").notNull(),
    orden: integer().default(0).notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  }, (table) => ({
    espacioVarianteAcabadosEspacioVarianteIdFk: foreignKey({
      columns: [table.espacioVarianteId], foreignColumns: [espacioVariantes.id],
    }).onDelete("cascade"),
    espacioVarianteAcabadosAcabadoIdFk: foreignKey({
      columns: [table.acabadoId], foreignColumns: [catalogoAcabados.id],
    }),
  }));
  ```
- `drizzle/v3/NNNN_espacio_variante_acabados.sql` (crear, escrita a mano): mismo método manual ya
  validado en este repo (`0012_atributos_tecnicos`, `0014`, `0015`) porque `drizzle-kit generate`
  sigue bloqueado por el choque de snapshots `0010`/`0011` (documentado desde 2026-08-28, sin
  resolver). `ALTER TABLE catalogo_acabados ADD COLUMN IF NOT EXISTS marca text;` + `CREATE TABLE IF
  NOT EXISTS espacio_variante_acabados (...)` + entrada en `drizzle/v3/meta/_journal.json`.
- `lib/data/contracts.ts` (modificar): interfaz gana `catalogoAcabados.actualizar(id, data)` y un
  nuevo namespace `espacioVarianteAcabados` con `listarPorEspacio(espacioVarianteId)` y
  `reemplazarTodos(espacioVarianteId, items: {acabadoId, descripcionUso, orden}[])` (reemplazo
  completo, mismo patrón que el plan de pagos de contratos — evita reconciliar altas/bajas/orden caso
  por caso).
- `lib/data/mock-store.ts` (modificar): implementación en memoria de lo anterior.
- `lib/data/drizzle-impl.ts` (modificar): implementación real contra Postgres (transacción:
  `delete` + `insert` por espacio, igual que el reemplazo de plan de pagos en t-166).
- `lib/data/fixtures.ts` (modificar): agregar `marca` a los 2 acabados mock existentes.
- `lib/data/actions/core.ts` o archivo nuevo `lib/data/actions/acabados.ts` (crear/modificar): server
  actions `actualizarAcabadoCatalogoAction`, `crearAcabadoCatalogoAction`,
  `reemplazarAcabadosEspacioAction`.
- `lib/data/espacio-acabados.test.ts` (crear): test `node:assert` puro sobre la lógica de
  reemplazo/orden (sin tocar DB real, patrón `DATABASE_URL` placeholder del repo).
- `arnes/tareas/t-173.json` (ya creado), `arnes/planes/plan_t-173.md` (este archivo).

## Criterios de aceptación mecánicamente verificables

1. `catalogoAcabados` incluye columna `marca` (text, nullable) — inspección de `schema.ts`.
2. `espacio_variante_acabados` existe con FK a `espacio_variantes`, FK a `catalogo_acabados`, columna
   `descripcion_uso` NOT NULL — inspección de `schema.ts` + migración aplicada.
3. Las 3 implementaciones del store exponen `catalogoAcabados.actualizar` y
   `espacioVarianteAcabados.listarPorEspacio` / `.reemplazarTodos`.
4. Test nuevo: crear 2 acabados asociados al mismo espacio con `descripcionUso` distinta → listar
   devuelve ambos en el orden esperado (verde).
5. Migración manual aplicada y verificada contra la base de producción real: `select
   current_database(), (select count(*) from catalogo_acabados), (select count(*) from
   espacio_variante_acabados)` ejecutado ANTES de que el código nuevo se despliegue — nunca contra
   `.env.local` (apunta a una base vacía a propósito, ver `arnes/estado.md`).
6. `npx tsc --noEmit` limpio.
7. `npx eslint .` sin errores ni warnings nuevos en los archivos tocados.

## Comandos de verificación

```
npx tsc --noEmit
npx eslint lib/db/schema.ts lib/data/contracts.ts lib/data/mock-store.ts lib/data/drizzle-impl.ts lib/data/fixtures.ts lib/data/actions/acabados.ts
DATABASE_URL='postgres://test:test@localhost:5432/no_connect_placeholder' npx tsx lib/data/espacio-acabados.test.ts
```

## Notas

- **Secuencia obligatoria de despliegue** (lección de los 2 incidentes previos): aplicar la migración
  a la base real de producción (Neon `v3-preview`, verificar host actual en `arnes/estado.md` antes de
  asumirlo) ANTES o en el mismo instante del push a `dev` — nunca después. `dev` es la Production
  Branch de Vercel: cualquier push despliega al dominio público real de inmediato.
- Esta tarea NO toca `app/erp/cotizador/**` ni ninguna UI — es solo la base de datos y el CRUD. La
  migración del picker del cotizador es t-175; la pantalla de alta de acabados es t-174. Ambas
  dependen de esta.
- No se elimina físicamente `espacio_variantes.colores` en esta tarea (columna queda, solo deja de
  ser la fuente de verdad una vez t-175 esté desplegada) — dropearla es limpieza de una tarea futura,
  separada, una vez confirmado que ningún código la lee.
