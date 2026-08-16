# Fase 0 — Procedimiento de Diagnóstico (F10)

**Objetivo:** generar el mapeo legacy→V3 y los riesgos de migración antes de cualquier
escritura en bases de datos. Fuente: `plan_f10_migracion.md` §2.

**Estado:** ✅ RESUELTO (2026-08-14) — no hacía falta `DATABASE_URL_LEGACY`. `dev-local` es
copy-on-write de `production` (creada 2026-08-13/14) y **ya trae consigo la tabla legacy
completa `agnostic_records`** con los datos reales — Drizzle solo agrega tablas nuevas, nunca
borra tablas que no conoce. La Fase 0.5 (`t-129`, dry-run de valores) se ejecutó leyendo
`agnostic_records` desde la conexión de `dev-local` que ya existe en `.env.local`, sin pedir
ninguna credencial de producción nueva. Ver `validacion_valores.md` para el resultado.

---

## Paso 1 — Extraer schema legacy → `schema_legacy.json`

Configurar la connection string de `main` y correr introspect:

```bash
# En .env.local (o export temporal) apuntar a Neon main:
#   DATABASE_URL_LEGACY='postgres://<usuario>:<clave>@<host-neon-main>/<db>'
# El drizzle.config.ts usa DATABASE_URL; para legacy se hace un config aparte.

npx drizzle-kit introspect --out ./arnes/lineas/ola7/migracion/legacy
# genera schema_legacy.json con las 65 tablas de producción (solo lectura).
```

> La introspect es **read-only**: no escribe en `main`. Seguro de correr desde el sandbox
> siempre que la connection string de `main` esté disponible (ver `TAREAS_DIFERIDAS.md` /
> credenciales `[SOLO_HUMANO]` si el agente no la tiene).

Luego commitear el snapshot: `git add arnes/lineas/ola7/migracion/legacy && git commit`.

## Paso 2 — `mapeo_campos.md`

Tabla comparativa 1:1 legacy→V3 (plantilla en `plan_f10_migracion.md` §2.2):
`Tabla Legacy | Campo Legacy | Tipo Legacy | Tabla V3 | Campo V3 | Tipo V3 | Transformación | Riesgo | Notas`.
Se rellena contra `nucleo/REGISTRO_DE_ENTIDADES.md` (schema canónico V3).

## Paso 3 — `riesgos_migracion.md`

Riesgos conocidos (de `auditoria_neon.md` / `inventario_legacy.md`):
- **PII**: `clientes.direccion`, `email`, teléfonos — enmascarar en diagnóstico.
- **JSONB → relacional**: campos legacy en JSONB que V3 normaliza a tablas.
- **FKs rotas**: `proveedorId`, `proyectoId` en legacy apuntando a registros inexistentes.
- **Estados**: texto legacy → enums V3 (`estado_proyecto`, `estado_orden`, etc.).

## Paso 4 — Checkpoint del Supervisor

Javier aprueba `mapeo_campos.md` + `riesgos_migracion.md` antes de ejecutar scripts (t-114/115).
