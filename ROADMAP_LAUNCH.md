# ROADMAP A — Kernel Público + GitHub Storage + Portal Central

**Prioridad:** 1 (base de todo lo demás)
**Implementador:** Gemini (o cualquier agente que lea este documento)
**Estado del sistema:** v2-sovereign-rebirth, build pasa, Next.js 15, TypeScript estricto

---

## Objetivo

Desacoplar el kernel (Next.js en Vercel) del storage (JSON en GitHub) de forma que:
1. El kernel sea un repositorio público reutilizable (template).
2. Cada cliente/proyecto tenga su propio repositorio GitHub privado como base de datos.
3. El kernel se conecte a cualquier storage repo vía variables de entorno en Vercel.
4. En fase 2: un solo despliegue del kernel sirva múltiples tenants por subdominio.
5. En fase 3: un portal central (`studio.agnosticui.com`) gestione el onboarding, autenticación y entrega de tokens de cliente — eliminando toda configuración manual de Vercel.

---

## Estado actual del sistema — lo que YA existe y NO debe tocarse

| Archivo | Qué hace | Estado |
|---------|----------|--------|
| `src/server/strategies/GitHubStrategy.ts` | Lee/escribe `db/{namespace}.json` en un repo GitHub vía Contents API | **Completo. No modificar.** |
| `src/server/getStrategy.ts` | Factory que devuelve `GitHubStrategy` cuando `storage_strategy === 'GitHubStrategy'` | **Completo. No modificar en Phase 1.** |
| `src/server/activeProject.ts` | `readPassport()` ya prioriza `process.env.GITHUB_REPO` sobre el filesystem | **Completo. No modificar en Phase 1.** |
| `packages/core/src/indra.ts` | `SystemPassport` ya tiene `github_repo`, `github_branch` | **Completo. No modificar.** |

**Invariante de `readPassport()` que ya funciona:**
```typescript
// activeProject.ts — línea 13-21
if (process.env.GITHUB_REPO) {
  return {
    project_identity: process.env.GITHUB_REPO,
    storage_strategy: 'GitHubStrategy',
    github_repo: process.env.GITHUB_REPO,
    github_branch: process.env.GITHUB_BRANCH ?? 'main',
    dna_strategy: 'local',
  };
}
```
Con solo setear `GITHUB_REPO` y `GITHUB_TOKEN` en Vercel, el sistema ya redirige todo I/O a GitHub. Phase 1 es pura configuración + estructura de repo.

---

## Arquitectura final (visión completa)

```
┌──────────────────────────────────────────────────────────────────┐
│  studio.agnosticui.com  (Portal Central — Phase 3)               │
│  · GitHub OAuth login                                            │
│  · Gestión de repos conectados                                   │
│  · Generación de AGNOSTIC_CLIENT_TOKEN                           │
│  · Genesis commit automático en repos vacíos                     │
│  · Designer visual (SovereigntyOrchestrator)                     │
│  Infraestructura propia: Upstash KV + iron-session               │
└───────────┬──────────────────────────────────────────────────────┘
            │  valida client-token + lee/escribe vía OAuth token
            ▼
┌──────────────────────────────────────────────────────────────────┐
│  GitHub (storage repo — privado, por cliente)                    │
│  owner/empresa-2-storage                                         │
│  ├── db/                                                         │
│  │   ├── schema_definitions.json                                 │
│  │   ├── page_routes.json                                        │
│  │   └── {contexto_de_negocio}.json                              │
│  └── (sin src/, sin node_modules)                                │
└───────────┬──────────────────────────────────────────────────────┘
            │  cliente consulta schema via client-token (Phase 4)
            ▼
┌──────────────────────────────────────────────────────────────────┐
│  Vercel (kernel deployment — tenant-site del cliente)            │
│  Env vars (Phase 1-2): GITHUB_TOKEN + GITHUB_REPO                │
│  Env vars (Phase 4):   AGNOSTIC_CLIENT_TOKEN                     │
│  Sitio: carcasa visual ciega que renderiza lo que el             │
│  storage define — sin designer, sin lógica de negocio            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase 1 — Single-Tenant MVP (zero cambios en código)

### Objetivo
Un cliente, un repo de storage, un Vercel deployment. Demostrar que el ciclo completo funciona.

### Paso 1.1 — Crear el repositorio de storage template

Crear el repositorio `owner/agnostic-storage-template` (o `owner/{cliente}-storage`) con esta estructura exacta:

```
db/
  schema_definitions.json
  page_routes.json
  system_config.json
README.md
```

**Contenido canónico de `db/schema_definitions.json`:**
```json
[]
```

**Contenido canónico de `db/page_routes.json`:**
```json
[]
```

**Contenido canónico de `db/system_config.json`:**
```json
[
  {
    "id": "master_passport",
    "context": "system_config",
    "data": {
      "project_identity": "REEMPLAZAR_CON_OWNER/REPO",
      "storage_strategy": "GitHubStrategy",
      "dna_strategy": "local"
    },
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
]
```

> NOTA: `system_config.json` en el storage repo es solo documentación/referencia. En producción, `readPassport()` lo ignora porque `process.env.GITHUB_REPO` tiene prioridad. No remover `system_config.json` del repo porque `LocalStrategy.read('system_config')` lo busca en el root de storage — en GitHub, `GitHubStrategy` lo busca en `db/system_config.json`.

### Paso 1.2 — Variables de entorno en Vercel

En el dashboard de Vercel del proyecto del kernel, setear:

| Variable | Valor | Secreto |
|----------|-------|---------|
| `GITHUB_TOKEN` | `ghp_xxxxxxxxxxxxx` (Personal Access Token con scope `repo`) | SÍ — marcar como sensitive |
| `GITHUB_REPO` | `owner/empresa-2-storage` | No |
| `GITHUB_BRANCH` | `main` | No |

**Permisos mínimos del token:** `repo` (read + write sobre repos privados). Si el storage es público, `public_repo` alcanza.

### Paso 1.3 — Verificar que `storage/` esté en `.gitignore` del kernel

⚠️ BLOCKER CRÍTICO — Los datos de negocio locales están en `storage/` y no están ignorados. Si alguien hace `git add . && git push` al kernel público, todo el historial de cliente queda expuesto permanentemente.

Verificar en `.gitignore`:
```
storage/
```

Si no está, agregar inmediatamente. Nunca commitear `storage/` al kernel repo.

### Paso 1.4 — Instalar `server-only`

⚠️ BLOCKER CRÍTICO — `getStrategy.ts` y `activeProject.ts` no tienen ningún guard. Si alguien importa `getStrategy` desde un componente client, `GITHUB_TOKEN` puede filtrarse al bundle del browser.

```bash
npm install server-only
```

Agregar como primera línea en:
- `src/server/getStrategy.ts`
- `src/server/activeProject.ts`

```typescript
import 'server-only';
```

### Paso 1.5 — Deploy y smoke test

Después del deploy:
1. `GET /api/vault?namespace=schema_definitions` → debe devolver `[]` (array vacío, no error).
2. `POST /api/vault` con body `{ "action": "WRITE", "namespace": "schema_definitions", "record": { "data": { "name": "test" } } }` → debe devolver `{ success: true, record: {...} }` y crear/actualizar `db/schema_definitions.json` en el repo de storage.
3. Verificar en GitHub que el commit apareció en el repo de storage.

### Vectores de entropía — Phase 1

**Vector 1: `GITHUB_TOKEN` en el cliente**
RIESGO: Si alguien hace `import { GitHubStrategy } from '@/server/strategies/GitHubStrategy'` en un componente React (client), Next.js puede incluir el módulo en el bundle del cliente.
MITIGACIÓN: `import 'server-only'` en `getStrategy.ts` (Paso 1.4 lo cubre).

**Vector 2: Filesystem en Vercel**
`LocalStrategy` usa `fs` directamente. Si `getStrategy()` devuelve `LocalStrategy` en Vercel (porque `GITHUB_REPO` no está seteado), escribirá en el filesystem efímero — los datos se pierden en cada deploy.

MITIGACIÓN: En `getStrategy()`, añadir una guardia explícita:
```typescript
if (process.env.VERCEL && passport.storage_strategy === 'LocalStrategy') {
  console.error('[getStrategy] WARNING: LocalStrategy in Vercel — data will not persist. Set GITHUB_REPO.');
}
```

**Vector 3: Rate limits de GitHub API**
GitHub permite 5000 requests/hora por token autenticado. En un page load con 4 contextos son 4 requests. Con Next.js `React.cache`, el SSR deduplica dentro de un render cycle.
MITIGACIÓN FASE 1: Aceptable para proyectos pequeños (<100 usuarios concurrentes). En Phase 3 agregar cache con `unstable_cache` (TTL 30s).

**Vector 4: Nombres de archivos en el storage repo**
`GitHubStrategy.fetchFile()` busca exactamente `db/{namespace}.json`. Si el archivo existe con nombre erróneo (ej. `db/schemaDefinitions.json`), el sistema devuelve vacío sin avisar.
MITIGACIÓN: El storage template debe usar nombres exactamente en snake_case. El nombre del archivo JSON debe ser idéntico al `context`/`namespace` en los bloques de página.

**Vector 5: `system_config` en GitHubStrategy**
`LocalStrategy.read('system_config')` tiene un caso especial que lee de `storage/system_config.json` (root). `GitHubStrategy.read('system_config')` busca en `db/system_config.json`. El storage template debe incluir `db/system_config.json`, no en la raíz.

---

## Phase 2 — Multi-Tenant por Subdominio

### Objetivo
Un solo deployment del kernel en Vercel sirve múltiples tenants. Cada tenant se identifica por subdominio: `empresa-2.kernel.com` → lee del repo `owner/empresa-2-storage`.

### Prerequisito
Phase 1 funcional y probado.

### Arquitectura

```
cliente.mikernel.com  →  X-Tenant: cliente  →  GitHubStrategy(owner, cliente-storage)
empresa2.mikernel.com →  X-Tenant: empresa2 →  GitHubStrategy(owner, empresa2-storage)
```

### Paso 2.1 — Variable de entorno `TENANTS_MAP`

En Vercel, añadir la variable:

```
TENANTS_MAP = {"empresa-2":"owner/empresa-2-storage","cliente-xyz":"owner/xyz-storage"}
```

Es un JSON compacto sin espacios. Los keys son los subdominios (sin el dominio base). Los values son `owner/repo`.

**Variante con tokens por tenant** (si cada cliente tiene su propio token):
```
TENANTS_MAP = {"empresa-2":{"repo":"owner/e2-storage","token":"ghp_AAA"},"cliente-xyz":{"repo":"owner/xyz-storage","token":"ghp_BBB"}}
```
Para el MVP de Phase 2 usar un único `GITHUB_TOKEN` global con acceso a todos los repos.

### Paso 2.2 — Crear `src/middleware.ts`

Este archivo NO existe actualmente. Crearlo en la raíz de `src/`:

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const baseDomain = process.env.BASE_DOMAIN ?? '';
  
  const subdomain = baseDomain && host.endsWith(`.${baseDomain}`)
    ? host.slice(0, host.length - baseDomain.length - 1)
    : null;

  if (subdomain) {
    const headers = new Headers(request.headers);
    headers.set('x-tenant', subdomain);
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/:path*'],
};
```

### Paso 2.3 — Modificar `src/server/activeProject.ts`

Añadir la función `readPassportForTenant(tenantKey: string)`:

```typescript
export function readPassportForTenant(tenantKey: string): SystemPassport {
  const tenantsMapRaw = process.env.TENANTS_MAP;
  if (tenantsMapRaw && tenantKey) {
    try {
      const map = JSON.parse(tenantsMapRaw) as Record<string, string | { repo: string; token?: string }>;
      const entry = map[tenantKey];
      if (entry) {
        const repo = typeof entry === 'string' ? entry : entry.repo;
        return {
          project_identity: repo,
          storage_strategy: 'GitHubStrategy',
          github_repo: repo,
          github_branch: process.env.GITHUB_BRANCH ?? 'main',
          dna_strategy: 'local',
        };
      }
    } catch (e) {
      throw new Error(`[readPassportForTenant] TENANTS_MAP is not valid JSON: ${e}`);
    }
  }
  return readPassport();
}
```

**IMPORTANTE:** No modificar `readPassport()`. Es la función de fallback.

### Paso 2.4 — Modificar `src/server/getStrategy.ts`

```typescript
export function getStrategy(tenantKey?: string): AgnosticBridge {
  const passport = tenantKey 
    ? readPassportForTenant(tenantKey) 
    : readPassport();

  if (passport.storage_strategy === 'SupabaseStrategy') {
    return new SupabaseStrategy(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  if (passport.storage_strategy === 'GitHubStrategy') {
    const [owner, repo] = (passport.github_repo ?? passport.project_identity).split('/');
    return new GitHubStrategy(owner, repo);
  }

  return new LocalStrategy(getSiloPath(passport.project_identity));
}
```

### Paso 2.5 — Modificar rutas API

Las funciones `GET` y `POST` de cada route deben leer `x-tenant` y pasarlo a `getStrategy()`:

```typescript
export async function GET(req: NextRequest) {
  const tenantKey = req.headers.get('x-tenant') ?? undefined;
  const strategy = getStrategy(tenantKey);
  // ... resto igual
}
```

Aplicar a:
- `src/app/api/vault/route.ts`
- `src/app/api/modules/[name]/route.ts`
- `src/app/api/assets/[...filePath]/route.ts`
- `src/app/api/upload/route.ts`

> ⚠️ `src/app/api/workflow/route.ts` fue eliminado en v2-sovereign-rebirth. Omitir.

### Paso 2.6 — Variables de entorno adicionales (Phase 2)

| Variable | Valor |
|----------|-------|
| `BASE_DOMAIN` | `mikernel.vercel.app` (o dominio custom) |
| `TENANTS_MAP` | JSON con el mapa de tenants |
| `GITHUB_TOKEN` | Token global con acceso a todos los repos de storage |

### Vectores de entropía — Phase 2

**Vector 1: `x-tenant` spoofing**
Un cliente puede hacer un request con header `x-tenant: otro-cliente` y acceder al storage de otro tenant.
MITIGACIÓN FASE 2: El token de GitHub es el control de acceso real — el kernel solo puede leer/escribir repos para los que tiene permisos. En Phase 3 se reemplaza por validación de client-token.

**Vector 2: Rate limits colapsan en multi-tenant**
Con un `GITHUB_TOKEN` global, los 5000 req/hora de GitHub se comparten entre todos los tenants.
MITIGACIÓN: En Phase 4, cada tenant usa su propio OAuth token para GitHub (obtenido en el onboarding del portal). El central nunca comparte tokens.

**Vector 3: Token por tenant no implementado en GitHubStrategy**
Actualmente `GitHubStrategy` siempre usa `process.env.GITHUB_TOKEN`. Si `TENANTS_MAP` incluye tokens por tenant, esos tokens son ignorados.

MITIGACIÓN: Modificar `GitHubStrategy` para aceptar token opcional:
```typescript
constructor(
  private readonly owner: string,
  private readonly repo: string,
  private readonly customToken?: string
) {}

private get token(): string | undefined {
  return this.customToken ?? process.env.GITHUB_TOKEN;
}
```
Y en `getStrategy()`, pasar el token si existe en el mapa:
```typescript
const token = typeof entry !== 'string' ? entry.token : undefined;
return new GitHubStrategy(owner, repo, token);
```

**Vector 4: `React.cache` con multi-tenant**
`src/core/server/vault.ts` usa `React.cache` para deduplicar llamadas SSR. Con multi-tenant, dos tenants diferentes en el mismo render cycle compartirían el cache si `getVaultData` no incluye el tenantKey como parte del key.
MITIGACIÓN: Verificar que `getVaultData` recibe y pasa el tenantKey como argumento. `React.cache` aísla por argumentos automáticamente.

---

## Phase 3 — Portal Central (studio.agnosticui.com)

### Objetivo

Eliminar toda configuración manual de Vercel. El usuario entra al portal, se loguea con GitHub, conecta un repo vacío, y recibe un `AGNOSTIC_CLIENT_TOKEN`. Con ese token en Vercel, su sitio empieza a funcionar. El portal es también donde vive el designer visual (SovereigntyOrchestrator) — el sitio desplegado del cliente es una carcasa ciega sin panel de edición.

### Prerequisito
Phase 2 funcional. Decisión tomada: el designer vive SOLO en el portal central, no en el sitio desplegado del cliente.

### Infraestructura nueva requerida

El portal central NO puede almacenarse en un GitHub repo. Necesita:

| Componente | Herramienta | Por qué |
|------------|-------------|---------|
| Session management | `iron-session` | Sesiones server-side encriptadas en cookies |
| Token store | Upstash Redis (KV) | `client_token → { github_repo, oauth_token }` |
| Auth provider | GitHub OAuth App | Login del usuario, permisos para crear commits |
| Deploy | Vercel (repo separado) | El portal y el kernel son repos distintos |

> El portal central es un Next.js independiente. No es una ruta del kernel. El kernel es el producto que los clientes despliegan; el portal es el SaaS que los gestiona.

### Paso 3.1 — Registrar una GitHub OAuth App

En `github.com/settings/developers → OAuth Apps → New OAuth App`:
- **Homepage URL:** `https://studio.agnosticui.com`
- **Authorization callback URL:** `https://studio.agnosticui.com/api/auth/callback`

Guardar `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET` como env vars del portal.

### Paso 3.2 — Flujo de autenticación (GitHub OAuth)

```
/login
  → redirect a github.com/login/oauth/authorize?client_id=XXX&scope=repo
  → GitHub redirige a /api/auth/callback?code=YYY
  → servidor hace POST a github.com/login/oauth/access_token
  → recibe { access_token, token_type, scope }
  → guarda en iron-session: { github_user, access_token }
  → redirect a /dashboard
```

**Implementación del callback:**
```typescript
// portal/src/app/api/auth/callback/route.ts
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const { access_token } = await tokenRes.json();

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const githubUser = await userRes.json();

  const session = await getIronSession(cookies(), {
    password: process.env.SESSION_SECRET!,
    cookieName: 'agnostic_session',
  });
  (session as any).github_user = githubUser.login;
  (session as any).access_token = access_token;
  await session.save();

  return Response.redirect(new URL('/dashboard', req.url));
}
```

**Variables de entorno del portal:**
| Variable | Valor |
|----------|-------|
| `GITHUB_CLIENT_ID` | ID de la OAuth App |
| `GITHUB_CLIENT_SECRET` | Secret de la OAuth App |
| `SESSION_SECRET` | String aleatorio ≥32 chars (para encriptar cookies) |
| `UPSTASH_REDIS_REST_URL` | URL del KV store |
| `UPSTASH_REDIS_REST_TOKEN` | Token del KV store |

### Paso 3.3 — Conexión de un repositorio (flujo del usuario)

```
Usuario en /dashboard → "Conectar nuevo repositorio"
  → lista sus repos de GitHub usando el access_token de sesión
    GET https://api.github.com/user/repos?type=all&per_page=100
  → usuario selecciona un repo (o crea uno nuevo vacío)
  → POST /api/repos/connect { repo: "owner/repo-name" }
    → verifica que el repo exté vacío (sin commits) vía GitHub API
    → si está vacío: genera genesis commit con estructura db/ canónica
    → genera AGNOSTIC_CLIENT_TOKEN = crypto.randomUUID()
    → guarda en Upstash: SET client_token:<token> { repo, owner, access_token }
    → devuelve { client_token }
  → UI muestra el token al usuario con instrucciones para Vercel
```

**Genesis commit (estructura que el portal crea automáticamente):**
```typescript
// Crea db/schema_definitions.json, db/page_routes.json, db/system_config.json
// en el repo del usuario vía GitHub Contents API con el access_token del usuario
// — el rate limit es del usuario, no del portal central
```

> Invariante de rate limits: el portal SIEMPRE usa el `access_token` del usuario para operar sobre su repo. El portal nunca usa un token propio para escribir en repos ajenos. Cada usuario tiene su cuota independiente de 5000 req/hora.

### Paso 3.4 — Validación de client-token en el portal

Cada request del tenant-site al portal debe validar el token:

```typescript
// portal/src/app/api/tenant/[...path]/route.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function GET(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await redis.get<{ repo: string; access_token: string }>(`client_token:${token}`);
  if (!session) return Response.json({ error: 'Invalid token' }, { status: 403 });

  // Proxy la request a GitHub usando el access_token del propietario del repo
  // ...
}
```

### Paso 3.5 — Designer en el portal (no en el sitio del cliente)

El `SovereigntyOrchestrator` se mueve al portal central. El sitio desplegado del cliente elimina el botón de Settings y el designer drawer. La arquitectura queda:

```
portal (autenticado) → designer → escribe en GitHub repo del cliente
sitio cliente (público) → read-only → lee de GitHub repo vía client-token
```

Para implementar esto en el kernel: el `SovereigntyOrchestrator` debe verificar una variable de entorno `ENABLE_DESIGNER=true` antes de renderizarse. En los sitios de clientes esta variable no existe → el designer es invisible.

```typescript
// src/components/agnostic/engine/SovereigntyOrchestrator.tsx
if (!process.env.NEXT_PUBLIC_ENABLE_DESIGNER) return null;
```

### Vectores de entropía — Phase 3

**Vector 1: Single point of failure del portal**
Si el portal cae, los sitios de clientes que dependen de él para leer schemas caen también.
MITIGACIÓN: Los tenant-sites deben usar `unstable_cache` con TTL largo (5 min) para schemas y rutas. El portal es la fuente de verdad, no el path crítico en cada request HTTP.

**Vector 2: OAuth tokens de GitHub expiran / son revocados**
Si el usuario revoca el acceso a la OAuth App, el `access_token` guardado en Redis deja de funcionar. El tenant-site pierde acceso a su storage repo.
MITIGACIÓN: Implementar detección de error 401 de GitHub API → marcar el token como inválido en Redis → notificar al usuario en el dashboard del portal para que re-autentique.

**Vector 3: `client_token` comprometido**
Un `client_token` robado da acceso de lectura y escritura al repo del cliente.
MITIGACIÓN: El token debe ser revocable desde el dashboard del portal (DELETE en Redis). Implementar rotación de tokens. Scope mínimo: solo las rutas `/api/tenant/*` del portal — nunca exponer el `access_token` de GitHub al cliente.

**Vector 4: Genesis commit en repo no vacío**
Si el usuario conecta un repo con contenido existente, el genesis commit sobreescribe sus archivos.
MITIGACIÓN: Antes del genesis commit, verificar con `GET /repos/{owner}/{repo}/git/refs` que no hay commits. Si el repo no está vacío, mostrar advertencia y requerir confirmación explícita. Nunca ejecutar genesis automáticamente si hay contenido.

**Vector 5: Scope del OAuth insuficiente**
El scope `repo` incluye acceso a todos los repos privados del usuario. Es más de lo necesario.
MITIGACIÓN FASE 3: Usar scope `repo` para el MVP (simplicidad). En Phase 4, migrar a GitHub App con permisos por repo (el usuario elige exactamente qué repos puede gestionar la app) — esto reduce el blast radius si el access_token es comprometido.

---

## Phase 4 — Evolución del Tenant-Site (client-token nativo)

### Objetivo
Reemplazar `GITHUB_TOKEN` + `GITHUB_REPO` en el kernel del cliente por un único `AGNOSTIC_CLIENT_TOKEN`. El kernel ya no habla con GitHub directamente — habla con el portal central.

### Prerequisito
Phase 3 funcional con portal central desplegado.

### Paso 4.1 — Nueva estrategia `PortalStrategy`

Crear `src/server/strategies/PortalStrategy.ts`:

```typescript
import 'server-only';

export class PortalStrategy implements AgnosticBridge {
  private readonly baseUrl = process.env.AGNOSTIC_PORTAL_URL!;
  private readonly token = process.env.AGNOSTIC_CLIENT_TOKEN!;

  async read(namespace: string): Promise<DataItem[]> {
    const res = await fetch(`${this.baseUrl}/api/tenant/${namespace}`, {
      headers: { Authorization: `Bearer ${this.token}` },
      next: { revalidate: 300 }, // 5 min cache — sobrevive downtime del portal
    });
    if (!res.ok) return [];
    return res.json();
  }

  async write(namespace: string, record: DataItem): Promise<DataItem> {
    const res = await fetch(`${this.baseUrl}/api/tenant/${namespace}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    return res.json();
  }

  async remove(namespace: string, id: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/tenant/${namespace}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.token}` },
    });
  }
}
```

### Paso 4.2 — Registrar en `getStrategy.ts`

```typescript
if (process.env.AGNOSTIC_CLIENT_TOKEN) {
  return new PortalStrategy();
}
// Resto del fallback chain igual
```

### Paso 4.3 — Variables de entorno del tenant-site (Phase 4)

| Phase | Variables requeridas |
|-------|---------------------|
| Phase 1-2 | `GITHUB_TOKEN` + `GITHUB_REPO` + `GITHUB_BRANCH` |
| Phase 4 | Solo `AGNOSTIC_CLIENT_TOKEN` + `AGNOSTIC_PORTAL_URL` |

Phase 4 elimina 2 variables de entorno y toda exposición de tokens de GitHub en el tenant-site.

### Paso 4.4 — Confirmar eliminación del designer del kernel

Con `NEXT_PUBLIC_ENABLE_DESIGNER` ausente en el tenant-site, el `SovereigntyOrchestrator` retorna null. Verificar que no quede ninguna referencia al designer en el bundle del cliente.

### Vectores de entropía — Phase 4

**Vector 1: Latencia adicional**
Cada request de datos ahora pasa por el portal antes de llegar a GitHub (2 saltos de red en lugar de 1).
MITIGACIÓN: El `next: { revalidate: 300 }` en `PortalStrategy.read()` cachea los datos en el CDN de Vercel del tenant-site. La mayoría de requests se sirven desde el edge sin tocar el portal.

**Vector 2: Doble punto de fallo para escrituras**
Una escritura del usuario en el tenant-site requiere que el portal esté up. No hay fallback de escritura.
MITIGACIÓN ACEPTABLE: Las escrituras (formularios de usuario) pueden fallar gracefully con un toast de error. Las lecturas (carga de página) están protegidas por el cache.

---

## Referencia de archivos — qué tocar por phase

### Phase 1 (mínimo código)
| Acción | Destino |
|--------|---------|
| Crear `storage/` template | Nuevo repo GitHub |
| Setear env vars | Vercel Dashboard |
| Agregar `storage/` a `.gitignore` | `.gitignore` en kernel repo |
| Agregar `import 'server-only'` | `src/server/getStrategy.ts` y `src/server/activeProject.ts` |

### Phase 2 (cambios en kernel)
| Archivo | Cambio |
|---------|--------|
| `src/middleware.ts` | CREAR — extrae subdominio y setea `x-tenant` header |
| `src/server/activeProject.ts` | AGREGAR función `readPassportForTenant()` |
| `src/server/getStrategy.ts` | MODIFICAR — acepta `tenantKey?: string` |
| `src/server/strategies/GitHubStrategy.ts` | MODIFICAR — acepta `customToken?: string` en constructor |
| `src/app/api/vault/route.ts` | MODIFICAR — lee `x-tenant` y pasa a `getStrategy()` |
| `src/app/api/modules/[name]/route.ts` | MODIFICAR — ídem |
| `src/app/api/upload/route.ts` | MODIFICAR — ídem |

### Phase 3 (repo nuevo — portal central)
| Archivo | Cambio |
|---------|--------|
| `portal/src/app/api/auth/callback/route.ts` | CREAR — GitHub OAuth callback |
| `portal/src/app/api/repos/connect/route.ts` | CREAR — conexión de repo + genesis commit + token generation |
| `portal/src/app/api/tenant/[...path]/route.ts` | CREAR — proxy autenticado al storage del tenant |
| `portal/src/app/dashboard/page.tsx` | CREAR — UI de gestión de repos y tokens |
| `portal/src/lib/redis.ts` | CREAR — cliente Upstash |

### Phase 4 (cambios en kernel)
| Archivo | Cambio |
|---------|--------|
| `src/server/strategies/PortalStrategy.ts` | CREAR — estrategia que habla con el portal |
| `src/server/getStrategy.ts` | MODIFICAR — añadir rama `AGNOSTIC_CLIENT_TOKEN` |
| `src/components/agnostic/engine/SovereigntyOrchestrator.tsx` | MODIFICAR — guard `NEXT_PUBLIC_ENABLE_DESIGNER` |

---

## Contrato del storage repo (invariante en todas las phases)

```
db/
  schema_definitions.json   ← array de DataItem con schemas agnosticos
  page_routes.json           ← array de DataItem con rutas y bloques
  {contexto_de_negocio}.json ← arrays de DataItem por cada schema registrado
```

**Regla de oro:** el nombre de cada archivo en `db/` debe ser idéntico al campo `context` de los DataItems que contiene, que es idéntico al campo `name` del schema correspondiente. Violarlo resulta en renders vacíos silenciosos.

**Formato canónico de cualquier archivo en `db/`:**
```json
[
  {
    "id": "uuid-v4-generado-con-crypto.randomUUID()",
    "context": "nombre_del_namespace",
    "data": { "...campos del schema..." },
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
]
```

**Nunca:** arrays de objetos planos sin la envoltura `{ id, context, data }`. El engine no los parsea.

---

## Estado actual — blockers antes de Phase 1

```
⚠️  Blocker 1: storage/ no está en .gitignore — DATOS DE CLIENTE EN RIESGO
⚠️  Blocker 2: server-only no instalado — GITHUB_TOKEN puede filtrarse al browser

✓   GitHubStrategy.ts — completo
✓   getStrategy.ts — completo (solo falta server-only)
✓   activeProject.ts — GITHUB_REPO env var ya tiene prioridad
✓   indra.ts / SystemPassport — github_repo? y github_branch? presentes
✗   src/app/api/workflow/route.ts — eliminado en v2-sovereign-rebirth, omitir de Phase 2
```

**Instrucciones para Gemini — Phase 1 (en este orden):**
1. Agregar `storage/` al `.gitignore` del kernel
2. Ejecutar `npm install server-only`
3. Agregar `import 'server-only';` como primera línea en `src/server/getStrategy.ts` y `src/server/activeProject.ts`
4. Crear el repo de storage en GitHub con la estructura de `db/` documentada
5. Setear `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH` en Vercel
6. Smoke test: `GET /api/vault?namespace=schema_definitions` → `[]`

Los 3 fixes de código (pasos 1, 2, 3) son el único código que Gemini toca en Phase 1. El resto es configuración pura.
