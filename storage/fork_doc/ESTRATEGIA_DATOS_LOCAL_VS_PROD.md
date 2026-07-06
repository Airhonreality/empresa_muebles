# Estrategia de Datos: Local vs Producción

> Documento de referencia obligatorio antes de poblar o limpiar datos de la tienda web.
> Objetivo: que cualquier agente o humano sepa, sin ambigüedad, qué estrategia de
> persistencia está activa y cómo se gestionan los mocks locales.

## a) Tabla de resolución de estrategia

La función `getStrategyName()` (`src/server/getStrategy.ts`) resuelve la estrategia en
este orden de prioridad:

| Orden | Condición | Estrategia resultante |
|-------|-----------|------------------------|
| 1 | `AGNOSTIC_STORAGE_STRATEGY` definida (`local`, `postgres`, `github`, `supabase`) | Override explícito, gana siempre |
| 2 | `NODE_ENV !== 'production'` (dev/test) | `local` — SIEMPRE, sin excepción |
| 3 (solo si `NODE_ENV === 'production'` y no hay override) | `GITHUB_REPO` definido | `github` |
| 4 | `DATABASE_URL` definido (Postgres/Neon) | `postgres` |
| 5 | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` definidos | `supabase` |
| 6 | Ninguna de las anteriores | `local` (fallback) |

Notas:

- En **local** (cualquier máquina de desarrollo, `npm run dev`), la estrategia es
  `LocalStrategy` y lee/escribe `storage/db/*.json`. No hay forma de apuntar accidentalmente
  a Neon en local salvo que alguien fuerce `AGNOSTIC_STORAGE_STRATEGY=postgres` a mano.
- En **producción (Netlify)**, `netlify.toml` **no define** la estrategia. La estrategia la
  deciden las variables de entorno configuradas en el panel de Netlify (Site settings →
  Environment variables). Esto es intencional: mantiene el código agnóstico del entorno.
- La estrategia real de Netlify hoy es `postgres` vía `DATABASE_URL` apuntando a Neon.

## b) Regla de inyección de mocks en local

- Los mocks **SOLO** se inyectan con `npx tsx scripts/agno.ts create-record <schema> key=value...`.
  Nunca se edita `storage/db/*.json` a mano. Los IDs los genera el engine con
  `crypto.randomUUID()`.
- **Todo mock creado se registra en el schema `seed_registros`** con, como mínimo:
  - `namespace`: el nombre del schema donde vive el mock (p. ej. `clientes`).
  - `record_id`: el `id` real del registro mock creado.
  - `lote`: identificador del lote de siembra (p. ej. `webstore_r2`).
  - `nota`: texto libre para reconocer el registro a simple vista (p. ej. `"Cliente Demo Uno"`).
- Un lote (`lote`) agrupa todos los mocks de una misma sesión/ronda de siembra, de forma que
  se puedan limpiar juntos sin tocar datos reales o de otras rondas.

## c) Procedimiento de limpieza

Para retirar un lote de mocks (p. ej. `webstore_r2`) antes de un push a producción o al cerrar
una ronda de pruebas:

1. Leer todos los registros del lote:
   `npx tsx scripts/agno.ts records seed_registros` (o filtrar por `lote=<lote>` inspeccionando
   `storage/db/seed_registros.json`).
2. Por cada registro de `seed_registros` con ese `lote`:
   a. Borrar el mock real: `npx tsx scripts/agno.ts delete-record <namespace> <record_id>`.
   b. Borrar el propio registro de rastreo:
      `npx tsx scripts/agno.ts delete-record seed_registros <id_del_seed_registro>`.
3. Cerrar la cola: `npx tsx scripts/agno.ts commit --force`.
4. Verificar que no quedan huérfanos: `npx tsx scripts/agno.ts validate`.

No existe (ni debe crearse) un comando de "borrar todo el lote" de un solo golpe — el borrado
registro por registro vía `agno` es la única vía permitida, igual que la creación.

## d) Regla de frontera: nunca mocks hacia Neon

`scripts/push-data.ts` y `scripts/deploy_zap.ts` (u otro script equivalente que escriba contra
`DATABASE_URL`) **jamás** se ejecutan mientras existan lotes mock sin limpiar en
`storage/db/seed_registros.json`. Un mock (`"Cliente Demo Uno"`, testimonios ficticios, leads de
prueba, etc.) que viaje a Neon contamina datos de producción y es muy difícil de distinguir de
un cliente real una vez allá.

### Checklist pre-push (obligatorio antes de correr `push-data` / `deploy_zap` contra Neon)

- [ ] `storage/db/seed_registros.json` está vacío (`[]`) o no existe, **o** se verificó
      explícitamente que los lotes ahí listados son intencionales y aprobados para viajar.
- [ ] Se ejecutó el procedimiento de limpieza (sección c) para cualquier lote de prueba
      (`webstore_r2`, etc.) que no deba llegar a producción.
- [ ] Se confirmó la estrategia efectiva antes de ejecutar el script (sección e).
- [ ] `DATABASE_URL` en el entorno actual apunta al Neon correcto (no a una base de pruebas ni
      viceversa).
- [ ] Se corrió `npx tsx scripts/agno.ts validate` sin errores tras la limpieza.

## e) Cómo verificar qué estrategia está activa

```ts
import { getStrategyName } from '@/server/getStrategy';

console.log(getStrategyName()); // 'local' | 'postgres' | 'github' | 'supabase'
```

Desde CLI, en un contexto Node con las mismas env vars cargadas:

```bash
npx tsx -e "console.log(require('./src/server/getStrategy').getStrategyName())"
```

O, para forzar y confirmar explícitamente una estrategia antes de una operación sensible:

```bash
AGNOSTIC_STORAGE_STRATEGY=local npx tsx scripts/agno.ts context
```

Regla de oro: si no se sabe con certeza qué estrategia está activa, no se ejecuta ningún script
de push/deploy contra datos remotos.
