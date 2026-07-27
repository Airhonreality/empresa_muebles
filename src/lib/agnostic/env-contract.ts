export type StorageStrategy = 'local' | 'github' | 'postgres' | 'supabase';

type EnvExampleLine = {
  key?: string;
  value?: string;
  comment?: string;
};

type EnvExampleGroup = {
  title: string;
  notes?: string[];
  lines: EnvExampleLine[];
};

export const ENV_EXAMPLE_GROUPS: EnvExampleGroup[] = [
  {
    title: 'Datos',
    notes: [
      'La estrategia explícita evita inferencias accidentales.',
      'local ignora DATABASE_URL; postgres la requiere.',
      'El ciclo de definiciones se declara por separado: legacy, shadow o revision.',
    ],
    lines: [
      { key: 'AGNOSTIC_STORAGE_STRATEGY', value: 'local', comment: 'local | github | postgres | supabase' },
      { key: 'AGNOSTIC_DEFINITION_MODE', value: 'legacy', comment: 'legacy | shadow | revision' },
      { key: 'AGNOSTIC_DEFINITION_SNAPSHOT', comment: 'Snapshot exportado requerido por el build en modo revision' },
      { key: 'AGNOSTIC_DEFINITION_REVISION', comment: 'Revision inmutable esperada por build y runtime' },
      { key: 'DATABASE_URL' },
      { key: 'GITHUB_TOKEN' },
      { key: 'GITHUB_REPO', value: 'usuario/repositorio' },
      { key: 'GITHUB_BRANCH', value: 'main' },
      { key: 'SUPABASE_URL' },
      { key: 'SUPABASE_SERVICE_ROLE_KEY' },
    ],
  },
  {
    title: 'Archivos',
    notes: ['Cloudflare R2 guarda assets, imágenes y adjuntos.'],
    lines: [
      { key: 'CF_ACCOUNT_ID' },
      { key: 'CF_R2_BUCKET' },
      { key: 'CF_R2_ACCESS_KEY_ID' },
      { key: 'CF_R2_SECRET_ACCESS_KEY' },
      { key: 'CF_R2_PUBLIC_URL' },
    ],
  },
  {
    title: 'Aplicación',
    notes: ['Secreto de sesión, llave de CLI y URL pública del frontend.'],
    lines: [
      { key: 'SESSION_SECRET' },
      { key: 'API_SECRET_KEY' },
      { key: 'NEXT_PUBLIC_BASE_URL' },
    ],
  },
  {
    title: 'Despliegue',
    notes: [
      'Vercel y Netlify son los proveedores soportados por el seed.',
      'PRODUCTION_URL se conserva como alias legado para scripts CLI.',
    ],
    lines: [
      { key: 'VERCEL_ACCESS_TOKEN' },
      { key: 'VERCEL_PROJECT_ID' },
      { key: 'VERCEL_TEAM_ID' },
      { key: 'NETLIFY_AUTH_TOKEN' },
      { key: 'NETLIFY_SITE_ID' },
      { key: 'PRODUCTION_URL' },
    ],
  },
  {
    title: 'Metadatos de proveedor',
    notes: [
      'El CLI y la UI intentan inferir este correo desde la API del proveedor cuando hay permisos.',
      'Si la API no lo expone, el dato debe quedar registrado manualmente.',
    ],
    lines: [
      { key: 'VERCEL_ACCOUNT_EMAIL' },
      { key: 'NETLIFY_ACCOUNT_EMAIL' },
      { key: 'GITHUB_ACCOUNT_EMAIL' },
      { key: 'DATABASE_ACCOUNT_EMAIL' },
      { key: 'CF_ACCOUNT_EMAIL' },
      { key: 'SUPABASE_ACCOUNT_EMAIL' },
    ],
  },
];

export const ENV_TRACKED_KEYS = ENV_EXAMPLE_GROUPS.flatMap(group =>
  group.lines.map(line => line.key).filter((key): key is string => !!key)
);

export function renderEnvExample(): string {
  const lines: string[] = [];

  for (const group of ENV_EXAMPLE_GROUPS) {
    lines.push(`# ── ${group.title.toUpperCase()} ─────────────────────────────────────────────────────────`);
    for (const note of group.notes ?? []) {
      lines.push(`# ${note}`);
    }
    for (const line of group.lines) {
      if (line.comment) lines.push(`# ${line.comment}`);
      if (line.key) lines.push(`${line.key}=${line.value ?? ''}`);
    }
    lines.push('');
  }

  lines.push('# ── ADAPTERS OPCIONALES ─────────────────────────────────────────────────');
  lines.push('# Cada adapter instalado puede aportar su propio fragmento de variables y ejemplos.');

  return `${lines.join('\n')}\n`;
}

export function resolveStorageStrategyName(env: NodeJS.ProcessEnv = process.env): StorageStrategy {
  const explicit = env.AGNOSTIC_STORAGE_STRATEGY?.trim().toLowerCase();

  if (explicit) {
    if (explicit === 'local' || explicit === 'github' || explicit === 'postgres' || explicit === 'supabase') {
      return explicit;
    }
    throw new Error(
      `AGNOSTIC_STORAGE_STRATEGY invalida: "${env.AGNOSTIC_STORAGE_STRATEGY}". ` +
      'Valores válidos: local, github, postgres, supabase.'
    );
  }

  if (env.GITHUB_REPO) return 'github';
  if (env.DATABASE_URL) return 'postgres';
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) return 'supabase';
  return 'local';
}

export function resolveBaseUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const baseUrl = env.NEXT_PUBLIC_BASE_URL?.trim() || env.PRODUCTION_URL?.trim();
  if (!baseUrl) return undefined;
  return baseUrl.replace(/\/+$/, '');
}

export function collectEnvPresence(env: NodeJS.ProcessEnv = process.env): Record<string, boolean> {
  return Object.fromEntries(
    ENV_TRACKED_KEYS.map(key => [key, !!env[key]])
  ) as Record<string, boolean>;
}
