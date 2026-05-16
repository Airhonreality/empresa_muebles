/**
 * 🏛️ ARTEFACTO: AgnosticRenderer.tsx
 * ────────────
 * CAPA: Projection (Universal Engine)
 * VERSIÓN: 8.1
 * COMMIT: P3-M3.2-STANDARDIZED-RELATIONSHIP
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Resolución y proyección de bloques atómicos y satélites.
 * - Orquestación del ciclo de vida de la renderización dinámica.
 * - Soporte para Inferencia Relacional y Segmentación (Pivot).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Utilizar nomenclatura snake_case para claves de configuración de datos.
 * - MUST: Propagar el 'parent_id' y 'parent_key' para mantener la integridad relacional.
 * - NEVER: Contener lógica de persistencia o reglas de negocio.
 * 
 * 📜 ADR: [2026-05-11] STANDARDIZED_DATA_ARCHITECTURE
 * - DECISIÓN: Migrar de camelCase (parentKey) a snake_case (parent_key) en la arquitectura de bloques.
 * - MOTIVO: Alinear la nomenclatura de la UI con los estándares de bases de datos relacionales (SQL).
 * - IMPACTO: Mayor coherencia entre el diseñador de rutas y el motor de ejecución.
 */
'use client';

import React, { useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createAgnosticAPI } from '@agnostic/core';
import { registry } from '@/lib/agnostic/Registry';
import { cn } from '@/lib/utils';
import { useDNAStore, useMateriaStore, useActiveRecord } from '@/lib/agnostic/store';
import { useAppDispatch } from '@/context/AppContext';
import { useParams } from 'next/navigation';
import '@/styles/layout_tokens.css';

export function AgnosticRenderer({ 
  block, 
  parentId: propParentId, 
  parentKey: propParentKey,
  context: propContext,
  intent: propIntent,
  record: propRecord,
  onSuccess
}: { 
  block: any, 
  parentId?: string, 
  parentKey?: string,
  context?: string,
  intent?: 'create' | 'edit' | 'list' | 'view',
  record?: any,
  onSuccess?: (record: any) => void
}) {
  const { data: materia } = useMateriaStore();
  const { schemas } = useDNAStore();
  const activeRecordFromStore = useActiveRecord();
  const { saveItem, deleteItem, openOverlay, closeOverlay } = useAppDispatch();
  const router = useRouter();
  const { slug } = useParams();

  const stateRef = useRef({ data: materia });
  stateRef.current = { data: materia };

  const agnosticApi = useMemo(() => createAgnosticAPI({
    router, saveItem, deleteItem, openOverlay, closeOverlay, stateRef, block, toast
  }), [router, saveItem, deleteItem, openOverlay, closeOverlay, block]); // REMOVED materia dependency

  try {
    const config = block.config || {};
    const type = block.type;
    if (!type) return null;

    // 🪐 AXIOMATIC GRAVITY RESOLUTION
    const currentContext = block.context || config.context || block.data?.context || propContext;
    // 🏛️ ISOMORPHIC RESOLVER: Soporte para nomenclatura DEV (snake_case) y Legacy (camelCase)
    const schemaId = block.schema_id || block.schemaId || config.schemaId || block.data?.schemaId;
    const context = block.context || block.data?.context;
    
    // 🧬 ADAPTIVE SCHEMA RESOLUTION
    const schema = useMemo(() => {
      if (!schemaId) return null;
      const schemaItem = schemas.find((s) => s.id === schemaId || s.data?.slug === schemaId);
      return schemaItem?.data;
    }, [schemaId, schemas]);

    // 🏺 ADAPTIVE RECORD RESOLUTION (Sovereign Isolation)
    const activeRecord = propRecord || activeRecordFromStore;

    // 🎯 DETERMINISTIC INTENT (Primacía del DNA)
    const intent = propIntent || block.intent || config.intent || block.data?.intent || 'list';

    // 🏺 CONTEXTUAL DATA RESOLUTION (The Renderer provides the matter)
    const records = useMemo(() => {
      if (!currentContext || currentContext === 'system') return [];
      return materia[currentContext] || [];
    }, [currentContext, materia[currentContext]]); // ONLY depend on the specific context slice

    const BlockComponent = registry.get(type);

    if (!BlockComponent) {
      console.warn(`[AgnosticRenderer] Unknown block type: ${type}`);
      return null;
    }

    // 🏗️ UNIVERSAL PROJECTION (Adaptive Protocol)
    // 🎨 LAYOUT PROJECTION
    const layout = block.layout || {};
    const padding = layout.padding || [0, 0, 0, 0];
    const layoutStyles: React.CSSProperties = {
      padding: `${padding[0]}rem ${padding[1]}rem ${padding[2]}rem ${padding[3]}rem`,
      gap: `${layout.gap || 0}rem`,
      overflow: layout.clip ? 'hidden' : 'visible',
    };

    if (layout.sizing === 'relative' && layout.width) {
      layoutStyles.width = layout.width; // Should be in %
    }

    const layoutClasses = cn(
      'agnostic-frame',
      layout.direction === 'horizontal' ? 'frame-horizontal' : 'frame-vertical',
      layout.align || 'align-tl',
      layout.sizing === 'fill' ? 'size-fill' : 'size-hug'
    );

    return (
      <div className={layoutClasses} style={layoutStyles}>
        <BlockComponent
          {...block}
          {...(block.data || {})}
          {...config}
          schema={schema} 
          schema_id={schemaId}
          context={currentContext}
          activeRecord={activeRecord}
          records={records}
          intent={intent}
          parentId={propParentId || config.parentId}
          parentKey={propParentKey || config.parent_key || config.parentKey}
          onSuccess={onSuccess}
          api={agnosticApi}
        />
      </div>
    );
  } catch (err) {
    console.error('[AgnosticRenderer] Projection Failure:', err);
    return null;
  }
}
