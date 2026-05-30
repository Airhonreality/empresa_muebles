/**
 * agnostic.config.ts — Project configuration bridge
 *
 * This file is the ONLY connection point between the engine (packages/)
 * and your project (src/). The engine reads this file at startup to
 * register custom block types into the renderer.
 *
 * ──────────────────────────────────────────────────────────────────
 * HOW TO ADD A CUSTOM BLOCK
 * ──────────────────────────────────────────────────────────────────
 * 1. Generate or create a component in src/components/specialized/
 *    (use _TEMPLATE.tsx as the base pattern)
 *
 * 2. Register it below:
 *    blocks: {
 *      my_block_type: () => import('./src/components/specialized/MyBlock'),
 *    }
 *
 * 3. In storage/db/page_routes.json, set:
 *    { "type": "my_block_type", "context": "my_schema_name" }
 *
 * 4. Run: npm run agnostic:compile (if you changed schemas)
 *
 * The engine routes block.type → your component. No engine files change.
 * ──────────────────────────────────────────────────────────────────
 */

import { defineConfig } from './packages/core/src/config'

export default defineConfig({
  storage:   './storage',
  adminPath: '/_agnostic',

  // ── Custom block registrations ────────────────────────────────────
  // Add your AI-generated specialized components here.
  // Key must match the "type" field in page_routes.json exactly.
  blocks: {
    cotizador_pro: () => import('./src/components/specialized/CotizadorPro'),
    production_directory: () => import('./src/components/specialized/ProductionDirectory'),
  },

  features: {
    pdf:  true,
    mail: false,
  },
})
