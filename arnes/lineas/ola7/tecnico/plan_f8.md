# Plan F8 — Hardening / Integraciones

**Fecha:** 2026-08-08 · **Estado:** aprobado (checkpoint Supervisor) · **Fase:** F8 · **Riesgo:** medio

**Rol:** Iniciador. **Plantilla:** `PLANTILLA_HARDENING.md`.

---

## Contexto de V3 (crítico para leer §2)

La rama `dev` huérfana de V3 contiene **exclusivamente**:
- `lib/db/schema.ts` — 26 tablas (18 legacy + 8 F0)
- `scripts/seed-dev.ts` — 7 roles + 4 params v1
- 6 páginas PoC del Diamante 4 (landing, cotizador, cronograma, badge-mockups, layout, page) — sin lógica de negocio

**No existe:** `lib/auth/`, `lib/erp-nav.ts`, `lib/modules/`, `app/api/`, `app/app/`.

El hardening de código que la plantilla asume (migrar `session.rolEmpleado`→`session.roles`, `erp-nav.ts`, APIs) **no aplica sobre archivos existentes**. En su lugar, esta fase documenta **restricciones de diseño** que el futuro código DEBE cumplir, para que cuando se escriba `lib/auth/`, `lib/erp-nav.ts` y las APIs en F0-F7, nazcan alineados con el schema corregido.

---

## 1. Inventario de migración de schema

*Fuente: `REGISTRO_DE_ENTIDADES.md`, `mini_diamante_check_produccion.md`, `schema.ts` actual.*

| # | Tabla | Columna / Enum | Tipo actual | Tipo destino | ¿Tiene datos? | Estrategia |
|---|---|---|---|---|---|---|
| 1 | — | `rol_empleado` (enum Drizzle) | `pgEnum(['admin','comercial','desarrollador','compras','taller','finanzas','supervisora_qa'])` | **Eliminado** | No (solo definición) | Borrar declaración del enum + columna `usuarios.rolEmpleado` |
| 2 | `usuarios` | `rolEmpleado` | `rolEmpleado("rol_empleado")` nullable | **Eliminada** | No (tabla vacía en V3) | Migración `DROP COLUMN`. La FK `persona_id` ya existe → única ruta de rol |
| 3 | `usuarios` | `persona_id` | nullable FK→personas | **NOT NULL** | No | Migración `SET NOT NULL` |
| 4 | `ordenes_trabajo` | `estado` | `text` | `estado_orden` (enum) | No | Crear enum `pgEnum('estado_orden', ['pendiente','en_progreso','completada','cancelada'])` + `ALTER COLUMN TYPE` |
| 5 | `obligaciones_pendientes` | `estado` | `text` | `estado_obligacion` (enum) | No | Crear enum `pgEnum('estado_obligacion', ['pendiente','parcial','pagada','vencida','cancelada'])` + `ALTER COLUMN TYPE` |
| 6 | `movimientos_financieros` | `fecha` | `text` | `timestamp` (mode: 'date') | No | `ALTER COLUMN TYPE timestamp USING NULL` |
| 7 | `movimientos_financieros` | `estado` | `text` | `estado_movimiento` (enum) | No | Crear enum `pgEnum('estado_movimiento', ['asentado','anulado','compensado'])` + `ALTER COLUMN TYPE` |
| 8 | `tareas_produccion` | `estado` | `text` | `estado_tarea` (enum) | No | Crear enum `pgEnum('estado_tarea', ['pendiente','en_progreso','completada','bloqueada'])` + `ALTER COLUMN TYPE` |
| 9 | `pedidos_web` | `estado` | `text` | `estado_pedido` (enum) | No | Crear enum `pgEnum('estado_pedido', ['pendiente','confirmado','en_produccion','despachado','entregado','cancelado'])` + `ALTER COLUMN TYPE` |

**Regla de oro cumplida:** todos los enums son aditivos — incluyen los valores actuales (que son los defaults en schema.ts) más los nuevos. Cero backfills necesarios (V3 no tiene datos de negocio en dev-local — solo roles y params de seed).

**Nota sobre `estadoProyecto`:** ya es un enum en schema.ts (`estado_proyecto` con 8 valores). Se conserva tal cual. Los estados canónicos del `REGISTRO_DE_ENTIDADES.md:59` son 10, pero los 2 nuevos (`borrador`, `en_revision`) se añadirán en F2 cuando se codifique el cotizador, no en F8.

---

## 2. Módulos de código impactados

### 2.1 Archivos que SÍ existen y se modifican

| # | Archivo | Cambio | Motivo |
|---|---|---|---|
| 1 | `lib/db/schema.ts` | Eliminar `rolEmpleado` enum + columna `usuarios.rolEmpleado`. `usuarios.persona_id` → NOT NULL. Añadir 6 enums nuevos (§1 #4–#9). Cambiar `movimientos_financieros.fecha` a `timestamp`. | Schema hardening |
| 2 | `scripts/seed-dev.ts` | Eliminar `umbral_novedad_check15` del array `PARAMETROS_BASE`. Añadir 4 params A-02: `umbral_todo_bien_pct`(0.95), `umbral_extremo_pct`(0.70), `reduccion_comision_novedad_pct`(0.50), `reduccion_comision_extremo_pct`(1.00). | Seed alineado con A-02 |

### 2.2 Restricciones de diseño para código futuro (NO se modifica nada — no existe)

| Restricción | Archivo(s) futuros afectados | Regla |
|---|---|---|
| R-01 | `lib/auth/session.ts` (futuro) | La sesión DEBE cargar roles como `string[]` desde `personas_roles` JOIN `roles` (intersección en guards). Nunca leer `usuarios.rolEmpleado`. |
| R-02 | `lib/auth/require-session.ts` (futuro) | `requireEmpleado(rolesPermitidos: string[])` DEBE hacer intersección `session.roles ∩ rolesPermitidos`, no igualdad simple. |
| R-03 | `lib/erp-nav.ts` (futuro) | Navegación condicional DEBE usar `session.roles.includes('admin')`, no `session.rol === 'admin'`. |
| R-04 | `lib/modules/f0/parametros.ts` (futuro, plan t-074) | Ver §5 — diseño documentado acá, código en F0. |
| R-05 | `app/api/erp/**/route.ts` (futuro) | `requireEmpleado(['admin','comercial'])` — la firma externa no cambia, la resolución interna usa array. Transparente si el helper se actualiza. |
| R-06 | `lib/modules/equipo/queries.ts` (futuro) | `crearEmpleado` DEBE insertar en `personas_roles`, no setear `usuarios.rolEmpleado`. |

### 2.3 Archivos de arnés que se actualizan en esta fase

| # | Archivo | Cambio |
|---|---|---|
| A-1 | `nucleo/glosario_h07.md` | Añadir sección de parámetros: tabla completa de params vigentes con clave, tipo, valor v1, unidad, consumidor (ver §5.3). |
| A-2 | `nucleo/REGISTRO_DE_ENTIDADES.md` | Actualizar fila `usuarios`: eliminar mención de `rolEmpleado`, documentar FK `persona_id` NOT NULL → `personas_roles` como única ruta de rol. |
| A-3 | `lineas/ola7/plan_ola7_maestro.md` | Marcar A-01 como cerrado. A-02 como cerrado. Actualizar §4. |
| A-4 | `lineas/ola7/estado_ola7.md` | Registrar cierre del bucle F8. |

---

## 3. Orden de ejecución

| Paso | Bloque | Acción | Rompe si se salta |
|---|---|---|---|
| 1 | **Pre-vuelo** | `npx tsc --noEmit` + `npx eslint .` | Bloquea todo |
| 2 | **Schema: deprecar rolEmpleado** | Eliminar columna `usuarios.rolEmpleado` + enum `rol_empleado` del schema Drizzle. `usuarios.persona_id` → NOT NULL. `drizzle-kit generate` → `drizzle-kit migrate`. | Futuro código podría usar `rolEmpleado` por error |
| 3 | **Schema: enums nuevos** | Crear 6 enums + migrar columnas `text`→enum. `drizzle-kit generate` → `drizzle-kit migrate`. | Queries futuras sin type safety en estados |
| 4 | **Schema: fecha→timestamp** | `ALTER COLUMN fecha TYPE timestamp`. `drizzle-kit generate` → `drizzle-kit migrate`. | Sin type safety en fechas |
| 5 | **Seed: params A-02** | Actualizar `scripts/seed-dev.ts`: -1 deprecado, +4 A-02. `npm run db:seed`. | Seed desalineado con schema de params |
| 6 | **Arnés: docs** | Actualizar glosario, REGISTRO, plan_ola7_maestro, estado_ola7 (ver §2.3). | Documentación inconsistente con schema real |
| 7 | **Verificación** | Ver §5. | Sin evidencia mecánica |
| 8 | **Commit** | Un solo commit con schema + seed + arnés. | Estado inconsistente |

**Ejecución atómica:** pasos 1–8 en una sola sesión contra `dev-local`. Si cualquier paso falla, se revierte y reporta.

---

## 4. Integraciones diferidas

| # | Integración | Estado | Acción en F8 |
|---|---|---|---|
| 1 | Viewer 3D (SketchUp → CVC → visor web) | **Diferido.** No existe placeholder en V3. El código de `Viewer3DModal.tsx` (221 líneas) y `PublicProposal.tsx` (454 líneas) del prototipo v2 está en `backup/dev-v2-arquitectura-20260804`, pero no se copia (regla de V3: código nuevo desde cero). | Registrar como deuda técnica: cuando F7 construya F-08 (propuesta pública), el Viewer 3D se implementa desde cero contra R2/Drive con modelo real. No bloquea F8 ni F9. |

---

## 5. Diseño de helpers de parámetros (`lib/modules/f0/parametros.ts`)

*Documentado acá, codificado en F0 (t-074). El plan t-074 ya declara este archivo — esta sección refina su diseño para que el glosario h07 y el arnés queden alineados.*

### 5.1 Inventario completo de parámetros del sistema

Parámetros con valor v1 confirmado (sembrados o por sembrar en seed):

| # | Clave | Grupo | Tipo | Valor v1 | Unidad | Consumidor |
|---|---|---|---|---|---|---|
| P-01 | `neto_diseno_3d_pct` | compensacion | numerico | 97.5 | % | Cotizador: neto diseñador = bruto × P-01/100 |
| P-02 | `iva_diseno_3d_pct` | compensacion | numerico | 19 | % | Cotizador: IVA diseño 3D facturado |
| P-03 | `recargo_hora_extra_pct` | nominas | numerico | 25 | % | Registro de horas extras (E-31) |
| P-04 | `umbral_todo_bien_pct` | cronograma | numerico | 0.95 | ratio | `check_produccion`: clasifica `todo_bien` si MIN ≥ P-04 |
| P-05 | `umbral_extremo_pct` | cronograma | numerico | 0.70 | ratio | `check_produccion`: clasifica `extremo` si MIN < P-05 |
| P-06 | `reduccion_comision_novedad_pct` | compensacion | numerico | 0.50 | % | `check_produccion`: reduce comisión en `novedad` (50%) |
| P-07 | `reduccion_comision_extremo_pct` | compensacion | numerico | 1.00 | % | `check_produccion`: reduce comisión en `extremo` (100%) |

Parámetros con valor conocido del negocio pero aún no sembrados en seed (se siembran cuando su consumidor se codifique):

| # | Clave | Grupo | Tipo | Valor v1 | Unidad | Consumidor | Fase |
|---|---|---|---|---|---|---|---|
| P-08 | `bruto_diseno_3d_cop` | compensacion | numerico | 130000 | COP | `diseños3d.precio` default (D-04) | F2 |
| P-09 | `comision_cierre_pct` | compensacion | numerico | 5 | % | Comisión comercial por venta (D-04) | F6 |
| P-10 | `comision_desarrollador_pct` | compensacion | numerico | 5 | % | Comisión desarrollador por cronograma (D-06) | F6 |
| P-11 | `comision_carpintero_pct` | compensacion | numerico | 5 | % | Comisión carpintero por módulo instalado (D-06) | F6 |
| P-12 | `tarifa_hora_carpintero_cop` | nominas | numerico | 15000 | COP/h | Cálculo MO taller (D-03) | F2 |
| P-13 | `tarifa_hora_auxiliar_cop` | nominas | numerico | 6500 | COP/h | Cálculo MO taller (D-03) | F2 |
| P-14 | `quincena_desarrollador` | nominas | texto | "sobre_horas" | — | Liquidación quincenal (D-03) | F6 |
| P-15 | `base_comision_tamano` | compensacion | texto | "subtotal_sin_iva" | — | Cálculo de comisión por tamaño (D-06) | F6 |
| P-16 | `reduccion_comision_retraso_dia_pct` | compensacion | numerico | 0.5 | %/día | Reducción diaria por retraso (D-04) | F6 |
| P-17 | `retraso_max_sin_comision_dias` | compensacion | numerico | 5 | días | Umbral máximo sin perder comisión (D-04) | F6 |
| P-18 | `sla_primera_respuesta_min` | sla | numerico | 5 | min | Temporizador SLA en leads (E-50) | F2 |
| P-19 | `sla_novedad_critica_max_h` | sla | numerico | 24 | h | Novedades críticas (E-34) | F3 |
| P-20 | `holgura_cronograma_max_dias` | cronograma | numerico | 5 | días | Holgura total entre fases | F3 |
| P-21 | `promesa_proyecto_semanas` | cronograma | numerico | 7 | semanas | Promesa contractual al cliente (I-024) | F3 |
| P-22 | `base_cronograma_semanas` | cronograma | numerico | 4 | semanas | Estimación base pre-contrato | F3 |
| P-23 | `holgura_cobro_dias` | finanzas | numerico | 12 | días | Recordatorio de cobro | F6 |
| P-24 | `garantia_anios` | general | numerico | 2 | años | Default en contratos y proyectos | F4 |
| P-25 | `transiciones_proyecto` | comercial | texto (JSON) | `{"activa":["enviada","perdida","cancelada"],...}` | — | Kanban: estados válidos por columna (C3) | F2 |
| P-26 | `arriendo_mensual_taller` | costos | numerico | — | COP | Cálculo tarifas MO (C1) | F2 |
| P-27 | `horas_mes_taller` | costos | numerico | — | h/mes | Cálculo tarifas MO (C1) | F2 |
| P-28 | `pct_mantenimiento_maquinas` | costos | numerico | — | % | Cálculo tarifas MO (C1) | F2 |
| P-29 | `factor_logistica_install` | costos | numerico | — | multiplicador | Cálculo tarifa instalación (C1) | F2 |
| P-30 | `costo_hora_operario_base` | costos | numerico | — | COP/h | Cálculo tarifas MO (C1, ya existe en F0) | F2 |
| P-31 | `empresa_nombre` | marca | texto | — | — | Contratos, propuestas, emails | F7 |
| P-32 | `empresa_nit` | marca | texto | — | — | Contratos, facturación | F7 |
| P-33 | `empresa_razon_social` | marca | texto | — | — | Documentos legales | F7 |
| P-34 | `empresa_direccion` | marca | texto | — | — | Contratos, footer web | F7 |
| P-35 | `empresa_telefono` | marca | texto | — | — | Contacto público | F7 |
| P-36 | `empresa_horario` | marca | texto | — | — | Sitio público | F7 |

**Deprecado:** `umbral_novedad_check15` (3 días) → reemplazado por P-04/P-05/P-06/P-07.

### 5.2 API de helpers (diseño, no código)

*Archivo destino: `lib/modules/f0/parametros.ts`. Consumido por cualquier módulo F2–F9.*

```typescript
// ── Lectura ──

/** Lee el valor vigente de un parámetro numérico. Lanza si no existe o el tipo no coincide. */
async function leerParametroNumerico(clave: string): Promise<number>

/** Lee el valor vigente de un parámetro de texto. */
async function leerParametroTexto(clave: string): Promise<string>

/** Lee el valor vigente de un parámetro booleano. */
async function leerParametroBooleano(clave: string): Promise<boolean>

/** Lee múltiples parámetros numéricos en una sola query. */
async function leerParametrosNumericos(claves: string[]): Promise<Record<string, number>>

// ── Escritura (append-only) ──

/** Actualiza un parámetro numérico. Registra historial automáticamente. */
async function actualizarParametroNumerico(
  clave: string,
  valorNuevo: number,
  actorId: string,
  motivo: string
): Promise<void>

/** Actualiza un parámetro de texto. Registra historial automáticamente. */
async function actualizarParametroTexto(
  clave: string,
  valorNuevo: string,
  actorId: string,
  motivo: string
): Promise<void>

// ── Historial ──

/** Historial completo de cambios de un parámetro, ordenado por vigente_desde DESC. */
async function historialParametro(clave: string): Promise<HistorialEntry[]>
```

**Reglas de implementación (contrato de diseño):**
1. Toda escritura es atómica: UPDATE en `parametros` + INSERT en `parametros_historial` en una misma transacción Drizzle.
2. `vigente_desde` y `updated_at` se actualizan al momento del cambio.
3. Si la clave no existe, `actualizarParametro*` lanza error (no crea parámetros nuevos — eso es seed/migración).
4. `leerParametro*` cachea en memoria del servidor (React `cache()` o variable de módulo) con TTL de 60s — los parámetros cambian raramente.
5. El CHECK de exclusión (`parametros_exclusion_valores`) garantiza que solo un campo de valor está poblado según el tipo.

**Glosario h07 — vocabulario de UI para gestión de parámetros:**

| Label natural | Código interno | Contexto |
|---|---|---|
| Parámetro | `parametro` | Fila individual en tabla `parametros` |
| Grupo | `grupo` | Agrupación: compensacion, nominas, cronograma, costos, sla, finanzas, comercial, marca |
| Valor actual | `valorNumeric` / `valorTexto` / `valorBooleano` | El valor vigente |
| Historial de cambios | `parametros_historial` | Tabla append-only |
| Actualizar parámetro | `actualizarParametro*` | Acción de cambiar valor (requiere motivo) |
| Motivo del cambio | `motivo` | Texto obligatorio en cada actualización |
| Actor | `actorId` | Quién hizo el cambio (FK→usuarios) |
| Vigente desde | `vigente_desde` | Timestamp de cuándo entró en vigor el valor actual |

### 5.3 Verificación de integridad de diseño de helpers

- [x] Todo parámetro en §5.1 tiene tipo correcto (`numerico`/`texto`/`booleano`)
- [x] Las firmas de lectura cubren los 3 tipos (sin genéricos mágicos)
- [x] Las firmas de escritura cubren los 2 tipos mutables (numérico y texto; booleano no se usa aún pero se añade cuando aparezca el primer caso real — lección `score_conversion`, I-005)
- [x] El historial es append-only (nunca UPDATE/DELETE sobre `parametros_historial`)
- [x] Las labels del glosario h07 son consistentes con `REGISTRO_DE_ENTIDADES.md`

---

## 6. Verificación post-hardening

| # | Verificación | Comando / procedimiento | Output esperado |
|---|---|---|---|
| V-1 | Tipos compilan | `npx tsc --noEmit` | 0 errores |
| V-2 | Lint limpio | `npx eslint .` | 0 errores |
| V-3 | Build avanza | `npx next build` (placeholder DB) | 0 errores de tipo; `ECONNREFUSED` esperados |
| V-4 | Migración corre en dev-local | `npm run db:migrate` | Sin errores; `information_schema.columns` confirma: sin columna `rol_empleado` en `usuarios`, `persona_id` NOT NULL, `fecha` tipo `timestamp`, 6 columnas `estado` con tipo `USER-DEFINED` (enum) |
| V-5 | Seed corre limpio | `npm run db:seed` | "parámetros insertados: 3" (A-01 repetidos) + "parámetros insertados: 4" (A-02 nuevos). Total: 7 params. |
| V-6 | Sin drift post-migración | `npm run db:generate` | Output vacío (sin cambios pendientes) |
| V-7 | `rolEmpleado` cero referencias vivas | `grep -r "rolEmpleado\|rol_empleado" lib/ app/ scripts/` | Solo en `arnes/` (referencias históricas). Cero en `lib/`, `app/`, `scripts/`. |
| V-8 | Seed sin param deprecado | `grep "umbral_novedad_check15" scripts/seed-dev.ts` | 0 resultados |
| V-9 | Glosario h07 actualizado | `grep -c "P-0[1-7]\|umbral_todo_bien\|umbral_extremo\|reduccion_comision" arnes/nucleo/glosario_h07.md` | ≥7 menciones |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | Schema sin rastro de `rolEmpleado` | V-4 + V-7 |
| CA-2 | `persona_id` es NOT NULL — única ruta de identidad de negocio | V-4 |
| CA-3 | 6 columnas `estado` son enums tipados (no text) | V-4 |
| CA-4 | `movimientos_financieros.fecha` es `timestamp` (no text) | V-4 |
| CA-5 | Seed contiene 7 params (3 A-01 + 4 A-02), sin el deprecado | V-5 + V-8 |
| CA-6 | `drizzle-kit generate` no detecta drift | V-6 |
| CA-7 | Glosario h07 documenta todos los parámetros del sistema (P-01..P-36) con label, tipo, valor, consumidor | V-9 |
| CA-8 | Diseño de helpers documentado en `plan_f8.md` §5 (no código, no `lib/`) | Lectura de este archivo |
| CA-9 | Restricciones de diseño R-01..R-06 explícitas para código futuro | Lectura de §2.2 |

---

## 8. Tareas registradas en ledger

| ID | Descripción | Tipo | Riesgo |
|---|---|---|---|
| t-105 | F8: Schema hardening (deprecar rolEmpleado + 6 enums + fecha→timestamp) | `mutacion_arnes` | alto |
| t-106 | F8: Seed A-02 (+4 params, -1 deprecado) | `mutacion_arnes` | bajo |
| t-107 | F8: Glosario h07 — inventario de parámetros P-01..P-36 | `mutacion_arnes` | bajo |
| t-108 | F8: REGISTRO_DE_ENTIDADES + plan_ola7_maestro + estado_ola7 alineados | `mutacion_arnes` | bajo |

**Nota:** las tareas se ejecutan en el orden de §3. t-105 y t-106 son código (schema + seed); t-107 y t-108 son documentación de arnés. El código de helpers de params NO se escribe ahora — su diseño está en §5 y se codifica en t-074 (F0) cuando se salga de la banda F0–F9.

---

## 9. Verificación de integridad (pre-entrega)

- [x] Toda columna en §1 existe en `REGISTRO_DE_ENTIDADES.md` y en `lib/db/schema.ts`
- [x] Todo archivo en §2 fue leído en su estado actual (verificado: `lib/auth/`, `lib/erp-nav.ts`, `lib/modules/`, `app/api/` — no existen en V3)
- [x] El orden en §3 respeta dependencias reales (schema → seed → arnés)
- [x] Toda verificación en §6 es ejecutable (comando copiable, no descripción vaga)
- [x] Los criterios en §7 cubren las 4 áreas de riesgo: schema (CA-1..CA-4, CA-6), datos (CA-5), documentación (CA-7..CA-8), restricciones futuras (CA-9)
- [x] Integraciones diferidas (§4): Viewer 3D registrado como deuda, no bloquea F8

---

**Registro:** 2026-08-08 · Iniciador · Plan F8 aprobado por Supervisor. Checkpoint de aprobación: 2026-08-08.

**Próxima acción:** QA verifica este plan contra la plantilla (§7 de `PLANTILLA_HARDENING.md`). Si aprueba, se crean t-105..t-108 en ledger y se ejecutan en orden §3.
