import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const sql = Object.assign(
    vi.fn(),
    { unsafe: vi.fn() },
  );
  return {
    postgres: vi.fn(() => sql),
    sql,
  };
});

vi.mock('postgres', () => ({
  default: mocks.postgres,
}));

import { PostgresStrategy } from '../PostgresStrategy';

describe('PostgresStrategy strict reads', () => {
  beforeEach(() => {
    mocks.sql.mockReset();
    mocks.sql.unsafe.mockReset();
    mocks.sql.unsafe.mockRejectedValue(new Error('database unavailable'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('keeps legacy reads empty while strict reads propagate database failures', async () => {
    const strategy = new PostgresStrategy('postgres://test.invalid/database');

    await expect(strategy.read('page_routes')).resolves.toEqual([]);
    await expect(strategy.readStrict('page_routes')).rejects.toThrow(
      'database unavailable',
    );
  });
});
