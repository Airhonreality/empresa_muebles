/**
 * ModuleManifest — canonical description of an installable compound module.
 *
 * Every module under packages/modules/<id>/ must ship a manifest.ts exporting
 * `manifest: ModuleManifest` (id === folder name).
 * `agno list-modules/install-module/remove-module` (scripts/agno-modules.ts) read
 * this shape to register/unregister modules.
 */

export interface ModuleBlockType {
  /** Entry file relative to the module folder, e.g. "MyComponent.tsx" */
  entry: string;
  /** Optional path to a settings JSON schema (relative to module folder) */
  settings_schema?: string;
}

export interface ModuleManifest {
  /** Must equal the packages/modules/<id> folder name */
  id: string;
  name: string;
  description: string;
  version: string;
  /** Block type (snake_case) → entry point + optional settings_schema */
  block_types: Record<string, ModuleBlockType>;
  /** Schema names that must exist in storage/db/schema_definitions.json */
  required_schemas?: string[];
  /** npm packages the fork must install, e.g. { "recharts": "^2.0.0" } */
  npm_dependencies?: Record<string, string>;
}
