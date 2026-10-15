# Plan de auditoría — integridad referencial y modelo de cascadas

**Línea:** `auditoria_cascadas`. **Creada:** 2026-10-15.
**Origen inmediato:** `hallazgo_2026-10-15_cascada_espacios.md` (bug de producción al eliminar un espacio del cotizador).
**Alcance:** todo el schema de V3 (`lib/db/schema.ts` + base real), no solo el caso que abrió la línea.

> Este documento es un **diagnóstico + plan**, no una ejecución. Ninguna migración de este plan se aplica sin checkpoint del Supervisor (regla de `AGENTS.md`).

---

## 1. Por qué existe esta auditoría

Un flujo de negocio se bloqueó en producción porque el código que borra un espacio se olvidó de una tabla hija. Es un síntoma de un modelo, no un accidente aislado. El objetivo de esta auditoría es **diagnosticar el modelo de borrado/cascadas de todo el schema**, proponer una mejora aplicable de forma general, y dejar una red de seguridad que impida volver a fallar por lo mismo.

## 2. Es el mismo problema en cualquier schema (por qué es general, no de este caso)

Un sistema con FKs `NO ACTION` y borrados en cascada escritos a mano tiene tres propiedades indeseables, presentes en cualquier proyecto que use el patrón:
1. **La corrección de un `DELETE` no es local.** Depende de código en otro archivo que puede no actualizarse cuando se agrega una tabla.
2. **Los huecos son silenciosos hasta que hay datos.** Un hijo sin cobertura no rompe nada mientras esté vacío (hoy `grupos_item`/`portafolio` cuelgan de espacios y están en 0 filas — bombas de tiempo).
3. **El error que ve el usuario es genérico** (500 / React #418), sin pista de la tabla culpable.

Por eso el entregable no es «arreglar este caso» sino un **método** y una **red de seguridad** aplicables a todo el schema y reutilizables en otros proyectos.

## 3. Diagnóstico del modelo actual (evidencia 2026-10-15, base real `ep-muddy-cherry`)

Extraído de `information_schema` (fuente de verdad, no de `schema.ts`):

- **74 tablas** en `public`.
- **119 foreign keys**: **115 `NO ACTION`**, **2 `CASCADE`**, **2 `SET NULL`**.
  - `CASCADE`: `eventos_conversion_offline.proyecto_id`, `notas_reunion.proyecto_id`.
  - `SET NULL`: `notas_reunion.espacio_variante_id`, y otro de bajo impacto.
- **Padres con más hijos:** `proyectos` (36 hijos, solo 1 con cascade), `personas` (13), `clientes` (7), `ordenes_compra` (7), `espacio_variantes` (7).

**Consecuencia estructural:** con `NO ACTION`, la base **no** borra hijos; solo rechaza el `DELETE` del padre si quedan. Así que la cascada vive **en el código**, escrita a mano:
- `eliminarProyectoAction`: ~40 `DELETE` encadenados a mano (uno por tabla hija y por nietos).
- `eliminarEspacioAction`: 4 (tras el fix).
- `eliminarProductoCatalogoAction`, etc.

**Huecos ya detectados en esta primera pasada (no exhaustiva):**
| Acción | Hijo que no cubre | Riesgo hoy |
|--------|-------------------|------------|
| `eliminarEspacioAction` | `espacio_variante_acabados` | **explotó** (fix `e7961a1`) |
| `eliminarEspacioAction` | `grupos_item`, `portafolio` | latente (0 filas hoy) |
| `eliminarProyectoAction` | `espacio_variante_acabados` (vía espacios) | latente (hoy el proyecto se borra por otra vía o no hay datos) |

**Por qué se construyó así (contexto, no excusa):** `eliminarEspacioAction` tiene una **guardia de negocio** — `VarianteNoEliminableError` si la variante ya tiene BOM (`bom_material`) o módulos (`modulos`), porque «cuenta en producción». Esa guardia necesita código *antes* del delete y no se puede expresar como FK. El patrón manual nació de ahí y se propagó a todo.

## 4. Objetivo de la segunda auditoría

1. **Censo completo:** listar las 119 FK con su `delete_rule` real y clasificar **cada** relación en una política.
2. **Cobertura de borrados:** para cada acción `eliminar*`/`borrar*`, comparar sus hijos contra el mapa real y listar huecos.
3. **Decisión de modelo** (ver §6) por relación, con checkpoint del Supervisor.
4. **Migración idempotente** que materialice las políticas en la base (las que apliquen).
5. **Red de seguridad mecánica** que impida que un hueco nuevo vuelva a desplegarse.

## 5. Metodología (repetible; sirve para cualquier schema)

1. **Extraer el grafo de FK del motor, no del código.** `information_schema.table_constraints` + `key_column_usage` + `constraint_column_usage` + `referential_constraints` (padre, hijo, columna, `delete_rule`). El `schema.ts` puede mentir por drift entre lo declarado y la base real (ver `arnes/estado.md`, reconciliación de entorno).
2. **Construir el mapa padre→hijos** con su `delete_rule` y ordenarlo por fan-out.
3. **Enumerar las acciones de borrado** (`grep` `DELETE FROM`/`tx.delete` en `lib/data/actions/`, `lib/modules/`) y, para cada una, listar qué tablas toca.
4. **Diff:** toda relación hijo→padre `NO ACTION` no cubierta por ninguna acción = **hallazgo**.
5. **Clasificar política por relación** (ver §6 abajo).
6. **Proponer la migración**: `ALTER TABLE <hijo> DROP CONSTRAINT <fk>; ALTER TABLE <hijo> ADD CONSTRAINT <fk> … ON DELETE <política>;` **idempotente** (`IF EXISTS` / `DO $$ … $$`), porque `drizzle-kit migrate` está desincronizado contra esta base (ver `estado.md`, migración 0027). Aplicar igual que se hizo con 0027: SQL a mano, verificado ANTES/DESPUÉS.
7. **Red de seguridad (test de cobertura):** un test que lea `information_schema`, recorra las acciones de borrado y **falle** si aparece un hijo `NO ACTION` sin política declarada. Es el punto que convierte «acordarse» en «no se puede olvidar». Debe correr con `DATABASE_URL` placeholder (patrón actual: `npx tsx …test.ts`).
8. **QA:** aplicar en `dev-local`, ejecutar borrados reales de un proyecto/espacio con hijos, y solo entonces checkpoint para producción.

## 6. Opciones de diseño (decisión del Supervisor)

| Opción | Qué es | Ventaja | Costo / riesgo |
|--------|--------|---------|----------------|
| **A. Cascada en la BD** | `ON DELETE CASCADE` en las FK de detalle puro | el código deja de listar hijos; imposible olvidarse | migración sobre producción; pierde trazabilidad si se borra en silencio |
| **B. Cascada manual + test** | mantener los `DELETE` a mano, agregar el test de cobertura | sin migración; conserva guardias | el test hay que mantenerlo; sigue siendo manual |
| **C. Híbrido (recomendado)** | `CASCADE` en detalle puro (sin guardia); `RESTRICT`/guardia en producción (BOM, módulos); `SET NULL` en referencias opcionales | lo mejor de A y B | requiere clasificar relación por relación |

**Regla transversal de C:** la guardia de negocio (¿cuenta en producción?) corre **primero**, en la app; recién si pasa, se delega el borrado de hijos a la BD. La FK no puede expresar la guardia, pero sí el resto.

**Alternativas a evaluar en la auditoría (no decididas):**
- **Soft delete** (`eliminado_en`) para entidades que «no deberían borrarse nunca» — evita el problema de raíz pero cambia todas las consultas.
- **Triggers** de limpieza para tablas de auditoría/linaje.
- **`ON DELETE RESTRICT` explícito** (en vez del `NO ACTION` implícito) para documentar intención — mismo comportamiento, más claro.

## 7. Fuera de alcance / riesgos de la auditoría

- **No** tocar datos de negocio: es diagnóstico + migración de **constraints**, sin borrar filas.
- **Reconciliación de entorno pendiente** (`.env.local` `DATABASE_URL` apunta a base vacía; producción es `ep-muddy-cherry`): cualquier prueba de borrado real debe correr contra una base con datos, nunca contra producción sin checkpoint.
- Aplicar FK nuevas en producción es tan delicado como la 0027: SQL idempotente y verificación ANTES/DESPUÉS obligatorias.

## 8. Criterios de aceptación de la auditoría

1. Tabla de las **119 relaciones FK** con política asignada (CASCADE / RESTRICT+guardia / SET NULL) y justificación.
2. Lista de **huecos de cobertura** encontrados en las acciones `eliminar*` (más allá de los 4 ya detectados).
3. **Migración idempotente** propuesta (y aplicada solo tras checkpoint), verificada en `dev-local`.
4. **Test de cobertura** verde que impida reincidir.
5. `npx tsc --noEmit` y `npx eslint .` limpios; sin secretos en archivos versionados.
6. Checkpoint del Supervisor antes de aplicar en producción.
