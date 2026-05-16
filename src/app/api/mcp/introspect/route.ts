import { NextRequest, NextResponse } from 'next/server';
import { getStrategy } from '@/server/getStrategy';
import { registry } from '@/lib/agnostic/Registry';
import { initializeRegistry } from '@/lib/agnostic/init';

/**
 * 🏛️ ARTEFACTO: route.ts (MCP Introspect)
 * ────────────
 * CAPA: Server (Agnostic MCP / The Mirror)
 * VERSIÓN: 1.1.0
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Introspección total de capacidades para agentes.
 * - Suministro de mapa de verbos (Capabilities Map).
 * - Exposición de topología de DNA.
 */

initializeRegistry();

export async function GET(req: NextRequest) {
  // 🛰️ ESTABLECER FLUJO SSE (Server-Sent Events)
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Enviar el endpoint donde Claude debe hacer los POSTs
  const messageUrl = `${req.nextUrl.origin}/api/mcp/introspect`;
  
  // Handshake inicial del protocolo MCP sobre HTTP
  const sendEvent = (event: string, data: any) => {
    writer.write(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
  };

  sendEvent('endpoint', messageUrl);

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method, params, id } = body;

    // 🤝 MCP INITIALIZE
    if (method === 'initialize') {
      return NextResponse.json({
        jsonrpc: "2.0", id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: { listChanged: true } },
          serverInfo: { name: "agnostic-oracle", version: "2.0.0" }
        }
      });
    }

    // 🛠️ TOOLS LISTING — Jerarquía Soberana
    if (method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: "2.0", id,
        result: {
          tools: [
            {
              name: "introspect",
              description: "SIEMPRE usa esta herramienta PRIMERO. Devuelve la topología completa del sistema: esquemas con TODOS sus campos, tipos, relaciones y rutas. Analiza lo que ya existe antes de proponer CUALQUIER cambio. Si el usuario pide una funcionalidad nueva, PRIMERO verifica si los esquemas existentes ya la resuelven. Recomienda reutilizar y acoplar antes de crear.",
              inputSchema: {
                type: "object",
                properties: {},
                required: []
              }
            },
            {
              name: "dryRun",
              description: "Simula un cambio en el DNA SIN escribir nada. Usa esta herramienta para PROPONER cambios al usuario y mostrar el resultado esperado. Itera con el usuario hasta que diga 'apruebo', 'ejecuta' o 'dale'.",
              inputSchema: {
                type: "object",
                properties: {
                  context: { type: "string", description: "Contexto destino (ej: schema_definitions, page_routes)" },
                  payload: { type: "object", description: "Datos del esquema o ruta a simular" }
                },
                required: ["context", "payload"]
              }
            },
            {
              name: "saveItem",
              description: "ESCRITURA REAL en el DNA del sistema. ⚠️ NUNCA uses esta herramienta sin aprobación EXPLÍCITA del usuario. El usuario debe decir 'apruebo', 'ejecuta', 'dale' o equivalente. Si el usuario no ha aprobado, usa dryRun para proponer primero.",
              inputSchema: {
                type: "object",
                properties: {
                  context: { type: "string", description: "Contexto destino (ej: schema_definitions, page_routes)" },
                  payload: { type: "object", description: "Datos canónicos a persistir" }
                },
                required: ["context", "payload"]
              }
            },
            {
              name: "deleteItem",
              description: "ELIMINACIÓN REAL. ⚠️ NUNCA uses esta herramienta sin aprobación EXPLÍCITA. Elimina un esquema o registro por ID. Úsala para limpiar entropía o descartar DNA obsoleto.",
              inputSchema: {
                type: "object",
                properties: {
                  context: { type: "string", description: "Contexto (ej: schema_definitions)" },
                  id: { type: "string", description: "ID del elemento a eliminar" }
                },
                required: ["context", "id"]
              }
            }
          ]
        }
      });
    }

    // 🚀 TOOLS EXECUTION
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      const origin = req.nextUrl.origin;

      // 👁️ INTROSPECT: Visión total del sistema
      if (name === 'introspect') {
        const host = req.headers.get('host') ?? undefined;
        const strategy = await getStrategy(host);
        const schemaData = await strategy.read('schema_definitions');
        const schemas = schemaData['schema_definitions'] || [];
        const routeData = await strategy.read('page_routes');
        const routes = routeData['page_routes'] || [];

        const topology = {
          schema_count: schemas.length,
          route_count: routes.length,
          schemas: schemas.map((s: any) => ({
            id: s.id,
            name: s.data?.name,
            fields: (s.data?.fields || []).map((f: any) => ({
              key: f.key,
              type: f.type,
              label: f.label,
              required: f.required,
              section: f.section,
              // Exponer relaciones para que la IA pueda razonar
              ...(f.type === 'relation' ? { targetSchema: f.config?.targetContext || f.targetContext } : {})
            })),
            relations: (s.data?.fields || [])
              .filter((f: any) => f.type === 'relation')
              .map((f: any) => ({ field: f.key, target: f.config?.targetContext || f.targetContext }))
          })),
          routes: routes.map((r: any) => ({
            id: r.id,
            path: r.data?.path,
            blocks: (r.data?.blocks || []).length
          }))
        };

        return NextResponse.json({
          jsonrpc: "2.0", id,
          result: { content: [{ type: "text", text: JSON.stringify(topology, null, 2) }] }
        });
      }

      // 🧪 DRY RUN: Simulación sin escritura
      if (name === 'dryRun') {
        const response = await fetch(`${origin}/api/mcp/dry-run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'DRY_RUN_SCHEMA', payload: args.payload })
        });
        const result = await response.json();
        return NextResponse.json({
          jsonrpc: "2.0", id,
          result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
        });
      }

      // ✍️ SAVE ITEM: Escritura real (requiere aprobación)
      if (name === 'saveItem') {
        const response = await fetch(`${origin}/api/mcp/patch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'saveItem', arguments: args })
        });
        const result = await response.json();
        return NextResponse.json({
          jsonrpc: "2.0", id,
          result: { content: [{ type: "text", text: JSON.stringify(result) }] }
        });
      }

      // ✍️ DELETE ITEM: Eliminación real (requiere aprobación)
      if (name === 'deleteItem') {
        const response = await fetch(`${origin}/api/mcp/patch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'deleteItem', arguments: args })
        });
        const result = await response.json();
        return NextResponse.json({
          jsonrpc: "2.0", id,
          result: { content: [{ type: "text", text: JSON.stringify(result) }] }
        });
      }
    }

    return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
  } catch (err: any) {
    return NextResponse.json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal Error" } }, { status: 500 });
  }
}
