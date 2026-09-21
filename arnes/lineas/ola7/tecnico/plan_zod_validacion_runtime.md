# Plan — Zod: validación runtime en el borde de escritura (Server Actions) + manifest derivado para el protocolo de agente

- **Fecha:** 2026-09-18
- **Origen:** hallazgo de la sesión agente ↔ Supervisor sobre cómo debe el agente leer/editar la DB de producción con protocolo seguro
- **Autor:** Orquestador (asistente), para revisión del Supervisor
- **Estado:** PLAN propuesto — **pendiente checkpoint del Supervisor** (decisión de arquitectura, AGENTS.md: "Antes de decidir el stack/arquitectura final de destino")
- **Rama:** `dev` (V3 "Veta Dorada Real"). No requiere migración de schema ni toques a `lib/db/schema.ts`.
- **Relacionado:** `arnes/tareas/t-164.json` · decisión de manifest derivado (discusión 2026-09-18)

---

## 1. El hoyo (síntoma + evidencia mecánica)

Las server actions de escritura del ERP **confían en tipos TypeScript puro que desaparecen en runtime**. No hay `zod` ni `safeParse` en ninguna acción (`rg safeParse` en `lib/` = 0 capacidades runtime; `rg zod` solo arroja wraps de tipos, no validación).

Evidencia concreta (lectura directa, 2026-09-18):

| Acción | Ubicación | Input | Validación runtime |
|---|---|---|---|
| `actualizarEspacioAction` | `lib/data/actions/core.ts:314-317` | `Partial<Pick<EspacioVariante, 'nombreEspacio' \| 'nombreVariante' \| 'tipoEspacio' \| 'descripcion' \| 'activa' \| 'visibleEnPropuestaPublica' \| 'colores' \| 'fotosEspacio' \| 'fotosDisenio' \| 'fotosReferencia'>>` | Ninguna |
| `actualizarClienteAction` | `core.ts:259-261` | `Partial<Omit<Cliente, 'id'>>` | Ninguna |
| `actualizarJornadasAction` | `core.ts:306-308` | `{ jornadasDesarrolloTecnico; jornadasEnsamblajeTaller; jornadasInstalacionObra }` | Ninguna |
| `crearEspacioAction` | `core.ts:269-303` | `Partial<EspacioVariante> & { proyectoId; nombreEspacio }` | Ninguna (transacción, invariantes solo por código) |

**Dos consecuencias:**

1. **Superficie de red abierta.** En Next.js cada server action es un endpoint HTTP invocable con payloads arbitrarios, no solo por la UI. Un mensaje malformado hoy entra crudo al `update` — no se rechaza.
2. **El protocolo de agente lo exige.** Para que el agente edite producción con seguridad (discusión de la sesión), el comando que recibe debe validarse en runtime contra un schema. Zod resuelve el problema de fondo de una vez: **schema = validador runtime + tipo compile-time (`z.infer`), una sola fuente**. El "manifest" de campos editables deja de ser tipos volátiles (desaparecen en runtime) y pasa a ser schemas reales.

## 2. Por qué Zod y no otra cosa

- **Schema → tipo derivado:** `EspacioEditable = z.object({...}); type EspacioEditable = z.infer<typeof EspacioEditable>` elimina la doble declaración (el TP y el validador nacen del mismo lugar). Esto es exactamente el "manifest derivado" que buscábamos: el mismo schema que valida también define qué campos son editables.
- **No es refactor masivo:** no se tocan los tipos internos de dominio ni el schema de DB; solo el **borde de escritura**.
- **Alcance quirúrgico:** las queries internas siguen con TS puro — su input no cruza red.

## 3. Alcance

**Dentro:** todas las server actions de **escritura** en `lib/data/actions/*.ts` (el borde que cruza red y puede mutar DB).

**Fuera (explícitamente):**
- Queries/lecturas (no validan runtime; no lo necesitan).
- `lib/db/schema.ts` y migraciones (cero toques — este plan no es de schema).
- Refactor de tipos internos de dominio.
- El protocolo CRUD del agente (`scripts/crud-erp.ts` con dry-run/apply) — **queda diseñado en la Fase D como entrada de la siguiente sesión**, no se ejecuta en esta tarea. Esta tarea siembra la base (los schemas) que ese protocolo consumirá.

## 4. Fases

### Fase A — Inventario del borde de escritura
- Enumerar TODAS las server actions de escritura en `lib/data/actions/*.ts` con: firma actual, tipo de input, si valida runtime (hoy: ninguna), invariantes de negocio.
- Clasificarlas por **nivel de riesgo**:
  1. **Crítico — dinero/contratos:** cotizador (espacio, ítems, jornadas, parámetros financieros, proyecto), cliente, contrato/hitos.
  2. **Operativo:** producción (retomas, verificaciones, novedades), talleres/calidad/entrega/garantía.
  3. **Maestro/tienda:** catálogo, productos tienda, portafolio, leeds, etc.
- Entregable: tabla en este plan (o anexo) — cada fila con su acción y nivel.

### Fase B — Base Zod
- Agregar dependencia `zod`.
- Crear `lib/validacion/` con un archivo por dominio de mutación: `cotizador.ts`, `finanzas.ts`, `produccion.ts`, `tienda.ts`, `maestros.ts`.
- Wrapper único `validarEntrada(schema, dato)` → devuelve el dato tipado o lanza `Error('Entrada inválida: <camino>, <mensaje>')` (error claro en español, consistente con la app).
- Cada dominio exporta `z.infer` → las acciones importan el tipo derivado (el compilador garantiza que el tipo validado == el tipo que el `update` espera).

### Fase C — Conversión por lotes prioritarios
1. **Lote 1 (crítico):** `crear/actualizarEspacio`, `actualizarJornadas`, `crear/actualizarCliente`, ítems del cotizador, parámetros financieros, `crearProyectoAction`, acciones de contrato/hitos. Cada acción: schema → `safeParse` al inicio → usa el tipo derivado.
2. **Lote 2 (operativo):** producción, taller/calidad/entrega/garantía.
3. **Lote 3 (maestro/tienda):** catálogo, productos tienda, portafolio, leeds.
- Cada lote mantiene `tsc`/`eslint`/`build` limpio antes de pasar al siguiente. El tipo derivado de `z.infer` debe ser **compatible** con el `Pick`/`Omit` actual (0 duplicación manual).

### Fase D — Diseño del protocolo de agente (NO ejecutar aquí; dejar delineado)
- El manifest derivado = los schemas de `lib/validacion/` (same source que las acciones; el agente no puede escribir campos que no tengan schema).
- Borrador (para tarea siguiente): `scripts/crud-erp.ts` con `leer` (libre) y `editar` (schema-validado + dry-run/apply + snapshot + transacción + bitácora), tal como se acordó con el Supervisor en la sesión.
- **Guard que NO depende del manifest:** aprobación humana del diff antes de `--apply` (campo ≠ valor; la aprobación de dry-run es insustituible).

### Fase E — Verificación
- Tests por schema (`*.test.ts`, patrón `node:assert` del repo, con `DATABASE_URL` placeholder para no conectar).
- `npx tsc --noEmit`, `npx eslint .`, `npx next build`.
- Confirmar que ninguna acción queda sin schema salvo excepción explícitamente documentada en el plan.

## 5. Reglas del plan (anti-patrones)

1. **Cero duplicación de tipos:** el tipo SIEMPRE se deriva de `z.infer`. Si se necesita re-declarar un tipo, es señal de schema mal diseñado.
2. **No expandir el alcance:** este plan NO toca schema de DB, NO refactoriza dominios internos, NO construye el CRUD del agente.
3. **Prioridad por dinero:** jamás se deja una acción de dinero/contratos sin validar mientras se cae en mejoras de menor riesgo.
4. **Cada lote cierra verde** (tsc/eslint/build) antes de abrir el siguiente.

## 6. Criterios de aceptación (espejo de t-164)

- Toda acción de escritura valida entrada con schema zod + `safeParse` al inicio (o excepción documentada).
- Tipos derivados con `z.infer`, 0 re-declaraciones.
- Payload malformado → error claro sin tocar DB.
- Priorización por riesgo cumplida.
- Verificaciones mecánicas en verde + tests por schema.
- Sin migraciones ni toques a `lib/db/schema.ts`.

## 7. Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Zod rechaza payloads legítimos que la UI envíe (regresión de compat) | Cada lote prueba con la UI real (el punto de entrada de la UI no cambia; el schema cubre al menos lo que la UI ya envía). Si un campo de la UI no está en el schema, el error lo delata al instante. |
| Deriva del scope a refactor mayor | Regla nº 2 del plan + checkpoint del Supervisor por lote si hay duda. |
| Performance negligente en validación por request | Schemas ligeros por dominio (no validar el objeto completo cuando solo cambian 2 campos); medir solo si hay sospecha. |

## 8. Checkpoint y próxima acción

- **Checkpoint requerido del Supervisor:** aprobar la incorporación de Zod (dependencia nueva + decisión de arquitectura de borde) y el orden de lotes.
- **Próxima acción permitida tras aprobación:** ejecutar Fase A (inventario) y Fase B (base Zod), luego Lote 1.
- **Siguiente sesión (fuera de esta tarea):** protocolo de agente (Fase D) como tarea propia de `scripts/`.