import { fileURLToPath } from 'url';
import { collectEnvPresence, ENV_EXAMPLE_GROUPS, resolveBaseUrl, resolveStorageStrategyName, type StorageStrategy } from '../src/lib/agnostic/env-contract';
import { resolveDefinitionMode, type DefinitionMode } from '../src/lib/agnostic/definition-mode';
import { loadLocalEnvFiles } from './load-local-env';

type EnvRowStatus = 'configurada' | 'ausente' | 'legado' | 'ignorada';
type EnvRow = {
  key: string;
  status: EnvRowStatus;
  note?: string;
};

type EnvIssue = {
  level: 'info' | 'warn' | 'error';
  message: string;
};

type EnvGroupReport = {
  title: string;
  rows: EnvRow[];
};

type EnvCheckReport = {
  strategy: StorageStrategy | null;
  strategyError: string | null;
  definitionMode: DefinitionMode | null;
  definitionModeError: string | null;
  baseUrl: string | undefined;
  loadedFiles: string[];
  groups: EnvGroupReport[];
  issues: EnvIssue[];
  summary: {
    configured: number;
    missing: number;
    legacy: number;
    ignored: number;
    warnings: number;
    errors: number;
  };
};

function providerEmailIssues(env: NodeJS.ProcessEnv): EnvIssue[] {
  const pairs = [
    { name: 'Vercel', credentials: ['VERCEL_ACCESS_TOKEN', 'VERCEL_PROJECT_ID'], email: 'VERCEL_ACCOUNT_EMAIL' },
    { name: 'Netlify', credentials: ['NETLIFY_AUTH_TOKEN', 'NETLIFY_SITE_ID'], email: 'NETLIFY_ACCOUNT_EMAIL' },
    { name: 'GitHub', credentials: ['GITHUB_TOKEN', 'GITHUB_REPO'], email: 'GITHUB_ACCOUNT_EMAIL' },
    { name: 'Postgres', credentials: ['DATABASE_URL'], email: 'DATABASE_ACCOUNT_EMAIL' },
    { name: 'Cloudflare R2', credentials: ['CF_ACCOUNT_ID', 'CF_R2_BUCKET', 'CF_R2_ACCESS_KEY_ID', 'CF_R2_SECRET_ACCESS_KEY'], email: 'CF_ACCOUNT_EMAIL' },
    { name: 'Supabase', credentials: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'], email: 'SUPABASE_ACCOUNT_EMAIL' },
  ] as const;

  const issues: EnvIssue[] = [];

  for (const pair of pairs) {
    const hasCredential = pair.credentials.every(key => !!env[key]);
    if (hasCredential && !env[pair.email]) {
      issues.push({
        level: 'warn',
        message: `${pair.email} ausente; registra el correo propietario de la credencial de ${pair.name}.`,
      });
    }
  }

  return issues;
}

function buildEnvCheckReport(): EnvCheckReport {
  const loadedFiles = loadLocalEnvFiles();
  const env = process.env;
  const presence = collectEnvPresence(env);
  const baseUrl = resolveBaseUrl(env);

  let strategy: StorageStrategy | null = null;
  let strategyError: string | null = null;
  let definitionMode: DefinitionMode | null = null;
  let definitionModeError: string | null = null;
  try {
    strategy = resolveStorageStrategyName(env);
  } catch (err) {
    strategyError = err instanceof Error ? err.message : String(err);
  }
  try {
    definitionMode = resolveDefinitionMode(env);
  } catch (err) {
    definitionModeError = err instanceof Error ? err.message : String(err);
  }

  const isProduction = env.NODE_ENV === 'production';
  const groups: EnvGroupReport[] = ENV_EXAMPLE_GROUPS.map(group => ({
    title: group.title,
    rows: group.lines
      .filter(line => line.key)
      .map(line => {
        const key = line.key!;
        const isPresent = !!presence[key];

        if (key === 'PRODUCTION_URL') {
          if (isPresent) {
            return { key, status: 'legado', note: 'alias legado para scripts CLI' };
          }
          return { key, status: isPresent ? 'configurada' : 'ausente' };
        }

        if (key === 'DATABASE_URL' && strategy === 'local' && isPresent) {
          return { key, status: 'ignorada', note: 'la estrategia local la ignora' };
        }

        return { key, status: isPresent ? 'configurada' : 'ausente' };
      }),
  }));

  const issues: EnvIssue[] = [];
  if (strategyError) {
    issues.push({ level: 'error', message: strategyError });
  } else if (!env.AGNOSTIC_STORAGE_STRATEGY) {
    issues.push({
      level: isProduction ? 'error' : 'warn',
      message: 'AGNOSTIC_STORAGE_STRATEGY no está configurada; el motor sigue por inferencia de variables.',
    });
  }
  if (definitionModeError) {
    issues.push({ level: 'error', message: definitionModeError });
  } else if (!env.AGNOSTIC_DEFINITION_MODE) {
    issues.push({
      level: isProduction ? 'warn' : 'info',
      message: 'AGNOSTIC_DEFINITION_MODE no está configurada; se conserva legacy por compatibilidad.',
    });
  }
  if (definitionMode === 'revision' && !env.AGNOSTIC_DEFINITION_SNAPSHOT) {
    issues.push({
      level: isProduction ? 'error' : 'warn',
      message: 'El build en modo revision requiere AGNOSTIC_DEFINITION_SNAPSHOT.',
    });
  }
  if (definitionMode === 'revision' && isProduction && !env.AGNOSTIC_DEFINITION_REVISION) {
    issues.push({
      level: 'error',
      message: 'Producción en modo revision requiere AGNOSTIC_DEFINITION_REVISION.',
    });
  }

  const configuredDataStrategies = [
    env.GITHUB_REPO ? 'github' : null,
    env.DATABASE_URL ? 'postgres' : null,
    env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY ? 'supabase' : null,
  ].filter((strategy): strategy is string => !!strategy);

  if (!env.AGNOSTIC_STORAGE_STRATEGY && configuredDataStrategies.length > 1) {
    issues.push({
      level: 'warn',
      message: `Hay varias estrategias de datos configuradas (${configuredDataStrategies.join(', ')}); define AGNOSTIC_STORAGE_STRATEGY para evitar inferencia ambigua.`,
    });
  }

  if (strategy === 'local' && isProduction) {
    issues.push({ level: 'error', message: 'Producción no puede usar LocalStrategy. Define AGNOSTIC_STORAGE_STRATEGY=postgres o un adapter soportado.' });
  }

  if (strategy === 'postgres' && !env.DATABASE_URL) {
    issues.push({ level: 'error', message: 'AGNOSTIC_STORAGE_STRATEGY=postgres requiere DATABASE_URL.' });
  }

  if (strategy === 'github' && (!env.GITHUB_REPO || !env.GITHUB_TOKEN)) {
    issues.push({ level: 'error', message: 'AGNOSTIC_STORAGE_STRATEGY=github requiere GITHUB_REPO y GITHUB_TOKEN.' });
  }

  if (strategy === 'supabase' && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)) {
    issues.push({ level: 'error', message: 'AGNOSTIC_STORAGE_STRATEGY=supabase requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.' });
  }

  if (isProduction && !baseUrl) {
    issues.push({ level: 'error', message: 'NEXT_PUBLIC_BASE_URL es obligatoria en producción (PRODUCTION_URL queda solo como alias legado).' });
  } else if (!env.NEXT_PUBLIC_BASE_URL && env.PRODUCTION_URL) {
    issues.push({ level: 'warn', message: 'PRODUCTION_URL está en uso; migra a NEXT_PUBLIC_BASE_URL para cerrar el contrato.' });
  }

  if (isProduction && !env.SESSION_SECRET) {
    issues.push({ level: 'error', message: 'SESSION_SECRET es obligatoria en producción.' });
  }

  if (isProduction && !env.API_SECRET_KEY) {
    issues.push({ level: 'error', message: 'API_SECRET_KEY es obligatoria en producción.' });
  }

  const r2CoreKeys = ['CF_ACCOUNT_ID', 'CF_R2_BUCKET', 'CF_R2_ACCESS_KEY_ID', 'CF_R2_SECRET_ACCESS_KEY'] as const;
  const missingR2Core = r2CoreKeys.filter(key => !env[key]);
  if (missingR2Core.length > 0) {
    issues.push({
      level: isProduction ? 'error' : 'warn',
      message: `Cloudflare R2 incompleto: faltan ${missingR2Core.join(', ')}.`,
    });
  }

  if (isProduction && !env.CF_R2_PUBLIC_URL) {
    issues.push({ level: 'warn', message: 'CF_R2_PUBLIC_URL falta en producción; las URLs públicas de archivos quedarán incompletas.' });
  }

  issues.push(...providerEmailIssues(env));

  const summary = groups.reduce((acc, group) => {
    for (const row of group.rows) {
      if (row.status === 'configurada') acc.configured += 1;
      if (row.status === 'ausente') acc.missing += 1;
      if (row.status === 'legado') acc.legacy += 1;
      if (row.status === 'ignorada') acc.ignored += 1;
    }
    return acc;
  }, {
    configured: 0,
    missing: 0,
    legacy: 0,
    ignored: 0,
    warnings: issues.filter(issue => issue.level === 'warn').length,
    errors: issues.filter(issue => issue.level === 'error').length,
  });

  return {
    strategy,
    strategyError,
    definitionMode,
    definitionModeError,
    baseUrl,
    loadedFiles,
    groups,
    issues,
    summary,
  };
}

function printHumanReport(report: EnvCheckReport): void {
  console.log('env:check');
  console.log(`Strategy: ${report.strategyError ? 'inválida' : report.strategy ?? 'local'}`);
  console.log(`Definitions: ${report.definitionModeError ? 'inválido' : report.definitionMode ?? 'legacy'}`);
  console.log(`Base URL: ${report.baseUrl ?? 'ausente'}`);
  console.log(`Archivos cargados: ${report.loadedFiles.length ? report.loadedFiles.join(', ') : 'ninguno'}`);
  console.log(
    `Resumen: configured=${report.summary.configured} missing=${report.summary.missing} legacy=${report.summary.legacy} ignored=${report.summary.ignored} warnings=${report.summary.warnings} errors=${report.summary.errors}`
  );

  for (const group of report.groups) {
    console.log('');
    console.log(group.title);
    for (const row of group.rows) {
      const suffix = row.note ? ` — ${row.note}` : '';
      console.log(`- ${row.key}: ${row.status}${suffix}`);
    }
  }

  console.log('');
  console.log('Validaciones');
  if (report.issues.length === 0) {
    console.log('- sin incidencias');
  } else {
    for (const issue of report.issues) {
      console.log(`- [${issue.level}] ${issue.message}`);
    }
  }
}

export function printEnvCheck(options: { json?: boolean } = {}): void {
  const report = buildEnvCheckReport();
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report);
  }
  process.exitCode = report.summary.errors > 0 ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  printEnvCheck({ json: process.argv.includes('--json') });
}
