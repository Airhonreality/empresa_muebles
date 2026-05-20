# Phase 3 — Portal Central: Brief de Ejecución

**Para:** Gemini (o cualquier agente implementador)
**Prerequisitos satisfechos:** Phase 1 ✓ Phase 2 ✓
**Rama activa:** `v2-sovereign-rebirth`
**Fecha:** 2026-05-20

---

## Estado confirmado del sistema antes de empezar

```
✓  storage/ en .gitignore del kernel
✓  import 'server-only' en getStrategy.ts y activeProject.ts
✓  src/middleware.ts — extrae x-tenant del subdominio
✓  readPassportForTenant() en activeProject.ts
✓  GitHubStrategy constructor acepta customToken y customBranch
✓  /api/vault, /api/engine leen x-tenant y llaman getStrategy(tenantKey)
✗  NEXT_PUBLIC_ENABLE_DESIGNER gate en SovereigntyOrchestrator.tsx — FALTA (Phase 3 lo añade)
```

**No modificar ninguno de los archivos marcados ✓.** Solo crear el portal (repo separado) y añadir el gate al kernel.

---

## Qué es Phase 3

Dos entregables independientes:

| Entregable | Repo | Cambio |
|------------|------|--------|
| Portal central | Repo nuevo: `agnostic-portal` | ~9 archivos nuevos |
| Kernel gate | Repo existente: `Agnostic_System_Seed` | 1 línea en `SovereigntyOrchestrator.tsx` |

El portal es un Next.js 15 independiente. NO es una carpeta dentro del kernel. Tiene su propia URL (`studio.agnosticui.com`), su propio Vercel deployment, y sus propias variables de entorno.

---

## Cambio en el kernel (1 archivo, 1 línea)

### Archivo: `src/components/agnostic/engine/SovereigntyOrchestrator.tsx`

Localizar la función `SovereigntyOrchestrator` (línea 38) y añadir la guardia como **primera línea del cuerpo**:

```typescript
export function SovereigntyOrchestrator() {
  // Gate: designer is only visible when NEXT_PUBLIC_ENABLE_DESIGNER is set
  if (!process.env.NEXT_PUBLIC_ENABLE_DESIGNER) return null;

  const { isEditMode, setEditMode, currentPath } = useSystemStore();
  // ... resto sin cambios
```

Esto hace que en los sitios desplegados de clientes (que no tendrán esta env var), el orchestrator sea un noop. Solo el portal central, que la setea a `'true'`, lo activa.

Commitear en `v2-sovereign-rebirth` y hacer push al kernel repo.

---

## Portal central — estructura del proyecto

```
agnostic-portal/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts       ← inicia OAuth con GitHub
│   │   │   │   └── callback/route.ts    ← intercambia code por token, guarda sesión
│   │   │   ├── repos/
│   │   │   │   ├── list/route.ts        ← lista repos del usuario autenticado
│   │   │   │   └── connect/route.ts     ← genesis commit + genera AGNOSTIC_CLIENT_TOKEN
│   │   │   └── tenant/
│   │   │       └── [namespace]/route.ts ← proxy autenticado a GitHub storage
│   │   ├── dashboard/
│   │   │   └── page.tsx                 ← lista repos conectados y sus tokens
│   │   ├── login/
│   │   │   └── page.tsx                 ← botón "Login con GitHub"
│   │   └── layout.tsx
│   └── lib/
│       ├── redis.ts                     ← cliente Upstash singleton
│       └── session.ts                   ← config iron-session + tipos
├── .env.local                           ← variables locales (no commitear)
├── .gitignore
└── package.json
```

---

## Paso 0 — Bootstrap

```bash
npx create-next-app@latest agnostic-portal --typescript --tailwind --app --src-dir --no-eslint
cd agnostic-portal
npm install iron-session @upstash/redis
```

---

## Paso 1 — Registro de GitHub OAuth App (manual — usuario lo hace)

En `github.com/settings/developers → OAuth Apps → New OAuth App`:

| Campo | Valor |
|-------|-------|
| Application name | Agnostic Studio |
| Homepage URL | `https://studio.agnosticui.com` |
| Authorization callback URL | `https://studio.agnosticui.com/api/auth/callback` |

Guardar `Client ID` y `Client Secret`. Se usan como `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET`.

Para desarrollo local, registrar una segunda OAuth App con callback `http://localhost:3001/api/auth/callback`.

---

## Paso 2 — Variables de entorno del portal

### `.env.local` (nunca al repo):
```
GITHUB_CLIENT_ID=Ov23liXXXXXXXXXXXXXX
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SESSION_SECRET=una-cadena-aleatoria-de-al-menos-32-caracteres-aqui
UPSTASH_REDIS_REST_URL=https://xxxxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxxxxxxxxxxxxx
PORTAL_BASE_URL=http://localhost:3001
NEXT_PUBLIC_ENABLE_DESIGNER=true
```

### En Vercel (producción):
Mismas variables con valores de producción. `PORTAL_BASE_URL=https://studio.agnosticui.com`.

---

## Paso 3 — Archivos a crear (código exacto)

### `src/lib/session.ts`
```typescript
import type { SessionOptions } from 'iron-session';

export interface SessionData {
  github_user?: string;
  access_token?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'agnostic_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
};
```

### `src/lib/redis.ts`
```typescript
import { Redis } from '@upstash/redis';

export const redis = Redis.fromEnv();

export interface TokenRecord {
  github_repo: string;
  github_access_token: string;
}
```

### `src/app/api/auth/login/route.ts`
```typescript
import { NextResponse } from 'next/server';

export function GET(req: Request) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.PORTAL_BASE_URL}/api/auth/callback`,
    scope: 'repo',
  });
  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params}`
  );
}
```

### `src/app/api/auth/callback/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/session';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', req.url));
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const { access_token, error } = await tokenRes.json();
  if (error || !access_token) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', req.url));
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const githubUser = await userRes.json();

  // Next.js 15: cookies() is async
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.github_user = githubUser.login as string;
  session.access_token = access_token as string;
  await session.save();

  return NextResponse.redirect(new URL('/dashboard', req.url));
}
```

### `src/app/api/repos/list/route.ts`
```typescript
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sessionOptions, type SessionData } from '@/lib/session';

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.access_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const res = await fetch('https://api.github.com/user/repos?type=all&per_page=100&sort=updated', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  const repos = await res.json();
  return NextResponse.json(
    Array.isArray(repos)
      ? repos.map((r: any) => ({ full_name: r.full_name, private: r.private }))
      : { error: 'GitHub API error' }
  );
}
```

### `src/app/api/repos/connect/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redis, type TokenRecord } from '@/lib/redis';
import { sessionOptions, type SessionData } from '@/lib/session';

// Estructura canónica que el portal inyecta en repos vacíos
function genesisFiles(repo: string): Record<string, unknown> {
  const ts = new Date().toISOString();
  return {
    'db/schema_definitions.json': [],
    'db/page_routes.json': [],
    'db/system_config.json': [
      {
        id: crypto.randomUUID(),
        context: 'system_config',
        data: {
          project_identity: repo,
          storage_strategy: 'GitHubStrategy',
          dna_strategy: 'local',
        },
        updated_at: ts,
      },
    ],
    'manifest.json': { name: repo.split('/')[1], version: '1.0.0' },
  };
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.access_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { repo } = await req.json();
  if (!repo || !repo.includes('/')) {
    return NextResponse.json({ error: 'Invalid repo. Expected: owner/repo' }, { status: 400 });
  }

  const [owner, repoName] = (repo as string).split('/');
  const ghHeaders = {
    Authorization: `Bearer ${session.access_token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // Verify access
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers: ghHeaders });
  if (!repoRes.ok) {
    return NextResponse.json({ error: 'Repo not found or no access' }, { status: 403 });
  }

  // Guard: do not genesis a non-empty repo
  const refsRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs`, { headers: ghHeaders });
  const refs = refsRes.ok ? await refsRes.json() : [];
  if (Array.isArray(refs) && refs.length > 0) {
    return NextResponse.json(
      { error: 'Repo already has commits. Connect only empty repos.' },
      { status: 409 }
    );
  }

  // Genesis commit — sequential (each file needs the previous SHA to not conflict)
  const baseUrl = `https://api.github.com/repos/${owner}/${repoName}/contents`;
  for (const [filePath, content] of Object.entries(genesisFiles(repo))) {
    const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
    const putRes = await fetch(`${baseUrl}/${filePath}`, {
      method: 'PUT',
      headers: ghHeaders,
      body: JSON.stringify({
        message: `[agnostic] genesis: ${filePath}`,
        content: encoded,
        branch: 'main',
      }),
    });
    if (!putRes.ok) {
      const err = await putRes.json();
      return NextResponse.json({ error: `Genesis failed at ${filePath}: ${err.message}` }, { status: 500 });
    }
  }

  // Issue client token
  const clientToken = crypto.randomUUID();
  const record: TokenRecord = {
    github_repo: repo,
    github_access_token: session.access_token,
  };
  await redis.set(`client_token:${clientToken}`, record);

  return NextResponse.json({ success: true, client_token: clientToken });
}
```

### `src/app/api/tenant/[namespace]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { redis, type TokenRecord } from '@/lib/redis';

async function resolveToken(req: NextRequest): Promise<TokenRecord | null> {
  const bearer = req.headers.get('authorization');
  if (!bearer?.startsWith('Bearer ')) return null;
  const token = bearer.slice(7);
  return redis.get<TokenRecord>(`client_token:${token}`);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ namespace: string }> }
) {
  const tokenData = await resolveToken(req);
  if (!tokenData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { namespace } = await params;
  const [owner, repo] = tokenData.github_repo.split('/');
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/db/${namespace}.json`;

  const res = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${tokenData.github_access_token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    // Agnostic kernel caches this at the CDN layer — portal returns fresh data
    cache: 'no-store',
  });

  if (!res.ok) return NextResponse.json([], { status: 200 });

  const file = await res.json();
  const content = Buffer.from(file.content, 'base64').toString('utf-8');
  return NextResponse.json(JSON.parse(content));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ namespace: string }> }
) {
  const tokenData = await resolveToken(req);
  if (!tokenData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { namespace } = await params;
  const record = await req.json();
  const [owner, repo] = tokenData.github_repo.split('/');
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
  const apiUrl = `${baseUrl}/db/${namespace}.json`;
  const ghHeaders = {
    Authorization: `Bearer ${tokenData.github_access_token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // Read-modify-write cycle
  const existing = await fetch(`${apiUrl}?ref=main`, { headers: ghHeaders, cache: 'no-store' });
  let items: any[] = [];
  let sha: string | undefined;
  if (existing.ok) {
    const file = await existing.json();
    sha = file.sha;
    items = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
  }

  const id = record.id || crypto.randomUUID();
  const saved = { id, context: namespace, data: record.data, updated_at: new Date().toISOString() };
  const map = new Map(items.map((i: any) => [i.id, i]));
  map.set(id, saved);

  const encoded = Buffer.from(JSON.stringify(Array.from(map.values()), null, 2)).toString('base64');
  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: ghHeaders,
    body: JSON.stringify({
      message: `[agnostic] vault: ${namespace}`,
      content: encoded,
      sha,
      branch: 'main',
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.json();
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, record: saved });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ namespace: string }> }
) {
  const tokenData = await resolveToken(req);
  if (!tokenData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { namespace } = await params;
  const { id } = await req.json();
  const [owner, repo] = tokenData.github_repo.split('/');
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/db/${namespace}.json`;
  const ghHeaders = {
    Authorization: `Bearer ${tokenData.github_access_token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  const existing = await fetch(`${apiUrl}?ref=main`, { headers: ghHeaders, cache: 'no-store' });
  if (!existing.ok) return NextResponse.json({ success: true });
  const file = await existing.json();
  const items: any[] = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
  const filtered = items.filter((i: any) => i.id !== id);

  const encoded = Buffer.from(JSON.stringify(filtered, null, 2)).toString('base64');
  await fetch(apiUrl, {
    method: 'PUT',
    headers: ghHeaders,
    body: JSON.stringify({
      message: `[agnostic] vault: remove from ${namespace}`,
      content: encoded,
      sha: file.sha,
      branch: 'main',
    }),
  });

  return NextResponse.json({ success: true });
}
```

### `src/app/login/page.tsx`
```tsx
export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Agnostic Studio</h1>
        {searchParams.error && (
          <p className="text-red-500 text-sm">Error: {searchParams.error}</p>
        )}
        <a
          href="/api/auth/login"
          className="rounded bg-gray-900 px-6 py-2 text-white hover:bg-gray-700"
        >
          Login con GitHub
        </a>
      </div>
    </main>
  );
}
```

### `src/app/dashboard/page.tsx`
```tsx
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionOptions, type SessionData } from '@/lib/session';
import ConnectRepoPanel from './ConnectRepoPanel';

export default async function DashboardPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.github_user) redirect('/login');

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Agnostic Studio</h1>
        <span className="text-sm text-gray-500">@{session.github_user}</span>
      </div>
      <ConnectRepoPanel />
    </main>
  );
}
```

### `src/app/dashboard/ConnectRepoPanel.tsx`
```tsx
'use client';

import { useState } from 'react';

interface Repo {
  full_name: string;
  private: boolean;
}

export default function ConnectRepoPanel() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadRepos() {
    setLoading(true);
    const res = await fetch('/api/repos/list');
    const data = await res.json();
    setRepos(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function connect(repo: string) {
    setError(null);
    const res = await fetch('/api/repos/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setClientToken(data.client_token);
  }

  if (clientToken) {
    return (
      <div className="rounded border p-6 bg-green-50">
        <h2 className="font-semibold mb-2">Repositorio conectado</h2>
        <p className="text-sm mb-4">
          Añade esta variable en Vercel para activar tu sitio:
        </p>
        <code className="block bg-gray-900 text-green-400 p-3 rounded text-sm break-all">
          AGNOSTIC_CLIENT_TOKEN={clientToken}
        </code>
        <p className="text-xs text-gray-500 mt-2">
          Guarda este token. No se puede recuperar una vez cerrada esta ventana.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border p-6">
      <h2 className="font-semibold mb-4">Conectar repositorio de storage</h2>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {repos.length === 0 ? (
        <button
          onClick={loadRepos}
          disabled={loading}
          className="rounded bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Ver mis repositorios'}
        </button>
      ) : (
        <ul className="divide-y">
          {repos.map((r) => (
            <li key={r.full_name} className="flex justify-between items-center py-3">
              <span className="text-sm font-mono">{r.full_name}</span>
              <button
                onClick={() => connect(r.full_name)}
                className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
              >
                Conectar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## Paso 4 — Deploy del portal a Vercel

1. Crear nuevo proyecto en Vercel apuntando al repo `agnostic-portal`
2. Setear todas las variables de entorno de producción (ver Paso 2)
3. Añadir dominio custom: `studio.agnosticui.com`
4. Actualizar la Authorization callback URL en GitHub OAuth App a `https://studio.agnosticui.com/api/auth/callback`

---

## Paso 5 — Smoke test

```
1. Abrir https://studio.agnosticui.com/login
2. Click "Login con GitHub" → autorizar OAuth App → redirect a /dashboard
3. Click "Ver mis repositorios" → debe listar repos del usuario
4. Seleccionar un repo VACÍO → click "Conectar"
   → debe aparecer el AGNOSTIC_CLIENT_TOKEN
   → verificar en GitHub que el repo ahora tiene db/ con los 3 JSONs
5. En Vercel de un tenant-site: setear AGNOSTIC_CLIENT_TOKEN
   → GET /api/vault?namespace=schema_definitions → [] (a través de PortalStrategy — Phase 4)
```

> Nota: el paso 5.5 requiere Phase 4 (PortalStrategy en el kernel). En Phase 3, el tenant-site sigue usando GITHUB_TOKEN + GITHUB_REPO directamente. El AGNOSTIC_CLIENT_TOKEN solo estará operativo como mecanismo de acceso cuando Phase 4 implemente PortalStrategy.

---

## Vectores de entropía críticos

| Vector | Riesgo | Mitigación implementada |
|--------|--------|------------------------|
| Genesis en repo no vacío | Sobreescribe contenido existente | Guard en `connect/route.ts`: verifica `git/refs` antes de genesis |
| OAuth token revocado | Tenant pierde acceso a storage | Detectar 401 en proxy → marcar inválido en Redis (Phase 3.1) |
| `client_token` robado | Acceso de lectura/escritura al repo del cliente | Token revocable desde dashboard — `redis.del('client_token:xxx')` |
| `SESSION_SECRET` débil | Sesión forjeable | Mínimo 32 chars, generado con `openssl rand -hex 32` |
| Scope `repo` excesivo | Acceso a todos los repos privados del usuario | Aceptable en MVP. Phase 4: migrar a GitHub App con permisos por repo |

---

## Resumen de lo que Gemini NO debe hacer

- No mover el portal a una subcarpeta del kernel — son repos separados
- No guardar `github_access_token` en el cliente (solo en Redis server-side)
- No ejecutar genesis si el repo ya tiene commits — el guard existe, respetarlo
- No añadir el `SovereigntyOrchestrator` gate fuera de la función del componente (debe ser la primera línea del cuerpo, no fuera del componente)
- No usar `Math.random()` ni `Date.now()` para IDs — usar `crypto.randomUUID()`
- No exponer `GITHUB_CLIENT_SECRET` ni `SESSION_SECRET` como `NEXT_PUBLIC_*`
