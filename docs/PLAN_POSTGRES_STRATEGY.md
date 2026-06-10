# Plan: PostgreSQL Universal Strategy + Audit de Entropía
**Fecha:** 2026-06-09 | **Contexto:** Lanzamiento estable

---

## Resumen ejecutivo

La auditoría encontró **1 bug bloqueante**, **2 bugs menores de entropía legacy**, y un **patrón de estrategia incompleto**. La pregunta sobre Neon lleva a una conclusión clara: el sistema ya tiene Drizzle instalado pero desconectado, y la solución correcta es una `PostgresStrategy` universal (Neon, Supabase Postgres, Railway, Render) usando `postgres.js` con tabla única. Esto elimina la necesidad de DDL por namespace y simplifica radicalmente el onboarding.

---

## Auditoría completa de entropía

### BUG-01 🔴 BLOQUEANTE — GitHubStrategy path incorrecto

**Síntoma:** Gemini lo identificó: GitHubStrategy lee `db/{namespace}.json` pero los archivos están en `storage/db/{namespace}.json`.

**Dónde:** `src/server/strategies/GitHubStrategy.ts` líneas 75, 89, y 197.

```typescript
// ACTUAL (roto):
`https://api.github.com/repos/${owner}/${repo}/contents/db/${namespace}.json`

// CORRECTO:
`https://api.github.com/repos/${owner}/${repo}/contents/storage/db/${namespace}.json`
```

**Historia:** El refactor `refactor!: remove silo selection system` simplificó `getSiloPath()` a devolver `storage/` como raíz, y `LocalStrategy` correctamente appende `db/` internamente. Pero `GitHubStrategy` quedó con la ruta vieja sin el prefijo `storage/`. Las dos estrategias apuntan a rutas distintas en el mismo repo.

**Afectación:** Todo fork que usa GitHub strategy lee namespaces vacíos. Las escrituras crean archivos en el directorio equivocado.

**Fix:** Cambiar 3 líneas en `GitHubStrategy.ts`. Sin migraciones si el repo del fork todavía no tiene datos en producción. Si ya tiene datos en `db/`, se migran primero con `POST /api/admin/migrate` (ver sección de migración).

---

### BUG-02 🟡 MENOR — `getStrategy(tenantKey)` llama a función con 0 params

**Dónde:** `src/app/api/vault/route.ts` líneas 76 y 127.

```typescript
// ACTUAL (silenciosamente roto):
const strategy: any = getStrategy(tenantKey);  // tenantKey ignorado, cast via `as any`

// CORRECTO:
const strategy = getStrategy();
```

**Historia:** Multi-tenant legacy. `getStrategy` nunca aceptó parámetros — el `x-tenant` header es un residuo de una arquitectura eliminada. El `as any` lo silencia.

**Fix:** Dos líneas. Eliminar `tenantKey`, limpiar el header read.

---

### BUG-03 🟡 MENOR — Drizzle instalado sin usar

**Dónde:** `package.json` — `drizzle-orm ^0.45.2` + `drizzle-kit ^0.31.10`.

**Historia:** Se instaló anticipando un ORM relacional que nunca se implementó. Agrega ~80KB al bundle sin efecto.

**Decisión:** Usar `drizzle-orm` para la `PostgresStrategy` (ver abajo) o eliminarlo. Si se implementa `PostgresStrategy` correctamente, `drizzle-orm` se integra naturalmente para el esquema de la tabla única.

---

### BUG-04 🟢 INFO — `SupabaseStrategy` usa PostgREST (tabla por namespace)

**Dónde:** `src/server/strategies/SupabaseStrategy.ts`

PostgREST requiere que cada namespace tenga una tabla creada con DDL manual. Esto viola el principio de namespaces dinámicos del engine — el sistema no puede crear un namespace nuevo sin un paso de SQL externo.

**No es un bug crítico** si el usuario usa Supabase REST API. Pero sí es una fricción de diseño que la `PostgresStrategy` elimina completamente.

---

## Best practice de la industria 2026/2027

### Para proveedores de base de datos estándar (Neon, Supabase Postgres, Railway, etc.)

| Herramienta | Posición 2026 | Por qué |
|---|---|---|
| `postgres.js` | ✅ Ganador para Node.js | Nativo TypeScript, sin config, conexión pooled, 3KB |
| `@neondatabase/serverless` | ✅ Edge compatible | HTTP + WebSockets, funciona en Edge Runtime de Vercel |
| Drizzle ORM | ✅ Ganador ORM 2026 | Type-safe, sin generación de código, compatible con ambos drivers |
| Prisma ORM | ⚠️ Pesado | Bueno, pero 10x más complejo que lo que este sistema necesita |
| `pg` (node-postgres) | ✅ Maduro | Funciona pero verboso, no WebSockets nativos |

**Conclusión para este sistema:**
- Driver: `postgres.js` (ya está Drizzle, usarlo para tipado de queries)
- Una sola tabla `agnostic_records` — namespaces dinámicos sin DDL
- `DATABASE_URL` como variable universal — Neon, Supabase, Railway, Render usan el mismo formato

### Por qué tabla única vs tabla por namespace

| | Tabla única (`agnostic_records`) | Tabla por namespace (SupabaseStrategy actual) |
|---|---|---|
| Namespace nuevo | Automático — solo insertar con `namespace` distinto | Requiere `CREATE TABLE` manual |
| Performance | Índice en `namespace` → comparable | Mejor para datasets muy grandes (>100K rows por ns) |
| Namespaces dinámicos | ✅ Nativo | ❌ Requiere DDL previo |
| Setup en Neon/Supabase | 1 tabla, 1 índice, nunca más | Una tabla por namespace, siempre |
| Alineación con este engine | ✅ Ideal — el engine es ciego a namespaces | ⚠️ Tension — PostgREST asume tablas predefinidas |

**Veredicto:** Tabla única es la elección correcta para un engine schema-driven donde los namespaces los define el usuario.

---

## Plan de implementación

### Fase 1 — Bug fixes (sin dependencias nuevas, ~30 min)

**F1.1** Corregir `GitHubStrategy.ts` — cambiar 3 paths `db/` → `storage/db/`

**F1.2** Limpiar `vault/route.ts` — eliminar `tenantKey` / `x-tenant` residual

### Fase 2 — PostgresStrategy (nueva estrategia, ~2h)

**F2.1** Instalar `postgres` (postgres.js):
```bash
npm install postgres
```

**F2.2** Crear `src/server/strategies/PostgresStrategy.ts`:
- Tabla única `agnostic_records(id, namespace, context, data JSONB, updated_at)`
- `CREATE TABLE IF NOT EXISTS` en el constructor (auto-bootstrap)
- `upsert ON CONFLICT (namespace, id) DO UPDATE`
- Field-Level LWW idéntico al LocalStrategy
- Pool de conexiones vía `postgres(process.env.DATABASE_URL!)`

**F2.3** Actualizar `getStrategy.ts`:
```
Prioridad: GITHUB_REPO → DATABASE_URL → SUPABASE_URL → Local
```

**F2.4** Actualizar `migrate/route.ts` — agregar `postgres` como estrategia válida

**F2.5** Actualizar setup SQL del migrador — ahora es 1 tabla + 1 índice, no N tablas

### Fase 3 — UI y docs (~30 min)

**F3.1** `DeploySection.tsx` — agregar card "Base de datos — PostgreSQL":
- 1 campo: `DATABASE_URL`
- Subtítulo: "Neon · Supabase · Railway · Render — formato `postgresql://`"
- Botón probar = verificar conectividad + `CREATE TABLE IF NOT EXISTS`

**F3.2** Actualizar `src/server/health/checkers.ts` — agregar `checkPostgres(url?)`

**F3.3** Actualizar `src/app/api/admin/health/route.ts` — incluir postgres en checks

**F3.4** Actualizar `Inicio.md` — sección de estrategias actualizada

### Fase 4 — Limpieza (opcional, ~15 min)

**F4.1** Decidir sobre `SupabaseStrategy` — mantener como alternativa legacy o deprecar

**F4.2** Actualizar `docs/HEALTH_CONFIGURATOR.md`

---

## Cómo cambia la gestión de proveedores de DB

### Antes (estado actual)
```
┌─ Estrategias de datos ──────────────────────────────────────────┐
│                                                                  │
│  GITHUB_REPO  →  GitHubStrategy  (✅ funcional, ❌ path roto)   │
│  SUPABASE_URL →  SupabaseStrategy (✅ funcional, tablas DDL)    │
│  (fallback)   →  LocalStrategy   (✅ dev only)                  │
│                                                                  │
│  Para Neon: no hay estrategia → bloqueado                        │
└──────────────────────────────────────────────────────────────────┘
```

### Después (con este plan)
```
┌─ Estrategias de datos ──────────────────────────────────────────┐
│                                                                  │
│  GITHUB_REPO    →  GitHubStrategy   (storage/db/ ✅ fijo)       │
│  DATABASE_URL   →  PostgresStrategy (Neon ✅, Supabase ✅,      │
│                                      Railway ✅, Render ✅)      │
│  SUPABASE_URL   →  SupabaseStrategy (legacy, PostgREST)         │
│  (fallback)     →  LocalStrategy    (dev only)                  │
│                                                                  │
│  Para Neon: DATABASE_URL=postgresql://...@ep-xxx.neon.tech/db    │
│  Para Supabase Postgres directo: DATABASE_URL=postgresql://...   │
└──────────────────────────────────────────────────────────────────┘
```

### UI Deploy — cómo cambia el panel de configuración

**Card nueva: "Base de datos — PostgreSQL"**
```
┌─ Base de datos — PostgreSQL ─ [PASS/FAIL] ──┐
│  Neon · Supabase · Railway · Render          │
│                                              │
│  DATABASE_URL  [postgresql://user:...] [👁] │
│                                              │
│  [Probar conexión]  [Guardar y redesplegar]  │
│                                              │
│  ⚠ Supabase REST (SUPABASE_URL) es legacy.  │
│  Para Supabase usa DATABASE_URL con la URL   │
│  de conexión directa de Postgres.            │
└──────────────────────────────────────────────┘
```

**Notas clave:**
- `DATABASE_URL` toma prioridad sobre `SUPABASE_URL` — si configuras ambas, Postgres gana
- La primera conexión exitosa ejecuta `CREATE TABLE IF NOT EXISTS agnostic_records` automáticamente
- No hay SQL de setup manual — el bootstrap es automático
- El health check verifica conectividad Y que la tabla existe

---

## Orden de migración para `empresa_muebles_clone`

Si ya hay datos en el GitHub repo del fork en el path VIEJO (`db/`):

1. Verificar si hay datos en `db/` en el repo de GitHub (antes del fix)
2. Si sí: correr `GET /api/admin/migrate?from=github` → generará SQL
3. Aplicar fix F1.1 (path `storage/db/`)
4. Los datos existentes en `db/` quedan huérfanos en GitHub — el engine ya no los ve
5. Hacer un push manual de los archivos del `db/` al nuevo path `storage/db/` en GitHub

Si SÓLO se usó LocalStrategy localmente y GitHub strategy nunca escribió datos reales:
1. Aplicar fix F1.1 directamente — sin migraciones

---

## Pregunta para el usuario antes de ejecutar

¿El fork `empresa_muebles_clone` tiene datos reales escritos por el sistema (no seed) en su GitHub repo? Específicamente: ¿hay archivos en la ruta `db/` del repositorio de GitHub del fork?

Si **sí** → hay que migrar esos archivos al path correcto primero.  
Si **no** → ejecutar el plan directamente.

---

## Schema de la tabla única (auto-generado en el primer connect)

```sql
CREATE TABLE IF NOT EXISTS agnostic_records (
  id         TEXT        NOT NULL,
  namespace  TEXT        NOT NULL,
  context    TEXT,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  PRIMARY KEY (namespace, id)
);

CREATE INDEX IF NOT EXISTS idx_agnostic_ns
  ON agnostic_records (namespace);
```

Este es el único DDL que existe en todo el sistema. Nunca más.
