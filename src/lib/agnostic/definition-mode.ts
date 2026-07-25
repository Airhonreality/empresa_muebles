export const DEFINITION_MODES = ['legacy', 'shadow', 'revision'] as const;

export type DefinitionMode = (typeof DEFINITION_MODES)[number];

/**
 * Resolves only the definition lifecycle mode.
 *
 * Source selection belongs to the storage topology and must not be inferred
 * here from provider credentials, deployment platform, or NODE_ENV.
 */
export function resolveDefinitionMode(
  env: Readonly<Record<string, string | undefined>> = process.env,
): DefinitionMode {
  const rawMode = env.AGNOSTIC_DEFINITION_MODE?.trim().toLowerCase();

  if (!rawMode) return 'legacy';

  if (
    rawMode === 'legacy'
    || rawMode === 'shadow'
    || rawMode === 'revision'
  ) {
    return rawMode;
  }

  throw new Error(
    `AGNOSTIC_DEFINITION_MODE invalido: "${env.AGNOSTIC_DEFINITION_MODE}". `
    + `Valores validos: ${DEFINITION_MODES.join(', ')}.`,
  );
}
