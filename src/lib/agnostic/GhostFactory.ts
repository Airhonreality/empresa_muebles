/**
 * 🏛️ ARTEFACTO: GhostFactory.ts
 * ────────────
 * CAPA: Lib (Infrastructure Services)
 * VERSIÓN: 6.1
 * COMMIT: P2-M1.3-ADR-RECOVERY
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Generación dinámica de esquemas (Dynamic Schema Synthesis).
 * - Análisis de materia atómica para inferencia de metadatos.
 * - Resolución de estados de "vacío" en la capa de proyección.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Ser una factoría pura y determinista.
 * - NEVER: Realizar operaciones de I/O o persistencia.
 * - NEVER: Depender de estados de UI o contextos externos.
 * 
 * 📜 ADR: [2026-05-07] DYNAMIC_SCHEMA_RECOVERY
 * - DECISIÓN: Sintetizar metadatos a partir de las claves encontradas en los registros de datos.
 * - MOTIVO: Evitar el fallo de proyección cuando no existe una definición formal en el DNA.
 * - IMPACTO: Resiliencia total del sistema ante la ausencia de esquemas explícitos.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [DataItem, @agnostic/core]
 * - DOWNSTREAM: [AgnosticCollection, AgnosticForm]
 */

import { DataItem } from '@agnostic/core';

export interface GhostSchema {
  name: string;
  fields: any[];
  projection_map: {
    title: string;
    badge?: string;
  };
}

export function generateGhostSchema(context: string, items: DataItem[]): GhostSchema {
  // 🧠 INFERENCE ENGINE: Extract keys from existing materia
  const keys = new Set<string>();
  items.forEach(item => {
    Object.keys(item.data || {}).forEach(k => keys.add(k));
  });

  // Filter out internal and relational keys
  const visibleKeys = Array.from(keys).filter(k => 
    !k.startsWith('_') && 
    !k.endsWith('_id') && 
    k !== 'id' && 
    k !== 'context'
  );

  const fields = visibleKeys.map(k => ({
    key: k,
    label: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    type: 'text',
    section: 'General'
  }));

  // Standard Projection Map
  const titleField = visibleKeys.find(k => k === 'name' || k === 'title') || visibleKeys[0] || 'id';

  return {
    name: `Ghost_${context}`,
    fields,
    projection_map: {
      title: titleField
    }
  };
}
