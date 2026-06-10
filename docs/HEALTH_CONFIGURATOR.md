# Configurador Interactivo de Servicios — Health Check + Vercel API

> Estado: **Implementado** — 2026-06-09
> Rama: `feature/agile-rendering-engine`

---

## Qué hace este sistema

Convierte el panel de despliegue pasivo (`DeploySection.tsx`) en un configurador interactivo que:

1. **Diagnostica** — comprueba si cada servicio está operativo, no solo si la variable existe.
2. **Testea en caliente** — prueba credenciales nuevas antes de guardarlas, sin tocar el entorno actual.
3. **Guarda en Vercel** — escribe variables directamente en la bóveda encriptada de Vercel vía API.
4. **Redespliega** — dispara un nuevo build de producción y hace polling del estado hasta terminar.

---

## Inventario de Archivos

### Nuevos

| Archivo | Rol |
|---|---|
| [src/server/health/checkers.ts](../src/server/health/checkers.ts) | 5 funciones de health check individuales (GitHub, R2, Supabase, Local, Session) |
| [src/app/api/admin/health/route.ts](../src/app/api/admin/health/route.ts) | `GET /api/admin/health` — health check global + `env_presence` map |
| [src/app/api/admin/health/test/route.ts](../src/app/api/admin/health/test/route.ts) | `POST /api/admin/health/test` — test en caliente con credenciales efímeras |
| [src/app/api/admin/config/save/route.ts](../src/app/api/admin/config/save/route.ts) | `POST /api/admin/config/save` — guarda vars en Vercel + redeploy opcional |
| [src/app/api/admin/config/deploy-status/route.ts](../src/app/api/admin/config/deploy-status/route.ts) | `GET /api/admin/config/deploy-status?deploymentId=dpl_xxx` — proxy de estado |

### Modificados

| Archivo | Cambio |
|---|---|
| [src/components/agnostic/designer/sections/DeploySection.tsx](../src/components/agnostic/designer/sections/DeploySection.tsx) | Reescritura completa — configurador interactivo con formularios, testers y polling |

### Deprecados (pendiente eliminación)

| Archivo | Reemplazado por |
|---|---|
| `src/app/api/admin/env-status/route.ts` | `/api/admin/health` (incluye `env_presence`) |

> Eliminar `env-status/route.ts` cuando se confirme que ningún otro componente lo consume.

---

## Variables de Bootstrap (configuración manual única)

El usuario configura estas **una sola vez** en Vercel Dashboard → Settings → Environment Variables:

| Variable | Descripción | Requerida |
|---|---|---|
| `VERCEL_ACCESS_TOKEN` | Token de API personal o de equipo | ✅ |
| `VERCEL_PROJECT_ID` | ID del proyecto (Settings → General) | ✅ |
| `VERCEL_TEAM_ID` | ID del equipo (solo cuentas de equipo) | ⚠️ Condicional |

Sin estas variables, los botones "Guardar en Vercel" están deshabilitados y el panel muestra el asistente de bootstrap.

---

## Variables de Git (inyectadas automáticamente por Vercel)

El endpoint de redeploy usa estas variables que Vercel inyecta en cada deployment. **No las configures manualmente.**

| Variable | Ejemplo |
|---|---|
| `VERCEL_GIT_PROVIDER` | `"github"` |
| `VERCEL_GIT_REPO_ID` | `"123456789"` |
| `VERCEL_GIT_COMMIT_REF` | `"main"` |

Si estas no están disponibles (desarrollo local, deployment sin git), el save procede pero el redeploy se omite con un mensaje de advertencia. Las variables **sí se guardan** en Vercel.

---

## API Reference

### `GET /api/admin/health`

Respuesta (IETF `draft-inadarei-api-health-check` extendido):

```json
{
  "status": "warn",
  "description": "Estado de los servicios del sistema",
  "activeDataStrategy": "github",
  "env_presence": {
    "VERCEL_ACCESS_TOKEN": true,
    "VERCEL_PROJECT_ID": true,
    "GITHUB_TOKEN": true,
    "GITHUB_REPO": true,
    "GITHUB_BRANCH": false,
    "CF_ACCOUNT_ID": true,
    "CF_R2_BUCKET": true,
    "CF_R2_ACCESS_KEY_ID": true,
    "CF_R2_SECRET_ACCESS_KEY": true,
    "CF_R2_PUBLIC_URL": false,
    "SUPABASE_URL": false,
    "SUPABASE_SERVICE_ROLE_KEY": false,
    "SESSION_SECRET": true
  },
  "checks": {
    "data:github":   [{ "status": "pass", "latency_ms": 312, ... }],
    "storage:r2":    [{ "status": "pass", "latency_ms": 187, ... }],
    "data:supabase": [{ "status": "fail", "output": "SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados", ... }],
    "data:local":    [{ "status": "warn", "output": "LocalStrategy no es persistente en Vercel...", ... }],
    "auth:session":  [{ "status": "pass", ... }]
  }
}
```

**Derivación del status global:**
- Solo el check de la **estrategia activa** determina `fail` (no el check de estrategias no configuradas).
- LocalStrategy en Vercel retorna `warn`, nunca `fail` — es comportamiento esperado.
- HTTP 503 solo si la estrategia activa tiene `status: "fail"`.

---

### `POST /api/admin/health/test`

```json
// Request
{
  "strategy": "github",
  "credentials": {
    "GITHUB_TOKEN": "github_pat_...",
    "GITHUB_REPO": "usuario/repo"
  }
}

// Response (CheckResult)
{
  "componentId": "github-strategy",
  "componentType": "datastore",
  "status": "pass",
  "time": "2026-06-09T18:30:00Z",
  "latency_ms": 312
}
```

**Comportamiento de fallback:** Si un campo en `credentials` es string vacío u omitido, el checker usa `process.env.*`. Esto permite testear la configuración actual sin ingresar nada.

---

### `POST /api/admin/config/save`

```json
// Request
{
  "variables": [
    { "key": "GITHUB_TOKEN", "value": "github_pat_...", "sensitive": true },
    { "key": "GITHUB_REPO", "value": "usuario/repo", "sensitive": false }
  ],
  "redeploy": true
}

// Response
{
  "saved": 2,
  "failed": 0,
  "errors": [],
  "deployment": {
    "id": "dpl_abc123",
    "url": "https://mi-proyecto-xyz.vercel.app",
    "readyState": "QUEUED"
  }
}
```

---

### `GET /api/admin/config/deploy-status?deploymentId=dpl_xxx`

```json
{
  "id": "dpl_abc123",
  "readyState": "READY",
  "url": "https://mi-proyecto-xyz.vercel.app",
  "errorMessage": null
}
```

**Estados posibles de `readyState`:** `QUEUED` → `BUILDING` → `READY` | `ERROR` | `CANCELED`

El cliente hace polling cada 5 segundos. El polling se detiene automáticamente al alcanzar un estado terminal o después de 72 intentos (~6 minutos).

---

## Correcciones respecto al plan original (v2)

### Bug 1 — `gitSource` incompleto

**Plan original:** `"gitSource": { ... }` (placeholder vacío).

**Solución:** Se usa `process.env.VERCEL_GIT_PROVIDER`, `VERCEL_GIT_REPO_ID`, `VERCEL_GIT_COMMIT_REF`. Vercel los inyecta automáticamente en producción. Si no están disponibles (desarrollo local), el save procede sin redeploy y se informa con `warning`.

---

### Bug 2 — LocalStrategy siempre falla en Vercel pero es el fallback activo

**Plan original:** La derivación global marcaba `fail` si algún check era `fail`, sin distinguir si era la estrategia activa.

**Solución:** Solo el check de `activeDataStrategy` (resuelto siguiendo la misma lógica que `getStrategy.ts`) determina el status global. LocalStrategy en Vercel retorna `warn` (no `fail`) para comunicar que está degradado pero no roto.

---

### Bug 3 — UI mostraba `••••••` para valores encrypted existentes

**Plan original:** El wireframe mostraba inputs pre-llenados con puntos, contradiciendo que Vercel no devuelve valores de encrypted vars.

**Solución:** Los inputs siempre están vacíos. El estado "existe" se comunica mediante un badge `✅` y el placeholder `— dejar vacío para mantener —`. Solo se envían a Vercel los campos con valor no vacío.

---

### Bug 4 — Polling sin condición de parada

**Plan original:** "Polling cada 5 segundos" sin timeout ni max intentos.

**Solución:** `MAX_POLL_ATTEMPTS = 72` (6 minutos). El polling también termina inmediatamente al detectar un estado terminal (`READY`, `ERROR`, `CANCELED`). Si se supera el máximo, el estado se establece en `ERROR` con un mensaje de timeout.

---

## Checkers — Implementación

### GitHub

- Endpoint: `GET https://api.github.com/repos/{owner}/{repo}`
- Header: `Authorization: token {GITHUB_TOKEN}` (mismo formato que `GitHubStrategy.ts`)
- Verifica: respuesta HTTP 200 + `permissions.push === true`
- Nota sobre fine-grained tokens: si no hay `permissions` object, retorna `warn` (no `fail`) porque los fine-grained tokens no siempre exponen ese campo.

### Cloudflare R2

- **No usa `ListObjectsV2`** (solo verifica s3:ListBucket, insuficiente para uploads).
- Usa `PutObject` + `DeleteObject` sobre `.agnostic-health-check` — verifica permisos reales de escritura.
- Timeout: 5 segundos.

### Supabase

- Endpoint: `GET {SUPABASE_URL}/rest/v1/`
- HTTP 200 o 400 (sin tabla especificada) = servicio accesible.
- HTTP 401/403 = credenciales inválidas.

### LocalStrategy

- En Vercel (`process.env.VERCEL` definido): retorna `warn` siempre (filesystem read-only post-build).
- En desarrollo: verifica `fs.access(siloPath, W_OK)`.

### Session

- No hace requests externos. Verifica que `SESSION_SECRET` exista y tenga ≥ 32 caracteres.
- Retorna `warn` (no `fail`) si falta — el sistema funciona en modo abierto sin auth.

---

## Seguridad — Notas de Diseño

| Riesgo | Mitigación |
|---|---|
| Credenciales en tránsito | HTTPS (TLS). MVP aceptable cuando el admin es el propio desarrollador. |
| `VERCEL_ACCESS_TOKEN` como llave maestra | Usar Fine-grained Tokens de Vercel con scope mínimo. Rotar periódicamente. |
| Valores de vars encrypted no recuperables | La UI nunca pre-llena campos. Solo muestra presencia (boolean). |
| Logs del servidor con credenciales | El endpoint `/api/admin/health/test` recibe credenciales en el body. Verificar que el middleware de logging no registre bodies de POST en producción. |
