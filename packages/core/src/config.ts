/**
 * AgnosticConfig — bridge between the engine and the project.
 *
 * agnostic.config.ts at the project root imports defineConfig from here
 * and exports a configuration object that init.ts reads to register
 * custom block components into the engine registry.
 *
 * This is the ONLY file in packages/ that the project's agnostic.config.ts
 * is allowed to import from.
 */

import type React from 'react'

// Minimal props the engine passes to every block component.
// Custom components must accept at least these.
export interface BlockProps {
  block:        Record<string, unknown>
  context?:     string
  schema?:      Record<string, unknown> | null
  records?:     Array<{ id: string; context: string; data: Record<string, unknown> }>
  activeRecord?: { id: string; context: string; data: Record<string, unknown> } | null
  api?:         Record<string, unknown>
  [key: string]: unknown
}

// Lazy loader signature — same as React.lazy's factory argument
type BlockLoader = () => Promise<{ default: React.ComponentType<BlockProps> }>

export interface AgnosticConfig {
  /** Path to the storage directory. Default: './storage' */
  storage?: string

  /** URL prefix for the Config Manager UI. Default: '/_agnostic' */
  adminPath?: string

  /**
   * Custom block type registrations.
   * Key: block type string used in page_routes.json
   * Value: lazy loader for the React component
   *
   * Example:
   *   blocks: {
   *     cotizador_dashboard: () => import('./src/components/specialized/CotizadorDashboard'),
   *   }
   */
  blocks?: Record<string, BlockLoader>

  /**
   * Optional engine feature flags.
   * Features not listed here are provided by the engine defaults.
   */
  features?: {
    mail?: boolean
    pdf?:  boolean
  }
}

/**
 * Type-safe config factory. Returns the config unchanged — exists only
 * to provide TypeScript inference at the call site in agnostic.config.ts.
 */
export function defineConfig(config: AgnosticConfig): AgnosticConfig {
  return {
    adminPath: '/_agnostic',
    storage:   './storage',
    ...config,
  }
}
