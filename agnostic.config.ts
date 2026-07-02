import { defineConfig } from './packages/core/src/config'

export default defineConfig({
  storage: './storage',
  adminPath: '/_agnostic',
  blocks: {
    home_portada: () => import('./src/components/specialized/HomePortada'),
    dev_showcase: () => import('./src/components/specialized/DevShowcase'),
    proposal_kaizen: () => import('./src/components/specialized/ProposalKaizen'),
  },
  features: {
    pdf: true,
    mail: false,
  },
  integrations: {
    notion: () => import('./src/integrations/notion'),
  },
})
