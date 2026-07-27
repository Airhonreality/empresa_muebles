import { beforeEach, describe, expect, it, vi } from 'vitest';

const pass = { status: 'pass' as const, message: 'ok' };

vi.mock('@/server/health/checkers', () => ({
  checkGitHub: vi.fn(async () => pass),
  checkSupabase: vi.fn(async () => pass),
  checkPostgres: vi.fn(async () => pass),
  checkLocal: vi.fn(async () => pass),
  checkR2: vi.fn(async () => pass),
  checkSession: vi.fn(async () => pass),
  checkCloudDeployer: vi.fn(async () => pass),
}));

vi.mock('@/server/activeProject', () => ({
  getProjectStorageRoot: vi.fn(() => 'storage'),
}));

vi.mock('@/server/definitions/topology', () => ({
  createPersistenceTopology: vi.fn(() => ({ revisionStore: undefined })),
}));

vi.mock('@/lib/agnostic/definition-mode', () => ({
  resolveDefinitionMode: vi.fn(() => 'legacy'),
}));

vi.mock('@/lib/agnostic/env-contract', () => ({
  collectEnvPresence: vi.fn(() => ({})),
  resolveStorageStrategyName: vi.fn(),
}));

import { resolveStorageStrategyName } from '@/lib/agnostic/env-contract';
import { GET } from './route';

describe('admin health response', () => {
  beforeEach(() => {
    vi.mocked(resolveStorageStrategyName).mockReset();
  });

  it('returns structured degraded health when the data strategy is invalid', async () => {
    vi.mocked(resolveStorageStrategyName).mockImplementation(() => {
      throw new Error('Unsupported AGNOSTIC_STORAGE_STRATEGY');
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      status: 'fail',
      activeDataStrategy: 'invalid',
      storageStrategyError: 'Unsupported AGNOSTIC_STORAGE_STRATEGY',
      definitionMode: 'legacy',
    });
  });
});
