/**
 * 🏛️ ARTEFACTO: agnostic.capabilities.ts
 * ────────────
 * CAPA: Config (Sovereign Governance)
 * VERSIÓN: 1.0.0
 * COMMIT: P2-M3.1-SCM-JSON-SCHEMA
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Declaración universal de capacidades paramétricas de la UI.
 * - Fuente de verdad para el Manifiesto de Capacidades (Discovery Protocol).
 * - Definición de contratos de diseño mediante JSON-Schema.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - AXIOMA 1 (INDEPENDENCIA): Las capacidades de UI se definen independientemente de su implementación.
 * - AXIOMA 2 (MÍNIMA INFORMACIÓN): El manifiesto contiene solo la firma (qué se puede hacer), no el cuerpo (cómo se hace).
 * - NEVER: Contener lógica de ejecución o dependencias de React.
 * 
 * 📜 ADR: [2026-05-13] CAPABILITY_MANIFEST_SOVEREIGNTY
 * - DECISIÓN: Implementar un registro isomórfico basado en JSON-Schema.
 * - MOTIVO: Claude (IA) requiere esquemas de restricción para operar sin alucinaciones de layout.
 * - IMPACTO: Desacoplamiento total entre el arquitecto (MCP) y los componentes (Frontend).
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [Sovereign Designer Intent]
 * - DOWNSTREAM: [Registry.ts, AgnosticRenderer.tsx, mcp-bridge.ts]
 */

export interface ComponentCapability {
  type: string;
  label: string;
  description: string;
  params: Record<string, any>; // JSON-Schema structure
}

export const CAPABILITY_REGISTRY: Record<string, ComponentCapability> = {
  AgnosticLayout: {
    type: 'layout',
    label: 'Maquetador de Espacios',
    description: 'Componente raíz para la distribución de bloques en el lienzo.',
    params: {
      type: "object",
      properties: {
        variant: { 
          type: "string", 
          enum: ["glass", "premium", "solid", "outline"], 
          default: "glass",
          description: "Estética visual del contenedor."
        },
        padding: { 
          type: "string", 
          enum: ["none", "sm", "md", "lg", "xl"], 
          default: "md" 
        },
        gap: { 
          type: "string", 
          enum: ["none", "sm", "md", "lg"], 
          default: "md" 
        },
        maxWidth: { 
          type: "string", 
          enum: ["full", "7xl", "5xl", "3xl"], 
          default: "full" 
        }
      }
    }
  },
  AgnosticForm: {
    type: 'data',
    label: 'Formulario Inteligente',
    description: 'Proyector dinámico de campos basado en esquemas de DNA.',
    params: {
      type: "object",
      properties: {
        vault: { type: "string", description: "ID de la bóveda de materia (ej: vault_clientes)." },
        layout: { 
          type: "string", 
          enum: ["stack", "grid", "stepper"], 
          default: "stack",
          description: "Modo de visualización de los campos."
        },
        columns: { 
          type: "integer", 
          minimum: 1, 
          maximum: 4, 
          default: 1 
        },
        showTitle: { type: "boolean", default: true },
        submitLabel: { type: "string", default: "Guardar Cambios" }
      },
      required: ["vault"]
    }
  },
  form: {
    type: 'data',
    label: 'Formulario de Materia',
    description: 'Proyector dinámico de campos basado en esquemas de DNA.',
    params: {
      type: "object",
      properties: {
        vault: { type: "string", description: "ID de la bóveda de materia." },
        intent: { type: "string", enum: ["create", "edit", "view"], default: "create" }
      },
      required: ["vault"]
    }
  },
  collection: {
    type: 'data',
    label: 'Colección de Materia',
    description: 'Visualizador de registros masivos (Grid) con capacidades de filtrado y búsqueda.',
    params: {
      type: "object",
      properties: {
        vault: { type: "string", description: "ID de la bóveda de materia." },
        density: { type: "string", enum: ["compact", "normal", "spacious"], default: "normal" },
        selectable: { type: "boolean", default: false }
      },
      required: ["vault"]
    }
  },
  // 🗺️ ESTRUCTURAS DE GOBIERNO (DNA Rules)
  PageRoute: {
    type: 'system',
    label: 'Definición de Ruta',
    description: 'Estructura obligatoria para cualquier ruta del sistema.',
    params: {
      type: "object",
      required: ["path", "blocks"],
      properties: {
        path: { type: "string", description: "URL de la página (ej: /catalogo)" },
        blocks: { 
          type: "array", 
          minItems: 1,
          description: "Colección de componentes UI que componen la página."
        }
      }
    }
  },
  SchemaDefinition: {
    type: 'system',
    label: 'Definición de Esquema',
    description: 'Estructura obligatoria para cualquier esquema de DNA.',
    params: {
      type: "object",
      required: ["name", "fields", "vault_anchor"],
      properties: {
        name: { type: "string" },
        fields: { type: "array", minItems: 1 },
        vault_anchor: { type: "string", description: "ID de la bóveda donde reside la materia." }
      }
    }
  }
};
