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
    cotizador_pro:     () => import('./src/components/specialized/CotizadorPro'),
    ficha_produccion:  () => import('./src/components/specialized/FichaProduccion'),
    comercial_kanban:  () => import('./src/components/specialized/kanban/ComercialKanban'),
    production_kanban: () => import('./src/components/specialized/kanban/ProductionKanban'),
    'agnostic-navbar': () => import('./src/components/specialized/AgnosticNavbar'),
    'agnostic-header': () => import('./src/components/specialized/AgnosticHeader'),
    'yango-dispatcher':() => import('./src/components/specialized/YangoDispatcher'),
    'chart':           () => import('./src/components/specialized/Chart'),
    veta_home:         () => import('./src/components/specialized/VetaHome'),
    veta_catalog:      () => import('./src/components/specialized/VetaCatalog'),
    veta_agendar:      () => import('./src/components/specialized/VetaAgendar'),
    veta_portfolio:    () => import('./src/components/specialized/portfolio/VetaPortfolio'),
    veta_tienda:       () => import('./src/components/specialized/tienda/VetaTienda'),
    veta_producto_detalle: () => import('./src/components/specialized/tienda/VetaProductoDetalle'),
    workspace_switcher:() => import('./src/components/specialized/WorkspaceSwitcher'),
    widget_armado_orden_compra: () => import('./src/components/specialized/WidgetArmadoOrdenCompra'),
    equipo_directory:  () => import('./src/components/specialized/equipo/EquipoDirectory'),
    proveedores_directory: () => import('./src/components/specialized/compras/ProveedoresDirectory'),
    catalogo_manager:  () => import('./src/components/specialized/compras/CatalogoManager'),
    user_profile:      () => import('./src/components/specialized/perfil/UserProfile'),
    finanzas_shell:             () => import('./src/components/specialized/finanzas/FinanzasShell'),
    calendar_scheduler: () => import('./src/components/specialized/calendar/CalendarScheduler'),
    portfolio_manager:  () => import('./src/components/specialized/portfolio/PortfolioManager'),
  },

  features: {
    pdf:  true,
    mail: false,
  },

  integrations: {
    // agno:adapters:start — maintained by `agno install <id>` / `agno remove-adapter <id>` (scripts/agno-adapters.ts)
    notion: () => import('./src/integrations/notion'),
    whatsapp: () => import('./src/integrations/whatsapp'),
    meta: () => import('./src/integrations/meta'),
    tiktok: () => import('./src/integrations/tiktok'),
    gmail: () => import('./src/integrations/gmail'),
    wompi: () => import('./src/integrations/wompi'),
    // agno:adapters:end
  },
})
