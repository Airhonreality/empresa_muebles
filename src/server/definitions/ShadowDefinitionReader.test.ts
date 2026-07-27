import type {
  DefinitionReader,
  DefinitionRevision,
  DefinitionSet,
} from '@agnostic/core';
import { describe, expect, it, vi } from 'vitest';

import {
  ShadowDefinitionReader,
  type ShadowDefinitionReport,
} from './ShadowDefinitionReader';

function definitions(label: string): DefinitionSet {
  return {
    schema_definitions: [
      {
        id: 'schema-1',
        context: 'schema_definitions',
        data: { label, name: 'records' },
      },
    ],
    page_routes: [
      {
        id: 'route-1',
        context: 'page_routes',
        data: { title: label, path: '/records' },
      },
    ],
    scripts: [],
  };
}

function revision(
  id: string,
  definitionSet: DefinitionSet = definitions('same'),
): DefinitionRevision {
  return {
    id,
    definitions: definitionSet,
    source: { kind: 'test' },
    consistency: 'atomic',
  };
}

function readerDouble(
  result: DefinitionRevision | Error,
): DefinitionReader & { readActiveRevision: ReturnType<typeof vi.fn> } {
  return {
    readActiveRevision: vi.fn(async () => {
      if (result instanceof Error) throw result;
      return result;
    }),
  };
}

describe('ShadowDefinitionReader', () => {
  it('returns the primary revision and reports a canonical match', async () => {
    const primaryRevision = revision('primary-1');
    const reorderedShadowDefinitions: DefinitionSet = {
      scripts: [],
      page_routes: [
        {
          context: 'page_routes',
          id: 'route-1',
          data: { path: '/records', title: 'same' },
        },
      ],
      schema_definitions: [
        {
          data: { name: 'records', label: 'same' },
          context: 'schema_definitions',
          id: 'schema-1',
        },
      ],
    };
    const reporter = vi.fn<(report: ShadowDefinitionReport) => void>();
    const reader = new ShadowDefinitionReader(
      readerDouble(primaryRevision),
      readerDouble(revision('shadow-1', reorderedShadowDefinitions)),
      reporter,
    );

    const result = await reader.readActiveRevision();

    expect(result).toBe(primaryRevision);
    expect(reporter).toHaveBeenCalledWith({
      status: 'compared',
      match: true,
      primaryRevision: 'primary-1',
      shadowRevision: 'shadow-1',
    });
  });

  it('reports a canonical mismatch without exposing definition content', async () => {
    const reporter = vi.fn<(report: ShadowDefinitionReport) => void>();
    const reader = new ShadowDefinitionReader(
      readerDouble(revision('primary-1', definitions('primary secret'))),
      readerDouble(revision('shadow-1', definitions('shadow secret'))),
      reporter,
    );

    await expect(reader.readActiveRevision()).resolves.toMatchObject({
      id: 'primary-1',
    });

    const report = reporter.mock.calls[0][0];
    expect(report).toEqual({
      status: 'compared',
      match: false,
      primaryRevision: 'primary-1',
      shadowRevision: 'shadow-1',
    });
    expect(JSON.stringify(report)).not.toContain('secret');
  });

  it('returns primary and reports a sanitized shadow read failure', async () => {
    const primaryRevision = revision('primary-1');
    const reporter = vi.fn<(report: ShadowDefinitionReport) => void>();
    const reader = new ShadowDefinitionReader(
      readerDouble(primaryRevision),
      readerDouble(new Error('credential and connection details')),
      reporter,
    );

    await expect(reader.readActiveRevision()).resolves.toBe(primaryRevision);
    expect(reporter).toHaveBeenCalledWith({
      status: 'error',
      primaryRevision: 'primary-1',
      error: 'shadow_read_failed',
    });
    expect(JSON.stringify(reporter.mock.calls)).not.toContain('credential');
  });

  it('returns primary and reports canonical comparison failures', async () => {
    const primaryRevision = revision('primary-1');
    const invalidShadow = revision('shadow-1');
    invalidShadow.definitions.scripts = [
      {
        id: 'script-1',
        context: 'scripts',
        data: { invalid: BigInt(1) },
      },
    ];
    const reporter = vi.fn<(report: ShadowDefinitionReport) => void>();
    const reader = new ShadowDefinitionReader(
      readerDouble(primaryRevision),
      readerDouble(invalidShadow),
      reporter,
    );

    await expect(reader.readActiveRevision()).resolves.toBe(primaryRevision);
    expect(reporter).toHaveBeenCalledWith({
      status: 'error',
      primaryRevision: 'primary-1',
      error: 'comparison_failed',
    });
  });

  it('propagates a primary failure without consulting shadow or reporting', async () => {
    const primaryError = new Error('primary unavailable');
    const primary = readerDouble(primaryError);
    const shadow = readerDouble(revision('shadow-1'));
    const reporter = vi.fn<(report: ShadowDefinitionReport) => void>();
    const reader = new ShadowDefinitionReader(primary, shadow, reporter);

    await expect(reader.readActiveRevision()).rejects.toBe(primaryError);
    expect(shadow.readActiveRevision).not.toHaveBeenCalled();
    expect(reporter).not.toHaveBeenCalled();
  });

  it('does not let reporter failures replace a successful primary read', async () => {
    const primaryRevision = revision('primary-1');
    const reader = new ShadowDefinitionReader(
      readerDouble(primaryRevision),
      readerDouble(revision('shadow-1')),
      async () => {
        throw new Error('telemetry unavailable');
      },
    );

    await expect(reader.readActiveRevision()).resolves.toBe(primaryRevision);
  });
});
