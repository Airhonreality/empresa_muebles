/**
 * 🏛️ ARTEFACTO: init.ts
 * ────────────
 * CAPA: Lib (System Boot)
 * VERSIÓN: 2.0
 * COMMIT: P3-M2.1-BOOT-CAPABILITY-REGISTRATION
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Inicialización central del Catálogo de Capacidades del Sistema.
 * - Registro de bloques core y estrategias de soberanía.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Garantizar una única ejecución (Singleton Initialization).
 * - NEVER: Registrar lógica de estado; solo capacidades estáticas.
 */

import { registry } from './Registry';
import { AgnosticForm } from '@/components/agnostic/blocks/AgnosticForm';
import { AgnosticTable } from '@/components/agnostic/blocks/AgnosticTable';
import { AgnosticCollection } from '@/components/agnostic/blocks/AgnosticCollection';

let isInitialized = false;

export function initializeRegistry() {
  if (isInitialized) return;
  isInitialized = true;

  console.log('[SystemBoot] Initializing Universal Capability Catalog...');

  // 1. CORE UI BLOCKS
  registry.register('form', AgnosticForm, { category: 'core', name: 'Formulario Agnóstico' });
  registry.register('table', AgnosticTable, { category: 'core', name: 'Tabla de Materia' });
  registry.register('collection', AgnosticCollection, { category: 'core', name: 'Colección de Elementos' });

  // 2. SOVEREIGNTY STRATEGIES (Catalog)
  const strategies = [
    { id: 'LocalStrategy', label: 'Estrategia Local', desc: 'Persistencia en sistema de archivos local' },
    { id: 'GitHubStrategy', label: 'Estrategia GitHub', desc: 'Soberanía en nube vía Git (Satelital)' },
    { id: 'SupabaseStrategy', label: 'Estrategia Supabase', desc: 'Almacenamiento en base de datos PostgreSQL' }
  ];

  strategies.forEach(s => {
    registry.registerCapability('strategy', s.id, {
      domain: 'sovereignty',
      label: s.label,
      description: s.desc
    });
  });

  console.log(`[SystemBoot] Catalog Ready: ${strategies.length} strategies registered.`);
}
