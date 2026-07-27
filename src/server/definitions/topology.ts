import type {
  AgnosticBridge,
  DefinitionPublisher,
  DefinitionReader,
  DefinitionRevisionStore,
  RecordStore,
} from '@agnostic/core';
import type { DefinitionMode } from '@/lib/agnostic/definition-mode';
import { resolveDefinitionMode } from '@/lib/agnostic/definition-mode';
import { getProjectStorageRoot } from '@/server/activeProject';
import { getStrategy, getStrategyName } from '@/server/getStrategy';
import { LegacyDefinitionPublisher, LegacyDefinitionReader } from './legacy';
import { NamespaceRoutingBridge } from './NamespaceRoutingBridge';
import { PersistentDefinitionPublisher, PersistentDefinitionReader } from './persistent';
import { PinnedDefinitionPublisher, PinnedDefinitionReader } from './PinnedDefinitionAccess';
import { RevisionDefinitionBridge } from './RevisionDefinitionBridge';
import { ShadowDefinitionReader, type ShadowDefinitionReport } from './ShadowDefinitionReader';
import { LocalDefinitionRevisionStore } from './stores/LocalDefinitionRevisionStore';
import { PostgresDefinitionRevisionStore } from './stores/PostgresDefinitionRevisionStore';
import { GitHubDefinitionRevisionStore } from './stores/GitHubDefinitionRevisionStore';
import { SupabaseDefinitionRevisionStore } from './stores/SupabaseDefinitionRevisionStore';

export interface PersistenceTopology {
  mode: DefinitionMode;
  recordStore: RecordStore;
  definitionReader: DefinitionReader;
  definitionPublisher: DefinitionPublisher;
  revisionStore: DefinitionRevisionStore | null;
  compatibilityBridge: RecordStore;
}

export interface PersistenceTopologyOptions {
  env?: Readonly<Record<string, string | undefined>>;
  reportShadow?: (report: ShadowDefinitionReport) => void | Promise<void>;
  recordStore?: AgnosticBridge;
  revisionStore?: DefinitionRevisionStore;
}

export function createDefinitionRevisionStore(
  strategyName: ReturnType<typeof getStrategyName>,
  env: Readonly<Record<string, string | undefined>>,
): DefinitionRevisionStore {
  if (strategyName === 'local') {
    return new LocalDefinitionRevisionStore(getProjectStorageRoot());
  }

  if (strategyName === 'postgres') {
    const databaseUrl = env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('Definition revision mode with postgres requires DATABASE_URL.');
    }
    return new PostgresDefinitionRevisionStore(databaseUrl);
  }

  if (strategyName === 'github') {
    const repoPath = env.GITHUB_REPO;
    const token = env.GITHUB_TOKEN;
    if (!repoPath || !token) {
      throw new Error(
        'Definition revision mode with github requires GITHUB_REPO and GITHUB_TOKEN.',
      );
    }
    const [owner, repo] = repoPath.split('/');
    if (!owner || !repo) {
      throw new Error('GITHUB_REPO must use the "owner/repo" format.');
    }
    return new GitHubDefinitionRevisionStore({
      owner,
      repo,
      token,
      branch: env.GITHUB_BRANCH ?? 'main',
    });
  }

  const supabaseUrl = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'Definition revision mode with supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }
  return new SupabaseDefinitionRevisionStore(supabaseUrl, serviceKey);
}

function defaultShadowReporter(report: ShadowDefinitionReport): void {
  if (report.status === 'compared' && report.match) return;
  console.warn('[DefinitionShadow]', JSON.stringify(report));
}

export function createPersistenceTopology(
  options: PersistenceTopologyOptions = {},
): PersistenceTopology {
  const env = options.env ?? process.env;
  const mode = resolveDefinitionMode(env);
  const recordStore = options.recordStore ?? getStrategy();
  const legacyReader = new LegacyDefinitionReader(recordStore);
  const legacyPublisher = new LegacyDefinitionPublisher(recordStore);

  if (mode === 'legacy') {
    return {
      mode,
      recordStore,
      definitionReader: legacyReader,
      definitionPublisher: legacyPublisher,
      revisionStore: null,
      compatibilityBridge: recordStore,
    };
  }

  const revisionStore = options.revisionStore
    ?? createDefinitionRevisionStore(getStrategyName(), env);
  const persistentReader = new PersistentDefinitionReader(revisionStore);
  const persistentPublisher = new PersistentDefinitionPublisher(revisionStore);

  if (mode === 'shadow') {
    return {
      mode,
      recordStore,
      definitionReader: new ShadowDefinitionReader(
        legacyReader,
        persistentReader,
        options.reportShadow ?? defaultShadowReporter,
      ),
      definitionPublisher: legacyPublisher,
      revisionStore,
      compatibilityBridge: recordStore,
    };
  }

  const pinnedRevision = env.AGNOSTIC_DEFINITION_REVISION?.trim();
  if (env.NODE_ENV === 'production' && !pinnedRevision) {
    throw new Error(
      'Production revision mode requires AGNOSTIC_DEFINITION_REVISION.',
    );
  }
  const definitionReader = pinnedRevision
    ? new PinnedDefinitionReader(persistentReader, pinnedRevision)
    : persistentReader;
  const definitionPublisher = pinnedRevision
    ? new PinnedDefinitionPublisher(definitionReader, pinnedRevision)
    : persistentPublisher;

  const compatibilityBridge = new NamespaceRoutingBridge(
    new RevisionDefinitionBridge(definitionReader, definitionPublisher),
    recordStore,
  );

  return {
    mode,
    recordStore,
    definitionReader,
    definitionPublisher,
    revisionStore,
    compatibilityBridge,
  };
}

export function getDefinitionAwareBridge(): RecordStore {
  return createPersistenceTopology().compatibilityBridge;
}
