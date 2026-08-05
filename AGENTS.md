# Hermanos García González S.A.S (Veta de Oro) — ERP + Sitio Web — V3 "Veta Dorada Real"

**Fuente de verdad del arnés agéntico.** Todo agente lee este archivo antes de actuar. Si algo que quieres que haga un agente no está aquí, no va a pasar.

**Regla canónica: Skill @arnes/ARNES_AGENTICO (obligatorio).** Este repo adopta el modelo de arneses agéntico maestro (`@arnes/ARNES_AGENTICO`). Al arrancar cualquier agente OpenCode, usar siempre:

```bash
opencode run -m opencode/deepseek-v4-flash-free --agent hermes "prompt"
```

Los agentes `hermes` y sus children (`hermes-b2-research`, `hermes-b3-tools`, `hermes-b4-multimedia`, `hermes-b5-b6-adapters`, `hermes-qa`) viven en `.opencode/agents/` y implementan el Diamond Flow (7 fases) + 5 roles + rotación obligatoria de modelos (nunca el mismo modelo dos veces seguidas). Ver `ARNES_AGENTICO.md` del repo `Airhonreality/skills` para el methodology completo.

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

## Ruta de la V3 (el orden importa)

1. **Diamante 4 (diseño visual)** — ABIERTO. Define el sistema visual antes de escribir código: stack técnico del arnés de estilos, diseño conceptual UI (arte, tipografía, librería de iconos premium, bordes/contenedores, efectos y animaciones). Entrada: `arnes/diagnostico/diamante4_metodologia.md`. Produce los design tokens + primitivas que Ola 7 consumirá en cada pantalla.
2. **Ola 7 (Execute)** — codificación de las 34 pantallas + 65 tablas + 5 gates según `arnes/diagnostico/OLA_7_ENTRADA.md` y el contrato maestro `arnes/planes/plan_ola7_maestro.md` (fases F0-F9). **Ninguna pantalla se codifica con estilo improvisado: consume los tokens del Diamante 4.**
3. **Checkpoint final del Supervisor** antes de mergear `dev` → `main`.

## Qué construye este proyecto

**V3 "Veta Dorada Real"** — reconstrucción completa del ERP + sitio web público de Hermanos García González S.A.S (Veta de Oro), con **código nuevo desde cero** (sin el motor "Agnostic Seed" ni los patrones del prototipo v2). **Mismo negocio, misma infraestructura de proveedores, arquitectura de aplicación nueva.** El conocimiento del negocio (schema de 65 tablas, 34 pantallas, 5 gates, decisiones) vive en `arnes/` y es repo-independiente; el código se escribe nuevo.

## Modelo de repositorio y despliegue (léelo antes de tocar git)

**No hay repo nuevo, no hay Neon nuevo, no hay Cloudflare R2 nuevo, no hay proyecto Vercel nuevo.** Todo vive en el mismo repositorio GitHub (`Airhonreality/empresa_muebles`), la misma base de datos Neon, el mismo bucket R2, el mismo proyecto Vercel. Lo único que cambia es el código de la aplicación.

```text
main                     → producción real (empresa-muebles-vl37.vercel.app). NO se toca hasta el corte final.
legacy-agnostic-backup   → snapshot de seguridad del sistema Agnostic, congelado en el commit fbe9bdd (2026-07-31).
                            Puro respaldo. Nunca se le hace push de código nuevo.
backup/dev-v2-arquitectura-20260804
                         → snapshot del trabajo de arquitectura v2 (prototipo) congelado en 8526676 (2026-08-04).
                            Puro respaldo: la rama `dev` v2 nunca se pusheó a producción y su código se descartó.
                            Todo el conocimiento valioso ya está en `arnes/`.
dev                      → rama huérfana (sin historia de main) donde se construye la V3.
                            Se trabaja en el worktree `../empresa_muebles_clone_v3` (ESTA carpeta), nunca en el
                            working tree principal del humano (que sigue en `main` con su propio trabajo en curso).
```

**Flujo de corte:**
1. Todo el trabajo de reconstrucción ocurre en `dev` (este worktree, `empresa_muebles_clone_v3`).
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
- Un agente **nunca** hace `checkout` de `dev` sobre el working tree principal del humano (`c:\Users\javir\Documents\DEVs\empresa_muebles_clone`). Todo trabajo de la V3 ocurre en el worktree `../empresa_muebles_clone_v3`.
- No se debe reutilizar código del prototipo v2 (`backup/dev-v2-arquitectura-20260804`) — la V3 es código nuevo a propósito. Si un patrón del prototipo resultara necesario, se discute con el Supervisor antes de copiarlo.

## Zonas y dueños

Zonas activas hoy:

| Zona | Qué contiene | Dueño | Riesgo |
|------|--------------|-------|--------|
| `arnes/` | Arnés, ledger, roles, planes, diagnóstico | Supervisor | alto |
| `arnes/diagnostico/` | Hallazgos de Fase 0 (solo lectura sobre datos reales) | Supervisor | bajo |
| `arnes/diagnostico/diamante4_*` | Entregables del Diamante 4 (diseño visual) | Supervisor | alto |
| `datos` | Cimientos F0: schema Drizzle (`lib/db/`), lógica de identidad/auditoría (`lib/modules/f0/`: roles, parámetros con historial, eventos, audit) — SIN UI | Código | alto |

Las zonas de código de producto (auth, catálogo, cotizador, contratos, producción, finanzas, sitio público, etc.) se declaran cuando el plan de arquitectura (`arnes/planes/plan_arquitectura_destino.md`) sea aprobado por el Supervisor. `datos` (F0) es la primera zona de código declarada, aprobada por el Supervisor el 2026-08-05 junto con el arranque de t-074.

## Comandos de verificación

Stack en definición por el **Diamante 4** (`arnes/diagnostico/diamante4_metodologia.md`). Referencia de v2 (prototipo, validada en runtime contra `dev-local`): Next.js + TypeScript + Drizzle ORM + Neon Postgres (misma base de datos de producción, ver modelo de ramas arriba). Los comandos de esta tabla se confirman/ajustan cuando el D4 cierre el stack definitivo.

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
