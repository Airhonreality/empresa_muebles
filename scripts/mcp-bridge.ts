import { AgnosticDNA_Mutator } from '../src/core/mcp/mutator';
import { CAPABILITY_REGISTRY } from '../src/config/agnostic.capabilities';
import fs from 'fs';
import path from 'path';

/**
 * 🛰️ MCP_BRIDGE: The Sovereign Stdio Oracle
 * This script acts as the official bridge between Claude CLI and the Agnostic System.
 */

const STORAGE_PATH = path.join(process.cwd(), 'storage', 'empresa_muebles', 'db');

const tools = [
  {
    name: "query",
    description: "Consulta quirúrgica del ecosistema agnóstico (Estructura, Inventario o Especificaciones).",
    inputSchema: {
      type: "object",
      properties: {
        domain: { 
          type: "string", 
          enum: ["structure", "inventory", "specs"],
          description: "Dominio de la consulta: structure (DNA), inventory (Vaults), specs (Capabilities)."
        },
        context: {
          type: "string",
          description: "Contexto específico dentro del dominio (ej: page_routes, schema_definitions). Por defecto es schema_definitions para structure."
        },
        target: { 
          type: "string", 
          description: "ID o Nombre específico para filtrar la consulta (opcional)."
        }
      },
      required: ["domain"]
    }
  },
  {
    name: "saveItem",
    description: "Crea o actualiza un esquema o ruta quirúrgicamente.",
    inputSchema: {
      type: "object",
      properties: {
        context: { type: "string" },
        payload: { type: "object" }
      },
      required: ["context", "payload"]
    }
  },
  {
    name: "fetchItem",
    description: "Lee un esquema o ruta del DNA.",
    inputSchema: {
      type: "object",
      properties: {
        context: { type: "string" },
        id: { type: "string" }
      },
      required: ["context", "id"]
    }
  },
  {
    name: "deleteItem",
    description: "Elimina un esquema o registro por ID.",
    inputSchema: {
      type: "object",
      properties: {
        context: { type: "string" },
        id: { type: "string" }
      },
      required: ["context", "id"]
    }
  },
  {
    name: "audit",
    description: "Realiza una biopsia total del sistema buscando artefactos con entropía interna.",
    inputSchema: {
      type: "object",
      properties: {
        context: { type: "string", description: "Contexto específico a auditar (opcional, audita todo por defecto)." }
      }
    }
  },
  {
    name: "validate",
    description: "Linter de DNA: Valida un payload sin guardarlo y devuelve los errores encontrados.",
    inputSchema: {
      type: "object",
      properties: {
        context: { type: "string" },
        payload: { type: "object" }
      },
      required: ["context", "payload"]
    }
  }
];

async function handleRequest(request: any) {
  const { method, params, id } = request;

  if (method === "tools/list") {
    return { id, result: { tools } };
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params;
    
    try {
      if (name === "query") {
        const { domain, context, target } = args;
        let result: any = null;

        if (domain === 'structure') {
          const ctx = context || 'schema_definitions';
          const filePath = path.join(STORAGE_PATH, `${ctx}.json`);
          const data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : { [ctx]: [] };
          const items = data[ctx] || [];
          
          if (target) {
            result = items.find((i: any) => i.id === target || i.data?.name === target || i.data?.path === target);
          } else {
            // INDEX MODE: Solo devolver metadatos mínimos
            result = items.map((i: any) => ({ id: i.id, name: i.data?.name || i.data?.path, anchor: i.data?.vault_anchor || i.data?.component }));
          }
        }

        if (domain === 'inventory') {
          const ctx = context || 'vault_manifest';
          const filePath = path.join(STORAGE_PATH, `${ctx}.json`);
          const data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : { [ctx]: [] };
          const vaults = data[ctx] || [];
          
          if (target) {
            result = vaults.find((v: any) => v.id === target || v.data?.label === target);
          } else {
            result = vaults.map((v: any) => ({ id: v.id, label: v.data?.label, dna: v.data?.dna }));
          }
        }

        if (domain === 'specs') {
          if (target) {
            result = CAPABILITY_REGISTRY[target];
          } else {
            // INDEX MODE: Solo devolver tipos registrados
            result = Object.keys(CAPABILITY_REGISTRY);
          }
        }
        
        return { 
          id, 
          result: { 
            content: [{ 
              type: "text", 
              text: JSON.stringify(result || { error: "Target not found in domain" }, null, 2) 
            }] 
          } 
        };
      }

      if (name === "saveItem") {
        const { context, payload } = args;
        const filePath = path.join(STORAGE_PATH, `${context}.json`);
        
        // 🛡️ VALIDACIÓN EN VUELO (Axioma de Integridad)
        const validation = AgnosticDNA_Mutator.validate(context, payload);
        if (!validation.isValid) {
          return { 
            id, 
            error: { 
              code: -32602, 
              message: validation.error || "Invalid payload structure" 
            } 
          };
        }

        let data: any = { [context]: [] };
        if (fs.existsSync(filePath)) {
          const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          data = Array.isArray(raw) ? { [context]: raw } : raw;
        }

        const items = data[context] || [];
        const index = items.findIndex((i: any) => i.id === payload.id || (payload.name && i.data?.name === payload.name));

        if (index > -1) {
          // Update existing
          items[index] = { ...items[index], data: { ...items[index].data, ...payload }, updated_at: new Date().toISOString() };
        } else {
          // Create new
          items.push({
            id: payload.id || `item_${Date.now()}`,
            context,
            data: payload,
            updated_at: new Date().toISOString()
          });
        }

        fs.writeFileSync(filePath, JSON.stringify({ [context]: items }, null, 2));
        return { id, result: { content: [{ type: "text", text: `Success: ${context} updated` }] } };
      }

      if (name === "deleteItem") {
        const { context, id: itemId } = args;
        const filePath = path.join(STORAGE_PATH, `${context}.json`);
        if (!fs.existsSync(filePath)) throw new Error("Context not found");

        const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const data = Array.isArray(raw) ? { [context]: raw } : raw;
        const items = data[context] || [];
        
        const filtered = items.filter((i: any) => i.id !== itemId);
        if (items.length === filtered.length) throw new Error("Item not found");

        fs.writeFileSync(filePath, JSON.stringify({ [context]: filtered }, null, 2));
        return { id, result: { content: [{ type: "text", text: `Success: ${itemId} deleted` }] } };
      }

      if (name === "audit") {
        const files = fs.readdirSync(STORAGE_PATH).filter(f => f.endsWith('.json'));
        const report: any[] = [];

        for (const file of files) {
          const ctx = file.replace('.json', '');
          if (args.context && ctx !== args.context) continue;

          const filePath = path.join(STORAGE_PATH, file);
          const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          const items = raw[ctx] || [];

          for (const item of items) {
            // Usamos la Ley Universal del Mutador
            const validation = AgnosticDNA_Mutator.validate(ctx, item.data || item);
            if (!validation.isValid) {
              report.push({
                context: ctx,
                id: item.id || 'N/A',
                label: item.data?.name || item.data?.label || item.data?.path || item.id,
                error: validation.error
              });
            }
          }
        }

        return { 
          id, 
          result: { 
            content: [{ 
              type: "text", 
              text: report.length > 0 
                ? `🚨 REPORTE DE ENTROPÍA:\n${JSON.stringify(report, null, 2)}` 
                : "✅ SISTEMA SALUDABLE: No se detectó entropía interna." 
            }] 
          } 
        };
      }

      if (name === "validate") {
        const { context, payload } = args;
        const validation = AgnosticDNA_Mutator.validate(context, payload);
        
        return { 
          id, 
          result: { 
            content: [{ 
              type: "text", 
              text: validation.isValid 
                ? "✅ PAYLOAD VÁLIDO: Cumple con el contrato industrial." 
                : `❌ ERROR DE VALIDACIÓN:\n${validation.error}` 
            }] 
          } 
        };
      }
    } catch (error: any) {
      return { id, error: { code: -32603, message: error.message } };
    }
  }

  return { id, error: { code: -32601, message: "Method not found" } };
}

// ─── STDIO LOOP ──────────────────────────────────────────────────────────────
process.stdin.on('data', async (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const request = JSON.parse(line);
      const response = await handleRequest(request);
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (e) {}
  }
});
