import { describe, expect, it, vi } from 'vitest';
import { handleVaultHydrationError } from './vault-error-policy';

describe('vault hydration failure policy', () => {
  it('fails closed in revision mode', () => {
    const failure = new Error('definition store unavailable');
    expect(() => handleVaultHydrationError(failure, 'revision')).toThrow(failure);
  });

  it('preserves the legacy integrity response outside revision mode', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(handleVaultHydrationError(new Error('legacy read failed'), 'legacy'))
      .toMatchObject({ _integrity: { isValid: false } });
    consoleError.mockRestore();
  });
});
