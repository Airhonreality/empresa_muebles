/**
 * 🏛️ ARTEFACTO: AgnosticRenderer.tsx
 * ────────────
 * CAPA: Projection (Universal Engine)
 * VERSIÓN: 8.0
 * COMMIT: P3-M3.1-ATOMIC-PROJECTION
 * ADR: [adr_v8_0_deterministic_state.md]
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Resolución y proyección de bloques atómicos y satélites.
 * - Orquestación del ciclo de vida de la renderización dinámica.
 * - Inferencia de tipo de bloque (Axiom 2 Fallback).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Ser agnóstico a la implementación interna de los bloques.
 * - NEVER: Contener lógica de persistencia o reglas de negocio.
 * - NEVER: Almacenar estado atómico (solo propagarlo).
 * 
 * 📜 ADR: [2026-05-07] UNIVERSAL_BLOCK_PROJECTION
 * - DECISIÓN: Usar un registro descentralizado para la resolución de componentes.
 * - MOTIVO: Cumplir con el Principio de Abierto/Cerrado. Permitir extensiones infinitas sin modificar el núcleo.
 * - IMPACTO: Escalabilidad total del sistema hacia módulos satélite desconocidos.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [AgnosticRegistry, useMateriaStore]
 * - DOWNSTREAM: [All Projection Blocks, Custom Actors]
 */
'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createAgnosticAPI } from '@agnostic/core';
import { registry } from '@/lib/agnostic/Registry';
import { useMateriaStore } from '@/lib/agnostic/store';
import { useAppDispatch } from '@/context/AppContext';

export function AgnosticRenderer({ 
  block, 
  parentId: propParentId, 
  parentKey: propParentKey,
  onSuccess
}: { 
  block: any, 
  parentId?: string, 
  parentKey?: string,
  onSuccess?: (record: any) => void
}) {
  const { data: materia } = useMateriaStore();
  const { saveItem, deleteItem, openOverlay, closeOverlay } = useAppDispatch();
  const router = useRouter();

  const stateRef = useRef({ data: materia });
  stateRef.current = { data: materia };

  const agnosticApi = useMemo(() => createAgnosticAPI({
    router, saveItem, deleteItem, openOverlay, closeOverlay, stateRef, block, toast
  }), [router, saveItem, deleteItem, openOverlay, closeOverlay, block, materia]);

  // 🛡️ UNIVERSAL VISIBILITY GUARDIAN (Flat Whitelist)
  // Note: user role checks will be migrated to SystemStore in the next iteration
  
  try {
    const config = block.config || {};
    
    // 🏛️ PURE DISPATCHER (Spec v7.0)
    const type = block.type;
    if (!type) return null;

    const BlockComponent = registry.get(type);

    if (!BlockComponent) {
      console.warn(`[AgnosticRenderer] Unknown block type: ${type}`);
      return null;
    }

    // 🏗️ UNIVERSAL PROJECTION: The Renderer is now blind and extensible.
    return (
      <BlockComponent
        {...block}
        {...config}
        parentId={propParentId || config.parentId}
        parentKey={propParentKey || config.parentKey}
        onSuccess={onSuccess}
        api={agnosticApi} // For custom modules and belts
      />
    );
  } catch (err) {
    console.error('[AgnosticRenderer] Projection Failure:', err);
    return null;
  }
}
