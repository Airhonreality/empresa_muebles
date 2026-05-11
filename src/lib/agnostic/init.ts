/**
 * 🏛️ ARTEFACTO: init.ts
 * ────────────
 * CAPA: Lib (Infrastructure Services)
 * VERSIÓN: 6.0
 * COMMIT: P2-M2.2-REGISTRY-INIT
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Inicialización centralizada del Agnostic Registry.
 * - Resolución de dependencias circulares mediante carga diferida de bloques.
 * 
 * 🛡/ AXIOMATIC_CONTRACT:
 * - MUST: Ejecutarse una sola vez al inicio del ciclo de vida del cliente.
 * - NEVER: Contener lógica de renderizado.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [Core Blocks, Registry]
 * - DOWNSTREAM: [AgnosticRenderer]
 */

import { registry } from './Registry';
import { AgnosticForm } from '../../components/agnostic/blocks/AgnosticForm';
import { AgnosticTable } from '../../components/agnostic/blocks/AgnosticTable';
import { AgnosticCollection } from '../../components/agnostic/blocks/AgnosticCollection';
import { AgnosticBelt } from '../../components/agnostic/blocks/AgnosticBelt';
import { AgnosticSheet } from '../../components/agnostic/blocks/AgnosticSheet';
import { CustomActorBridge } from '../../components/agnostic/engine/CustomActorBridge';

export function initializeRegistry() {
  registry.register('form', AgnosticForm);
  registry.register('table', AgnosticTable);
  registry.register('collection', AgnosticCollection);
  registry.register('belt', AgnosticBelt);
  registry.register('sheet', AgnosticSheet);
  registry.register('custom', CustomActorBridge);
  
  console.log('[AgnosticSystem] Registry Initialized (Axiomatic v6.0)');
}
