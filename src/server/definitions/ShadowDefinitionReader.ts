import type {
  DefinitionReader,
  DefinitionRevision,
} from '@agnostic/core';

import { canonicalJson } from './canonical';

export type ShadowDefinitionReport =
  | {
      status: 'compared';
      match: boolean;
      primaryRevision: string;
      shadowRevision: string;
    }
  | {
      status: 'error';
      primaryRevision: string;
      error: 'shadow_read_failed' | 'comparison_failed';
    };

export type ShadowDefinitionReporter = (
  report: ShadowDefinitionReport,
) => void | Promise<void>;

export class ShadowDefinitionReader implements DefinitionReader {
  constructor(
    private readonly primary: DefinitionReader,
    private readonly shadow: DefinitionReader,
    private readonly report: ShadowDefinitionReporter,
  ) {}

  async readActiveRevision(): Promise<DefinitionRevision> {
    const primaryRevision = await this.primary.readActiveRevision();

    let shadowRevision: DefinitionRevision;
    try {
      shadowRevision = await this.shadow.readActiveRevision();
    } catch {
      await this.emit({
        status: 'error',
        primaryRevision: primaryRevision.id,
        error: 'shadow_read_failed',
      });
      return primaryRevision;
    }

    try {
      await this.emit({
        status: 'compared',
        match:
          canonicalJson(primaryRevision.definitions)
          === canonicalJson(shadowRevision.definitions),
        primaryRevision: primaryRevision.id,
        shadowRevision: shadowRevision.id,
      });
    } catch {
      await this.emit({
        status: 'error',
        primaryRevision: primaryRevision.id,
        error: 'comparison_failed',
      });
    }

    return primaryRevision;
  }

  private async emit(report: ShadowDefinitionReport): Promise<void> {
    try {
      await this.report(report);
    } catch {
      // Reporting is observational and must never change the primary read path.
    }
  }
}
