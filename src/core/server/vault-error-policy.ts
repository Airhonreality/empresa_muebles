import { resolveDefinitionMode, type DefinitionMode } from '@/lib/agnostic/definition-mode';

export function handleVaultHydrationError(
  error: unknown,
  mode: DefinitionMode = resolveDefinitionMode(),
): Record<string, any> {
  if (mode === 'revision') throw error;
  console.error('[VaultHydration] Selective server-side hydration failure:', error);
  return {
    _integrity: {
      isValid: false,
      issues: [{ level: 'ERROR', context: 'SYSTEM', message: 'Critical server hydration failed.' }],
    },
  };
}
