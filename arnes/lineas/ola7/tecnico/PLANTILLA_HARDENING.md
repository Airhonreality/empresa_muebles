# PLANTILLA DE HARDENING

**Contrato vivo.** Todo plan de hardening (F8 y futuras fases de migración técnica) sigue esta estructura. El objetivo: un agente Código recibe este archivo, ejecuta la migración de schema + backfill + actualización de módulos sin ambigüedad, y QA verifica todo con evidencia mecánica.

**Aplica a fases tipo:** hardening técnico (F8): backfill/migración de datos existentes, deprecación de patrones provisorios, integración de subsistemas diferidos.

---

## Fase — [Nombre de la fase en lenguaje de negocio]

**Fecha:** YYYY-MM-DD · **Estado:** [propuesta / aprobado] · **Fase:** FX · **Riesgo:** [alto / medio / bajo]

---

## 1. Inventario de migración de schema

*Cita del REGISTRO DE ENTIDADES (`arnes/nucleo/REGISTRO_DE_ENTIDADES.md`) y del schema real (`lib/db/schema.ts`). Cada fila es una columna que cambia de tipo.*

| # | Tabla | Columna | Tipo actual | Tipo destino | ¿Tiene datos? | Estrategia de backfill |
|---|---|---|---|---|---|---|
| 1 | `proyectos` | `estado` | `text` | `estado_proyecto` (enum) | Sí (8 valores legacy) | Mapeo 1:1: `activa→activa`, `entregado→entregado`, etc. Valores nuevos solo en código. |
| 2 | `ordenes_trabajo` | `estado` | `text` | `estado_orden` (enum) | Sí | Mapeo de valores actuales al enum aditivo correspondiente. |
| 3 | `movimientos_financieros` | `fecha` | `text` | `timestamp` | Sí | `CAST(fecha AS timestamp)` — verificar formato ISO 8601 en datos existentes. Fallar migración si hay valor no parseable. |
| — | ... | | | | | |

**Regla de oro:** enums son **aditivos** — incluyen los valores existentes + los nuevos. Nunca reemplazo con pérdida. Tipos de fecha usan `USING` con `CAST` explícito en la migración Drizzle.

---

## 2. Módulos de código impactados

*Cada archivo que lee o escribe los valores migrados. Se lista la firma actual y la nueva.*

| # | Archivo | Línea(s) | Código actual | Código nuevo | Motivo |
|---|---|---|---|---|---|
| 1 | `lib/auth/session.ts` | 9 | `rol: row.rolEmpleado` (string único) | `roles: rows.map(r => r.nombre_rol)` (array) | `rolEmpleado` → `personas_roles` N:N |
| 2 | `lib/erp-nav.ts` | 16, 30-32 | `session.rol === 'admin'` | `session.roles.includes('admin')` | Misma deprecación |
| 3 | `lib/modules/finanzas/acciones.ts` | 78 | `nuevo(new Date(row.fecha))` | `nuevo(row.fecha)` (ya es Date nativo) | `fecha` ahora es `timestamp` |
| 4 | `app/api/erp/proyectos/route.ts` | 24 | `requireEmpleado(['admin','comercial'])` | Sin cambio de firma — la resolución de rol ahora usa array internamente | Transparente si `requireEmpleado` se actualiza |
| — | ... | | | | |

**Precondición:** el código impactado debe compilar (`tsc --noEmit`) con los tipos nuevos ANTES de aplicar la migración a datos reales — se usa el schema dummy de Drizzle para verificar tipos sin conexión a DB.

---

## 3. Orden de ejecución

*Secuencia estricta. Cada bloque depende del anterior. No se paraleliza dentro de F8.*

| Paso | Bloque | Acción | Depende de | Rompe si se salta |
|---|---|---|---|---|
| 1 | **Pre-vuelo** | `tsc --noEmit` + `eslint .` + `next build` (placeholder DB) | — | Bloquea todo si no está verde |
| 2 | **Enums aditivos** | `ALTER TYPE ... ADD VALUE` para cada enum nuevo | 1 | Migraciones posteriores fallan si el tipo no existe |
| 3 | **Backfill texto→enum** | `UPDATE tabla SET estado = valor_legacy WHERE estado IN (...)` | 2 | Datos inconsistentes con el nuevo tipo |
| 4 | **Cambio tipo columna** | `ALTER TABLE ... ALTER COLUMN ... TYPE ... USING CAST(...)` | 3 | Datos en formato viejo revientan queries |
| 5 | **Migración código** | Actualizar `session.ts`, `erp-nav.ts`, APIs impactadas | 4 | Auth roto, nav roto, guards sin efecto |
| 6 | **Verificación** | Ver §5 (todas las verificaciones) | 5 | — |
| 7 | **Commit** | Un solo commit con schema + backfill + código | 6 | Estado inconsistente si se commitea parcial |

**Ejecución atómica:** los pasos 1–7 corren en una sola sesión contra `dev-local`. Si cualquier paso falla, se revierte todo y se reporta el bloqueo.

---

## 4. Integraciones diferidas (si aplica)

*Subsistemas que fases anteriores dejaron como placeholder y se activan en esta fase.*

| # | Integración | Fase origen | Placeholder actual | Acción en esta fase | Bloqueante |
|---|---|---|---|---|---|
| 1 | Viewer 3D (SketchUp → CVC → visor web) | F7 (F-08) | `{/* <Viewer3DModal proyectoId={id} /> */}` | Descomentar componente, implementar carga desde R2/Drive, validar con modelo real | Sí (si no está listo, se deja comentado y se registra como deuda) |
| — | ... | | | | |

---

## 5. Verificación post-hardening

*Evidencia mecánica. QA ejecuta y pega output crudo. Sin esto, la fase no se cierra.*

| # | Qué se verifica | Comando / procedimiento | Output esperado |
|---|---|---|---|
| V-1 | Tipos compilan | `npx tsc --noEmit` | 0 errores |
| V-2 | Lint limpio | `npx eslint .` | 0 errores |
| V-3 | Build avanza | `npx next build` (placeholder DB) | 0 errores de tipo; solo `ECONNREFUSED` esperados en páginas con datos |
| V-4 | Migración corre en dev-local | `npm run db:migrate` | Sin errores; `information_schema.columns` confirma nuevos tipos |
| V-5 | Backfill sin pérdida | `SELECT COUNT(*), estado FROM proyectos GROUP BY estado` | Mismos counts que antes de migrar + nuevos estados con count 0 |
| V-6 | Auth funciona post-deprecación | `curl` login → cookie → `GET /api/erp/proyectos` con sesión | 200, mismo resultado que antes |
| V-7 | Guards de rol intactos | `curl` con rol `taller` → `POST /api/erp/proyectos` | 403 (no autorizado) |
| V-8 | Tests re-corridos | `npx tsx lib/modules/**/*.test.ts` uno por uno | Todos PASS (si alguno fallaba por `rolEmpleado`, se actualizó en paso 5) |
| V-9 | Query de fechas funciona | `SELECT * FROM movimientos_financieros ORDER BY fecha DESC LIMIT 1` en dev-local | Resultado correcto, sin error de tipo |
| V-10 | Integraciones activadas (si aplica) | Playwright: `/propuesta/{slug}` muestra Viewer 3D | Componente renderiza, carga modelo, sin errores de consola |

---

## 6. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | Cero regresiones: todos los tests que pasaban antes de F8 siguen pasando | V-8 |
| CA-2 | Tipos de columna migrados son los del REGISTRO_DE_ENTIDADES | `information_schema.columns` en dev-local coincide con §1 |
| CA-3 | Backfill no perdió ni corrompió datos | V-5 |
| CA-4 | Auth y navegación funcionan con modelo N:N de roles | V-6 + V-7 |
| CA-5 | Cero código referencia `rolEmpleado` fuera de la migración misma | `grep -r "rolEmpleado" lib/ app/` = 0 (salvo seed temporal) |
| CA-6 | `drizzle-kit generate` no detecta drift post-migración | `npm run db:generate` output vacío (sin cambios pendientes) |

---

## 7. Verificación de integridad (pre-entrega)

Antes de marcar el plan como "aprobado", el Iniciador verifica:

- [ ] Toda columna en §1 existe en el `REGISTRO_DE_ENTIDADES.md` y en `lib/db/schema.ts`
- [ ] Todo archivo en §2 fue leído en su estado actual (no de memoria)
- [ ] El orden en §3 respeta dependencias reales (ningún paso usa un tipo que aún no se creó)
- [ ] Toda verificación en §5 es ejecutable (comando copiable, no descripción vaga)
- [ ] Los criterios en §6 cubren las 4 áreas de riesgo: schema, datos, código, integraciones
- [ ] Si hay integraciones diferidas (§4), se confirma con el Supervisor que el subsistema externo está listo
