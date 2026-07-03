import type { FeatureFlags, SchedulerMode } from './types'

export function resolveSchedulerConfig(block: Record<string, unknown>): { mode: SchedulerMode; features: FeatureFlags } {
  const config = (block.config && typeof block.config === 'object' ? block.config : {}) as Record<string, unknown>
  const rawFeatures = (config.features && typeof config.features === 'object' ? config.features : {}) as Partial<FeatureFlags>
  const mode = (config.mode === 'basic' || block.mode === 'basic') ? 'basic' : 'full'
  const full = mode === 'full'

  return {
    mode,
    features: {
      tags: rawFeatures.tags ?? full,
      calendars: rawFeatures.calendars ?? full,
      members: rawFeatures.members ?? full,
      filters: rawFeatures.filters ?? true,
      admin: rawFeatures.admin ?? full,
    },
  }
}
