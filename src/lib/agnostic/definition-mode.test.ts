import { describe, expect, it } from 'vitest';
import {
  DEFINITION_MODES,
  resolveDefinitionMode,
  type DefinitionMode,
} from './definition-mode';

describe('resolveDefinitionMode', () => {
  it('defaults to legacy when the mode is absent or blank', () => {
    expect(resolveDefinitionMode({})).toBe('legacy');
    expect(resolveDefinitionMode({ AGNOSTIC_DEFINITION_MODE: '   ' })).toBe('legacy');
  });

  it.each(DEFINITION_MODES)('accepts the explicit %s mode', mode => {
    expect(resolveDefinitionMode({ AGNOSTIC_DEFINITION_MODE: mode })).toBe(mode);
  });

  it('normalizes surrounding whitespace and case', () => {
    expect(resolveDefinitionMode({ AGNOSTIC_DEFINITION_MODE: '  ReViSiOn  ' }))
      .toBe('revision');
  });

  it('rejects invalid values with an explicit configuration error', () => {
    expect(() => resolveDefinitionMode({ AGNOSTIC_DEFINITION_MODE: 'automatic' }))
      .toThrow(
        'AGNOSTIC_DEFINITION_MODE invalido: "automatic". Valores validos: legacy, shadow, revision.',
      );
  });

  it('does not infer a mode from storage providers or production', () => {
    const productionWithProviders: Readonly<Record<string, string | undefined>> = {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://example.invalid/database',
      GITHUB_REPO: 'owner/repository',
    };

    expect(resolveDefinitionMode(productionWithProviders)).toBe('legacy');
  });

  it('allows legacy and revision explicitly in production', () => {
    const resolveProductionMode = (mode: DefinitionMode) => resolveDefinitionMode({
      NODE_ENV: 'production',
      AGNOSTIC_DEFINITION_MODE: mode,
    });

    expect(resolveProductionMode('legacy')).toBe('legacy');
    expect(resolveProductionMode('revision')).toBe('revision');
  });
});
