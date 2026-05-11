/**
 * 🏛️ ARTEFACTO: Middleware.ts
 * ────────────
 * CAPA: Lib (Infrastructure Services)
 * VERSIÓN: 7.1
 * COMMIT: P2-M3.1-DNA-COMPILER
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Compilación y purificación de definiciones crudas (Raw JSON) a DNA Certificado.
 * - Inyección de "Defaults" y "Safe Inferences" en la frontera de hidratación.
 * - Garantizar la integridad de los bloques ante esquemas incompletos (Fail-Safe).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Ser una función pura (Input: Raw -> Output: Certified).
 * - NEVER: Modificar el estado global directamente.
 * - NEVER: Contener lógica de estado o de renderizado.
 * 
 * 📜 ADR: [2026-05-08] EDGE_DNA_NORMALIZATION
 * - DECISIÓN: Mover la inteligencia de inferencia (context/schemaId) a este Middleware.
 * - MOTIVO: Mantener los componentes de proyección (Blocks) ciegos y mínimos (Suh's Axiom 2).
 * - IMPACTO: Desacoplamiento total entre la persistencia (Vault) y la proyección (Renderer).
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [Vault, AppContext (Hydration Phase)]
 * - DOWNSTREAM: [AgnosticRenderer, UI Blocks]
 */

export type RawBlock = Record<string, any>;
export type CertifiedBlock = {
  type: string;
  context: string;
  schemaId: string;
  config: Record<string, any>;
  [key: string]: any;
};

export class AgnosticDNACompiler {
  /**
   * 🧪 PURIFY: Convierte un bloque incierto en uno certificado.
   * Ahora es consciente del registro de esquemas para resolver bindings implícitos.
   */
  public static purify(raw: RawBlock, schemas: any[] = []): CertifiedBlock | null {
    if (!raw || typeof raw !== 'object') return null;

    // 1. Detección de Tipo (Default: form si hay contexto)
    const type = raw.type || (raw.context ? 'form' : null) || 'form'; 
    
    // 2. Inferencia de Contexto Segura
    const context = raw.context || raw.schemaId?.replace('schema_', '')?.replace('_def', '') || 'system';

    // 3. Resolución Inteligente de Esquema (Binding Soberano)
    let schemaId = raw.schemaId;
    
    if (!schemaId || !schemas.find(s => s.id === schemaId)) {
      // Si no hay ID o el ID es inválido, buscamos por convención de nombre
      const targetName = raw.schemaId || `schema_${context}`;
      const foundSchema = schemas.find(s => s.id === targetName || s.data?.name === targetName || s.data?.name === context);
      
      if (foundSchema) {
        schemaId = foundSchema.id; // Vinculamos al ID REAL (ej: schema_projects_def)
      } else {
        schemaId = targetName; // Fallback a la inferencia original
      }
    }

    // 4. Construcción de Config Segura
    const config = {
      ...(raw.config || {}),
      title: raw.title || raw.config?.title || '',
      syncMode: raw.config?.syncMode || 'auto'
    };

    return {
      ...raw,
      type,
      context,
      schemaId: schemaId as string,
      config
    };
  }

  /**
   * 🌊 COMPILE_PAGE: Purifica todos los bloques de una página usando el registro de esquemas.
   */
  public static compilePage(blocks: RawBlock[], schemas: any[] = []): CertifiedBlock[] {
    if (!Array.isArray(blocks)) return [];
    return blocks
      .map(b => this.purify(b, schemas))
      .filter(Boolean) as CertifiedBlock[];
  }
}
