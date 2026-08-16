# Riesgos de Migración: Legacy (Neon main) → V3 (dev-local)

> **Fase 0 (Diagnóstico pre-mapeo) — t-114.** Complementa `mapeo_campos.md` y `schema_legacy.json`.
> Fuente legacy: branch congelado `legacy-agnostic-backup` (`storage/db/`). Aprobación: checkpoint CA-1 del Supervisor.

## R-1. El legacy NO es relacional en Neon: la fuente es git `storage/db/*.json`

El legacy (Agnostic Seed) guarda cada registro como `{ id, context, data{...}, updated_at }` en archivos
JSON de git (`storage/db/<namespace>.json`), no como tablas relacionales en Neon.

**Verificación live (2026-08-12):** introspección read-only de Neon `main` (`ep-fancy-mud-ac3i6a04`)
devolvió los schemas `auth`, `neon_auth`, `public`; únicamente **9 tablas, todas `neon_auth.*`**
(infraestructura de auth de Neon) y `public` vacío. **No existe ningún schema de negocio relacional**
(clientes, proyectos, etc.) en Neon `main`.

- **Conclusión:** el esquema de negocio de legacy vive en git `storage/db/` (branch congelado
  `legacy-agnostic-backup`), no en Neon relacional. Por tanto **`schema_legacy.json` (construido desde
  `schema_definitions.json` + muestras de datos del backup) es la fuente autoritativa y completa**.
- **Drift git↔Neon:** no aplica a nivel relacional (Neon `main` no tiene tablas de negocio). El riesgo de
  drift se reduce a "¿está `storage/db/` del backup al día con lo que lee producción?", que se resuelve
  usando el backup congelado como fuente canónica de migración.
- **Impacto en los scripts de migración (t-115/116):** deben leer el **JSON fuente** (`storage/db/*.json`
  del backup o su equivalente en vivo), no una base relacional. La transformación legacy→V3 es
  JSON→tablas Drizzle de `dev-local`.

## R-2. Datos PII que requieren enmascaramiento en dev-local / preview

Estos campos viajan en claro en el legacy y deben ofuscarse antes de volcarse a `dev-local` (la preview de
Vercel usa las mismas credenciales de Neon que producción, por lo que `dev-local` queda expuesto a datos reales).

| Namespace | Campo(s) PII | Tratamiento propuesto |
|-----------|--------------|------------------------|
| clientes | `domicilio`, `email`, `telefono`, `documento`, `nombre` | Enmascarar en `dev-local`; mantener real solo en `main`. |
| proyectos | `direccion_obra`, `cliente_id` (vincula a PII) | Ofuscar dirección. |
| usuarios_equipo / users | `email`, `nombre`, credenciales | Nunca migrar hashes de password a `dev-local`; regenerar. |
| contratos | `domicilio` del cliente, datos fiscales | Ofuscar. |
| testimonios | `nombre` del cliente | Ofuscar si aplica. |

**Decisión requerida:** ¿se enmascara en origen (script de migración con transform PII) o se mantiene real
y se restringe el acceso a `dev-local`?

## R-3. Gaps físicos: 15 namespaces canon-only sin tabla Drizzle

El esquema físico V3 (`lib/db/schema.ts`, 28 tablas) cubre ~21 namespaces legacy; **15 solo existen en el
canon `REGISTRO_DE_ENTIDADES`** y no tienen tabla en `dev-local`:

`apoyo_tecnico`, `categorias_financieras`, `compras_materiales`, `comprobantes_financieros`,
`imagenes_prefabricado`, `items_obra_civil`, `prefabricados`, `prefabricados_items`, `project_tasks`,
`propuestas_publicas`, `registro_horas`, `registro_logistica`, `registros_tecnicos`, `tareas_operativas`, `testimonios`.

- **Impacto:** esos datos no pueden volcarse vía `lib/db/schema` hasta crear las tablas (DDL) en `dev-local`.
- **Decisión B (pendiente del Supervisor):** ¿(a) limitar F10 a las 21 tablas físicas, o
  (b) extender el esquema físico con DDL nuevo para los namespaces canon-only? F8 (hardening) está cerrado,
  así que la opción (b) requiere abrir excepción explícita.

## R-4. `lib/data/drizzle-impl.ts` es un stub → preview con datos reales imposible hoy

`lib/data/drizzle-impl.ts` lanza *"DATA_IMPL=drizzle no está implementado aún"*. La app corre 100% sobre
`DATA_IMPL=mock` (fixtures en memoria). Aun migrando datos a `dev-local`, el preview de Vercel no los leerá
hasta implementar el adaptador Drizzle.

- **Impacto:** el criterio de aceptación CA-5 ("Javier valida datos reales en vivo en preview") **no se cumple**
  sin esta implementación.
- **Riesgo A (pendiente del Supervisor):** ¿se añade una tarea F10 para implementar `drizzle-impl.ts`, o el
  alcance de F10 se limita a "datos en `dev-local` verificados por script" (sin preview con datos reales)?

## R-5. Transformaciones JSONB → relacional

| Legacy | V3 destino | Nota |
|--------|-----------|------|
| `contratos.hitos_pago` (array/JSONB) | tabla `hitosPago` (1:N) | Split por registro. |
| `espacio_variantes.fotos*`, `imagenes_espacio` | columnas JSONB de `espacioVariantes` / `imagenesPortfolio` | Decidir si se conserva JSONB o se normaliza. |
| `propuestas_publicas.snapshot_json` | canon-only (sin tabla) | Ver R-3. |
| `usuarios_equipo` / `users` | `personas` + `usuarios` + `personasRoles` | Separar identidad (persona) de credencial (usuario) y rol(es). |

## R-6. Enums legacy (`select`) vs enums V3

V3 define enums tipados (`estadoContrato`, `estadoProyecto`, etc. en `lib/db/schema.ts`). Los `select` legacy
pueden tener valores que no coincidan (ej. `estado` de contrato: "borrador|firmado|..." vs enum V3). Requiere
tabla de traducción de valores por campo `select`/`status`.

## R-7. FKs huérfanas y tipos de ID

- Los `relation` legacy apuntan por `id` UUID (ej. `proyecto_id`). Tras migrar, las FKs deben resolverse contra
  los IDs reales en `dev-local` (no asumir que el UUID legacy se conserva; V3 usa `serial` en varias tablas).
- **Acción:** generar mapa `legacyId → v3Id` durante la migración para reenlazar FKs.

## R-8. Tipos numéricos / money

Legacy usa `number` para montos. V3 usa `numeric`/`decimal` en finanzas. Validar precisión y conversión
(especialmente `valor_abono`, `costo_real_compra`, `monto` de obligaciones/movimientos).

## R-9. Campos sin destino (`PENDIENTE` en mapeo)

Varios campos legacy no tienen columna V3 directa (ej. `valor_abono`→`obligacionesPendientes`,
`descripcion_semantica` en `clientes`, `unidad_medida` en compras). Cada `PENDIENTE` en `mapeo_campos.md`
debe resolverse con: (1) mapeo a columna existente por sinónimo, (2) descarte justificado, o
(3) nueva columna vía DDL (ver R-3 / Decisión B).

## R-10. Snapshot legacy puede estar vacío en el backup

Varios namespaces definidos tienen **0 registros** en el backup congelado (`compras_materiales`,
`comprobantes_financieros`, `proveedores`, `registro_horas`, `tareas_operativas`, etc.). La introspección
[SOLO_HUMANO] de Neon `main` en vivo determinará si hay datos reales allí que el backup no capturó.

## R-11. Orden de migración y idempotencia

Respetar dependencias: `personas/usuarios` → `clientes`/`proveedores` → `proyectos` → `contratos` →
`espacio_variantes`/`items_variante` → finanzas → producción → `portfolio_publico`/`pedidos_web`. Los scripts
deben ser idempotentes (upsert por `legacyId`) para permitir re-ejecución tras correcciones.

---

### Decisiones pendientes del Supervisor

- **A.** Implementar `lib/data/drizzle-impl.ts` para habilitar preview con datos reales (CA-5).
- **B.** Migrar solo las 21 tablas físicas, o extender DDL para los 15 namespaces canon-only.
- **C.** Política PII en `dev-local` (enmascarar en origen vs restricción de acceso).
