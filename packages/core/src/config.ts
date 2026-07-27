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
import type { AgnosticAPI } from './indra'
import type { IntegrationClientLoader } from './integration'

// Minimal props the engine passes to every block component.
// Custom components must accept at least these.
export interface BlockProps {
  block:        Record<string, unknown>
  context?:     string
  schema?:      Record<string, unknown> | null
  records?:     Array<{ id: string; context: string; data: Record<string, unknown> }>
  activeRecord?: { id: string; context: string; data: Record<string, unknown> } | null
  api?:         AgnosticAPI
  [key: string]: unknown
}

export type PublicFilterOperator = 'eq' | 'in' | 'contains' | 'gte' | 'lte'
export type PublicFixedFilterOperator = 'eq' | 'in'

export interface PublicReadModelField {
  key: string
  label?: string
  format?: 'text' | 'currency' | 'number' | 'date' | 'boolean'
}

export interface PublicReadModelFilter {
  key: string
  operator: PublicFilterOperator
  max_values?: number
}

/** A server-enforced predicate. Clients cannot override or remove it. */
export interface PublicReadModelFixedFilter {
  key: string
  operator: PublicFixedFilterOperator
  value: string | number | boolean | Array<string | number | boolean>
}

export interface PublicReadModelSort {
  key: string
  directions?: Array<'asc' | 'desc'>
}

export interface PublicReadModel {
  /** Stable public API identifier. Never use the source namespace as the URL. */
  name: string
  /** Private storage namespace read only on the server. */
  source: string
  /** Explicit projection. Fields outside this list never leave the server. */
  fields: PublicReadModelField[]
  fixed_filters: PublicReadModelFixedFilter[]
  filters?: PublicReadModelFilter[]
  sort?: PublicReadModelSort[]
  default_sort?: { key: string, direction: 'asc' | 'desc' }
  limit?: { default: number, max: number }
}

// Lazy loader signature — same as React.lazy's factory argument
export type BlockLoader = () => Promise<{ default: React.ComponentType<BlockProps> }>

export interface ApplicationShellProps {
  children: React.ReactNode
}

export type ApplicationShellLoader = () => Promise<{
  default: React.ComponentType<ApplicationShellProps>
}>

/**
 * A block entry can be a plain lazy loader (short form) or an object
 * with an optional settings_schema for the designer panel.
 */
export type BlockConfig = BlockLoader | {
  loader: BlockLoader
  settings_schema?: Record<string, unknown>
}

export interface AgnosticConfig {
  /** Path to the storage directory. Default: './storage' */
  storage?: string

  /** URL prefix for the Config Manager UI. Default: '/_agnostic' */
  adminPath?: string

  /**
   * Custom block type registrations.
   * Key: block type string used in page_routes.json
   * Value: lazy loader for the React component, or an object with loader + settings_schema
   *
   * Example:
   *   blocks: {
   *     cotizador_dashboard: () => import('./src/components/specialized/CotizadorDashboard'),
   *     my_block: { loader: () => import('./src/components/specialized/MyBlock'), settings_schema: { ... } },
   *   }
   */
  blocks?: Record<string, BlockConfig>

  /**
   * Optional fork-owned chrome for authenticated application routes.
   * The engine keeps authentication and routing responsibilities; the fork
   * owns product navigation, labels and information architecture.
   */
  applicationShell?: ApplicationShellLoader

  /**
   * Optional engine feature flags.
   * Features not listed here are provided by the engine defaults.
   */
  features?: {
    mail?: boolean
    pdf?:  boolean
  }

  /**
   * Public, read-only collection projections. These are a separate capability
   * from Vault and are intentionally declared by the fork, not inferred from
   * a storage namespace.
   */
  publicReadModels?: PublicReadModel[]

  /**
   * Custom integration modules registered in the project.
   * Key: integration identifier (e.g. 'notion')
   * Value: dynamic import loader returning the IntegrationClientModule.
   */
  integrations?: Record<string, IntegrationClientLoader>
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
