/**
 * 🛡️ ARTEFACTO: IntegrityChecker.ts
 * ────────────
 * CAPA: Infrastructure (Validation)
 * VERSIÓN: 2.0 (Resilient Hybrid)
 */

import { DataItem } from '@agnostic/core';
import { SYSTEM_NS } from './constants';

export interface IntegrityIssue {
  level: 'ERROR' | 'WARNING';
  context: 'SCHEMA' | 'ROUTE' | 'SYSTEM';
  message: string;
  fixSuggestion?: string;
  offendingId?: string;
}

export interface IntegrityReport {
  isValid: boolean;
  issues: IntegrityIssue[];
  timestamp: string;
}

export class IntegrityChecker {
  /**
   * 🔍 ANALYZE: Auditoría resiliente que soporta tanto DataItems como objetos planos.
   */
  static analyze(fullDb: Record<string, any[]>): IntegrityReport {
    const issues: IntegrityIssue[] = [];
    
    const schemas = fullDb[SYSTEM_NS.SCHEMAS] || [];
    const routes = fullDb[SYSTEM_NS.ROUTES] || [];

    // Helper para extraer la data sin importar el formato (envuelto o plano)
    const getData = (item: any) => item?.data ?? item;

    // 1. Validar existencia de piezas fundamentales
    if (schemas.length === 0) {
      issues.push({
        level: 'WARNING',
        context: 'SYSTEM',
        message: 'Registro de esquemas vacío o no encontrado.',
        fixSuggestion: 'Define al menos un esquema en el DNA Registry.'
      });
    }

    // 2. Mapear nombres de esquemas (Soportando ambos formatos)
    const definedSchemaNames = new Set(
      schemas.map(s => getData(s)?.name || getData(s)?.id).filter(Boolean)
    );

    // 3. Auditoría de Rutas
    routes.forEach(r => {
      const routeData = getData(r);
      const targetContext = routeData?.context;
      
      if (targetContext && !definedSchemaNames.has(targetContext)) {
        issues.push({
          level: 'ERROR',
          context: 'ROUTE',
          message: `Ruta '${routeData.path}' apunta a un contexto inexistente: '${targetContext}'`,
          offendingId: r.id
        });
      }
    });

    // 4. Auditoría de ADN (Schemas)
    schemas.forEach(s => {
      const schemaData = getData(s);
      if (!schemaData) return;

      // Validar campos
      const fields = (schemaData.fields || []) as any[];
      fields.forEach(field => {
        if (field.type === 'select' && field.options_source) {
          if (!definedSchemaNames.has(field.options_source)) {
            issues.push({
              level: 'WARNING',
              context: 'SCHEMA',
              message: `El campo '${field.key}' en '${schemaData.name}' usa un origen de datos desconocido: '${field.options_source}'`,
              offendingId: s.id
            });
          }
        }
      });
    });

    return {
      isValid: !issues.some(i => i.level === 'ERROR'),
      issues,
      timestamp: new Date().toISOString()
    };
  }
}
