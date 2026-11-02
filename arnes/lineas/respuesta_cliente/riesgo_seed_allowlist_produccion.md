# 🔴 Riesgo — `seed-dev.ts` autoriza el host de producción

**Descubierto:** 2026-09-30, durante la línea de respuesta al cliente.
**Estado:** **corregido** en `scripts/seed-dev.ts`.
**Clase:** guard de seguridad que se contradecía a sí mismo. Preexistente, no introducido por la línea.

---

## Qué pasaba

`scripts/seed-dev.ts`protectede con una allowlist de hosts "de desarrollo", y su mensaje de error
decía literalmente *"Este script NUNCA debe correr contra producción"*.

Pero esa allowlist **incluía el host de producción**:

```ts
const DEV_HOST_ALLOWLIST = new Set([
  'ep-silent-field-ac8slpbc-pooler.sa-east-1.aws.neon.tech',
  'ep-muddy-cherry-at5j2mz7.c-9.us-east-1.aws.neon.tech',   // ← v3-preview = PRODUCCIÓN
])
```

`ep-muddy-cherry-at5j2mz7` es `v3-preview`, que desde el **2026-08-20** es **la base real que lee
Vercel**: 73 tablas, 146 proyectos, 93 clientes, 64 contratos (ver `arnes/estado.md`, entradas
"CORRECCIÓN CRÍTICA DE ENTORNO" del 2026-08-20 y la del 2026-09-30).

## Por qué no lo detectó nadie antes

**El segundo guard era decorativo.** La condición real era:

```ts
if (process.env.NODE_ENV === 'production') throw ...
```

Que solo se dispara si alguien exporta `NODE_ENV=production` explícitamente. Correr
`npm run db:seed` en una terminal normal **no** define esa variable. O sea: la línea que de verdad
protege era la allowlist, y la allowlist tenía producción adentro.

Y el `.env.local` de hoy apunta a otra base:

| Variable | Host | Estado |
|---|---|---|
| `DATABASE_URL` | `ep-round-queen-at3nzf87-pooler` | La que usa `npm run dev` — **no** estaba en la allowlist, así que el seed se bloqueaba |
| `DATABASE_URL_V3_PREVIEW` | `ep-muddy-cherry-at5j2mz7-pooler` | **Producción** — sí estaba en la allowlist |

Con la config actual el seed falla en `DATABASE_URL` por host desconocido. **Pero** si alguien
exporta `DATABASE_URL` apuntando a `DATABASE_URL_V3_PREVIEW` — que es exactamente lo que se hizo
al aplicar la migración 0027 el 2026-09-30, según `arnes/estado.md` — **el guard lo deja pasar y
`INSERT`ea roles, parámetros y testimonios en la base de producción.**

## La corrección

Tres cambios en `scripts/seed-dev.ts`:

1. **`PRODUCCION_NUNCA` es una denylist** que se evalúa **antes** que la allowlist. Una denylist
   gana sobre cualquier allowlist: es el orden correcto cuando el riesgo es asymmetric (el costo de
   bloquear de más es un mensaje de error; el de permitir de más es escribir en producción).
2. **Doble puerta explícita.** Contra producción hace falta `CONFIRM_SEED_PRODUCCION=1`, siguiendo
   el patrón que ya usa `scripts/migrate-core.ts:41` con `CONFIRM_MIGRATE_CORE_DESTRUCTIVE`.
   Nadie deja una variable en un `.env` por accidente.
3. **`branchDe()`** compara el nombre del branch de Neon, no el hostname completo — que lleva
   sufijos cambiantes (`-pooler.c-9`). Sin esto, la allowlist comparaba strings que no coinciden
   con el hostname real.

## Verificación

La lógica del guard se ejecutó contra los hosts reales (réplica exacta, no el import):

| Host | `CONFIRM_SEED_PRODUCCION` | Resultado |
|---|---|---|
| `ep-muddy-cherry-at5j2mz7-pooler…` (producción) | — | **BLOQUEADO** (producción sin confirmación) |
| `ep-muddy-cherry-at5j2mz7-pooler…` (producción) | `1` | **BLOQUEADO** (no está en la allowlist) |
| `ep-round-queen-at3nzf87-pooler…` (`DATABASE_URL` de hoy) | — | PERMITIDO |
| `ep-silent-field-ac8slpbc-pooler…` | — | PERMITIDO |
| host desconocido | — | **BLOQUEADO** |

🔴 **Nota sobre la fila 2:** con `CONFIRM_SEED_PRODUCCION=1` el host de producción sigue bloqueado
por la allowlist. Es intencional: la confirmación desactiva la denylist, pero no abre la puerta a
producción — haría falta además cambiar la allowlist a mano. **Dos cambios deliberados para
escribir en producción, no uno.**

## Lo que este riesgo NO era

No hubo ninguna escritura en producción. Esto es un guard que quedaba abierto, encontrado leyendo
el código antes de correr nada. La línea de respuesta al cliente nunca corrió el seed.

## Cómo aplicar cambios de datos a la base (la vía correcta)

Como quedó claro en esta línea: **`fixtures.ts` no alimenta la tabla `parametros`.**

- `scripts/seed-dev.ts` tiene su **propia** lista `PARAMETROS_BASE` (4 claves), no lee `fixtures.ts`.
- `lib/data/actions/hydrate.ts` hace `SELECT` sobre `parametros` para pintar la UI. **Nunca inserta.**

Para agregar parámetros (como los 8 nuevos de la regla de oro), el camino es un
`scripts/apply-<nombre>.ts` con SQL idempotente y `IF NOT EXISTS` en todo, siguiendo el patrón de
`scripts/apply-lead-attribution-columns.ts`. **No** `drizzle-kit migrate`: su tracking
`__drizzle_migrations` está desincronizado desde el 2026-09-29 (tiene hasta el id 18, mientras
0019-0027 se aplicaron a mano), y cuatro de esas migraciones usan `ADD COLUMN` sin `IF NOT EXISTS`.