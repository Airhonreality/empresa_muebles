# Hermanos García González S.A.S (Veta de Oro) — ERP + Sitio Web (rearquitectura)

**Fuente de verdad del arnés agéntico.** Todo agente lee este archivo antes de actuar. Si algo que quieres que haga un agente no está aquí, no va a pasar.

## Cómo arrancar (si eres un agente, esto es lo primero)

Este proyecto se trabaja por roles. Ningún agente actúa por su cuenta: cada uno asume un rol y cumple su contrato.

1. Termina de leer este archivo. Define las zonas, las prohibiciones y cómo se verifica el trabajo.
2. Lee `arnes/estado.md`. Dice en qué punto quedó el proyecto y cuál es la próxima acción permitida.
3. Lee `arnes/INDEX.md`. Dice qué más hace falta leer, y solo eso.
4. Asume tu rol leyendo su contrato en `arnes/roles/`:

| Rol | Contrato | Para qué |
|-----|----------|----------|
| Orquestador | `arnes/roles/orquestador.md` | Traduce lo que pide el humano en tareas. No escribe código. |
| Iniciador | `arnes/roles/iniciador.md` | Escribe el plan antes de que se toque código. |
| Código | `arnes/roles/codigo.md` | Ejecuta un plan ya aprobado, dentro de una sola zona. |
| QA | `arnes/roles/qa.md` | Verifica con evidencia mecánica. Nunca acepta la palabra del ejecutor. |
| Supervisor | `arnes/roles/supervisor.md` | Es el humano (Javier). Es el único que aprueba. |

Si nadie te dijo qué rol asumir, asume **Orquestador** y pregunta antes de actuar.

**Regla de arranque que no se negocia:** no escribas ni modifiques código sin un plan aprobado para una tarea registrada.

## Qué construye este proyecto

Reconstrucción completa del ERP + sitio web público de Hermanos García González S.A.S (Veta de Oro), reemplazando el motor genérico "Agnostic Seed" (schema-driven, zaps interpretados en runtime) por código explícito React/Next.js/TypeScript. **Mismo negocio, misma infraestructura de proveedores, arquitectura de aplicación nueva.**

## Modelo de repositorio y despliegue (léelo antes de tocar git)

**No hay repo nuevo, no hay Neon nuevo, no hay Cloudflare R2 nuevo, no hay proyecto Vercel nuevo.** Todo vive en el mismo repositorio GitHub (`Airhonreality/empresa_muebles`), la misma base de datos Neon, el mismo bucket R2, el mismo proyecto Vercel. Lo único que cambia es el código de la aplicación.

```text
main                     → producción real (empresa-muebles-vl37.vercel.app). NO se toca hasta el corte final.
legacy-agnostic-backup   → snapshot de seguridad del sistema Agnostic, congelado en el commit fbe9bdd (2026-07-31).
                            Puro respaldo. Nunca se le hace push de código nuevo.
dev                      → rama huérfana (sin historia de main) donde se construye la arquitectura nueva.
                            Se trabaja en el worktree `../empresa_muebles_clone-dev`, nunca en el
                            working tree principal del humano (que sigue en `main` con su propio trabajo
                            en curso, no relacionado con esta migración).
```

**Flujo de corte:**
1. Todo el trabajo de reconstrucción ocurre en `dev` (este worktree).
2. Vercel, al tener Git Integration activada sobre este mismo proyecto, genera automáticamente una URL de preview por cada push a `dev` — usando las MISMAS variables de entorno de Neon/R2 que producción (verificar en el dashboard de Vercel que `DATABASE_URL`, `CF_R2_*` estén habilitadas para el entorno Preview, no solo Production — checkpoint pendiente, ver `arnes/estado.md`).
3. Javier prueba esa URL de preview con datos REALES (misma base de datos que producción — cuidado: esto significa que escrituras desde `dev` SÍ tocan datos reales, no hay entorno de pruebas aislado a menos que se decida lo contrario).
4. Solo cuando Javier aprueba explícitamente, se hace merge de `dev` → `main`. Ese merge es lo único que dispara el redeploy de producción real.
5. Nunca se hace push directo a `main` durante la migración. `legacy-agnostic-backup` queda como punto de retorno si algo sale mal después del corte.

## Prohibido

- No se debe hacer push ni merge a `main` sin aprobación explícita del Supervisor (checkpoint final de la migración).
- No se debe modificar ni hacer push a `legacy-agnostic-backup` — es un snapshot congelado.
- No se debe usar el motor "Agnostic Seed" ni ningún patrón schema-driven genérico equivalente en el código nuevo.
- No se debe migrar un registro de datos "as-is" sin haberlo revisado en el diagnóstico de Fase 0 (`arnes/diagnostico/`).
- No se debe modificar el schema de datos (ORM) ni las reglas de este `AGENTS.md` sin pasar por el checkpoint de Supervisor.
- Credenciales y secretos nunca viven en archivos versionados. Las credenciales reales (Neon, R2, GitHub) ya existen en las variables de entorno de Vercel de este mismo proyecto — no hay que crear ni copiar ninguna.
- Un agente **nunca** hace `checkout` de `dev` sobre el working tree principal del humano (`c:\Users\javir\Documents\DEVs\empresa_muebles_clone`). Todo trabajo de esta migración ocurre en el worktree `../empresa_muebles_clone-dev`.

## Zonas y dueños

Zonas activas hoy:

| Zona | Qué contiene | Dueño | Riesgo |
|------|--------------|-------|--------|
| `arnes/` | Arnés, ledger, roles, planes, diagnóstico | Supervisor | alto |
| `arnes/diagnostico/` | Hallazgos de Fase 0 (solo lectura sobre datos reales) | Supervisor | bajo |

Las zonas de código de producto (auth, catálogo, cotizador, contratos, producción, finanzas, sitio público, etc.) se declaran cuando el plan de arquitectura (`arnes/planes/plan_arquitectura_destino.md`) sea aprobado por el Supervisor.

## Comandos de verificación

Stack confirmado: Next.js + TypeScript + Drizzle ORM + Neon Postgres (misma base de datos de producción, ver modelo de ramas arriba).

| Qué verifica | Comando | Nota |
|--------------|---------|------|
| Tipos | `npx tsc --noEmit` | Cubre todo el árbol. Úsese siempre, en cada tarea. |
| Estilo | `npx eslint .` | Configurado (`eslint.config.mjs`). Encontró y se usó para corregir 4 errores reales (`<a>` en vez de `next/link`) el 2026-07-31. |
| Pruebas | `npx tsx <archivo>.test.ts` (uno por módulo, sin framework instalado — patrón `node:assert` manual) | No hay runner que corra todos a la vez todavía; correr cada `*.test.ts` del módulo tocado. **Los tests que importan `lib/db/client.ts` (directo o indirecto, ej. `lib/modules/*/queries.test.ts`) fallan al importar si `DATABASE_URL` no está definida en el entorno** — el cliente Postgres se construye al importar el módulo, aunque el test nunca abra una conexión real. Correr así: `DATABASE_URL='postgres://test:test@localhost:5432/no_connect_placeholder' npx tsx <archivo>.test.ts`. No es un bug: ningún valor real de Neon debe usarse acá, el placeholder solo satisface la construcción del cliente. |
| Construcción | `npx next build` | **Verificación parcial únicamente**: páginas que no consultan la base de datos compilan y prerenderizan bien (encontró y permitió corregir 2 bugs reales el 2026-07-31: falta de `<Suspense>` alrededor de `useSearchParams()`, y una relación de Drizzle mal definida). Páginas que sí consultan datos (`/colecciones`, `/portafolio`, etc.) fallan con `ECONNREFUSED` sin una `DATABASE_URL` real — **esto es esperado**, no un defecto de código, hasta que exista la rama `dev-local` de Neon (ver `arnes/estado.md`, hallazgo crítico). Correr igual: cualquier error que NO sea de conexión es un bug real que hay que arreglar. |
| Ejecución | `npm run dev` | Ya se puede correr: `.env.local` del worktree `dev` apunta a la rama `dev-local` de Neon (creada 2026-08-01, ver `arnes/estado.md`), nunca a producción. Requiere `SESSION_SECRET` además de `DATABASE_URL` (sin fallback a propósito, ver `lib/auth/session.ts`) — si falta, la app falla fuerte con un error claro en vez de firmar sesiones con un valor adivinable. |

## Checkpoints obligatorios

- Antes de mergear `dev` → `main` (corte final de producción).
- Antes de cualquier mutación del arnés (`arnes/`, `AGENTS.md`).
- Antes de decidir el stack/arquitectura final de destino.
- Antes de que cualquier escritura desde `dev` toque la base de datos real de producción (ver nota del paso 3 del flujo de corte).
- Antes de habilitar el entorno Preview de Vercel a usar las credenciales reales de Neon/R2 (si no estaban ya habilitadas).

## Secretos y credenciales

Tareas marcadas `[SOLO_HUMANO]` en el ledger porque requieren credenciales que el sandbox del agente no puede leer (redactadas automáticamente): auditoría de objetos en Cloudflare R2 (`CF_R2_*`). El repo, Neon y Vercel YA EXISTEN — no hace falta crear nada, por eso ya no hay una tarea `[SOLO_HUMANO]` de "provisionar infraestructura".

## Versión del prefab

```
version_prefab: 1
```
