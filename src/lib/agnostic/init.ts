/**
 * 🏛️ ARTEFACTO: init.ts
 * ────────────
 * CAPA: Staging / Client (System Component Initialization)
 * VERSIÓN: 3.0
 * COMMIT: P3-M3.3-BOOT-REGISTRATION-CLEANUP
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Bootstrapping script to register static UI components into the isomorphic registry.
 * - Restrict operations strictly to static layout blocks.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Initialize registry once on system boot.
 * - NEVER: Register persistence adapters, operational hooks, or external capabilities.
 * - ALWAYS: Keep blocks limited to standard layout components (form, table, collection).
 * 
 * 📜 ADR: [2026-05-16] BOOT_REGISTRATION_PRUNING
 * - DECISIÓN: Strip out strategy metadata registration and capability logging from the boot initializers.
 * - MOTIVO: Adherence to Suh's Axiom of Independence, removing runtime strategy annotations from the UI initialization layer.
 * - IMPACTO: 20+ lines of codebase pruned, compile-safe, and zero runtime discovery side-effects.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [Registry.ts]
 * - DOWNSTREAM: [AppContext.tsx]
 */

import React from 'react';
import { registry } from './Registry';
import { AgnosticForm } from '@/components/agnostic/blocks/AgnosticForm';
import { AgnosticCollection } from '@/components/agnostic/blocks/AgnosticCollection';
import { AgnosticAction } from '@/components/agnostic/blocks/AgnosticAction';
import { ProjectSelector } from '@/components/agnostic/blocks/ProjectSelector';

// UI Presentation Blocks (ROADMAP_UI_BLOCKS.md)
import { AgnosticNavbar } from '@/components/agnostic/blocks/AgnosticNavbar';
import { AgnosticTabs } from '@/components/agnostic/blocks/AgnosticTabs';
import { AgnosticText } from '@/components/agnostic/blocks/AgnosticText';
import { AgnosticHero } from '@/components/agnostic/blocks/AgnosticHero';
import { AgnosticColumns } from '@/components/agnostic/blocks/AgnosticColumns';
import { AgnosticDivider } from '@/components/agnostic/blocks/AgnosticDivider';
import { AgnosticCardStatic } from '@/components/agnostic/blocks/AgnosticCardStatic';

// Content Blocks (ROADMAP_CONTENT_BLOCKS.md)
import { AgnosticMarkdown } from '@/components/agnostic/blocks/AgnosticMarkdown';
import { AgnosticImage } from '@/components/agnostic/blocks/AgnosticImage';
import { AgnosticStatsGrid } from '@/components/agnostic/blocks/AgnosticStatsGrid';
import { AgnosticFaq } from '@/components/agnostic/blocks/AgnosticFaq';
import { AgnosticTestimonial } from '@/components/agnostic/blocks/AgnosticTestimonial';
import { AgnosticCtaBanner } from '@/components/agnostic/blocks/AgnosticCtaBanner';
import { AgnosticSpacer } from '@/components/agnostic/blocks/AgnosticSpacer';

// Core settings schemas
import actionSettingsSchema from '@/core/designer/dna/schemas/action.settings.json';
import formSettingsSchema from '@/core/designer/dna/schemas/form.settings.json';
import collectionSettingsSchema from '@/core/designer/dna/schemas/collection.settings.json';

// UI blocks settings schemas
import navbarSettingsSchema from '@/core/designer/dna/schemas/navbar.settings.json';
import tabsSettingsSchema from '@/core/designer/dna/schemas/tabs.settings.json';
import textSettingsSchema from '@/core/designer/dna/schemas/text.settings.json';
import heroSettingsSchema from '@/core/designer/dna/schemas/hero.settings.json';
import columnsSettingsSchema from '@/core/designer/dna/schemas/columns.settings.json';
import dividerSettingsSchema from '@/core/designer/dna/schemas/divider.settings.json';
import cardStaticSettingsSchema from '@/core/designer/dna/schemas/card_static.settings.json';

// Content blocks settings schemas
import markdownSettingsSchema from '@/core/designer/dna/schemas/markdown.settings.json';
import imageSettingsSchema from '@/core/designer/dna/schemas/image.settings.json';
import statsGridSettingsSchema from '@/core/designer/dna/schemas/stats_grid.settings.json';
import faqSettingsSchema from '@/core/designer/dna/schemas/faq.settings.json';
import testimonialSettingsSchema from '@/core/designer/dna/schemas/testimonial.settings.json';
import ctaBannerSettingsSchema from '@/core/designer/dna/schemas/cta_banner.settings.json';
import spacerSettingsSchema from '@/core/designer/dna/schemas/spacer.settings.json';

let isInitialized = false;

// Standardize table component to reuse the rich AgnosticCollection with 'table' view preset
const AgnosticTableWrapper = (props: any) => {
  return React.createElement(AgnosticCollection, { ...props, view: 'table' });
};

/**
 * Boots the static UI block components into the unified isomorphic registry.
 */
export function initializeRegistry() {
  if (isInitialized) return;
  isInitialized = true;

  console.log('[RegistryInit] Registering standard layout blocks...');

  // Register Core Projectors
  registry.register('form', AgnosticForm, { category: 'core', name: 'Formulario', settings_schema: formSettingsSchema });
  registry.register('table', AgnosticTableWrapper, { category: 'core', name: 'Tabla', settings_schema: collectionSettingsSchema });
  registry.register('collection', AgnosticCollection, { category: 'core', name: 'Colección', settings_schema: collectionSettingsSchema });
  registry.register('action', AgnosticAction, { category: 'core', name: 'Acción', settings_schema: actionSettingsSchema });
  registry.register('project_selector', ProjectSelector, { category: 'core', name: 'Selector de Proyecto', settings_schema: formSettingsSchema });

  // Register Layout & Presentation Projectors (UI Blocks)
  registry.register('navbar', AgnosticNavbar, { category: 'layout', name: 'Navbar', settings_schema: navbarSettingsSchema });
  registry.register('tabs', AgnosticTabs, { category: 'layout', name: 'Pestañas', settings_schema: tabsSettingsSchema });
  registry.register('columns', AgnosticColumns, { category: 'layout', name: 'Columnas', settings_schema: columnsSettingsSchema });
  registry.register('divider', AgnosticDivider, { category: 'layout', name: 'Divisor', settings_schema: dividerSettingsSchema });
  registry.register('text', AgnosticText, { category: 'content', name: 'Texto', settings_schema: textSettingsSchema });
  registry.register('hero', AgnosticHero, { category: 'content', name: 'Hero', settings_schema: heroSettingsSchema });
  registry.register('card_static', AgnosticCardStatic, { category: 'content', name: 'Tarjeta Estática', settings_schema: cardStaticSettingsSchema });

  // Register Content Projectors (Content Blocks)
  registry.register('markdown', AgnosticMarkdown, { category: 'content', name: 'Markdown', settings_schema: markdownSettingsSchema });
  registry.register('image', AgnosticImage, { category: 'content', name: 'Imagen', settings_schema: imageSettingsSchema });
  registry.register('stats_grid', AgnosticStatsGrid, { category: 'content', name: 'Métricas', settings_schema: statsGridSettingsSchema });
  registry.register('faq', AgnosticFaq, { category: 'content', name: 'FAQ', settings_schema: faqSettingsSchema });
  registry.register('testimonial', AgnosticTestimonial, { category: 'content', name: 'Testimonio', settings_schema: testimonialSettingsSchema });
  registry.register('cta_banner', AgnosticCtaBanner, { category: 'content', name: 'CTA Banner', settings_schema: ctaBannerSettingsSchema });
  registry.register('spacer', AgnosticSpacer, { category: 'layout', name: 'Espacio', settings_schema: spacerSettingsSchema });
}
