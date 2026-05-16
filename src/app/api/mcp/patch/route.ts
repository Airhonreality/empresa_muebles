import { NextRequest, NextResponse } from 'next/server';
import { AgnosticDNA_Mutator } from '@/core/mcp/mutator';
import { getStrategy } from '@/server/getStrategy';

/**
 * 🏛️ ARTEFACTO: route.ts (MCP Patch)
 * ────────────
 * CAPA: Server (Agnostic MCP / The Persistor)
 * VERSIÓN: 1.1.0
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const host = req.headers.get('host') ?? undefined;
    const strategy = await getStrategy(host);

    if (action === 'PATCH_SCHEMA' || action === 'saveItem' && body.arguments?.context === 'schema_definitions') {
      const payloadData = payload || body.arguments?.payload;
      const existingData = await strategy.read('schema_definitions');
      const existing = existingData['schema_definitions'] || [];
      
      const existingSchema = existing.find((s: any) => s.id === `schema_${payloadData.name}_def` || s.data.name === payloadData.name);
      const canonicalSchema = AgnosticDNA_Mutator.applyIntent(payloadData, existingSchema);
      
      let updatedSchemas;
      const index = existing.findIndex((s: any) => s.id === canonicalSchema.id);
      
      if (index !== -1) {
        updatedSchemas = [...existing];
        updatedSchemas[index] = canonicalSchema;
      } else {
        updatedSchemas = [...existing, canonicalSchema];
      }

      await strategy.write({ 'schema_definitions': updatedSchemas });

      return NextResponse.json({
        success: true,
        mutation: index !== -1 ? 'UPDATED' : 'CREATED',
        record: canonicalSchema
      });
    }

    if (action === 'PATCH_ROUTE' || action === 'saveItem' && body.arguments?.context === 'page_routes') {
      const payloadData = payload || body.arguments?.payload;
      const existingData = await strategy.read('page_routes');
      const existing = existingData['page_routes'] || [];
      
      const index = existing.findIndex((r: any) => r.id === payloadData.id || r.data.path === payloadData.path);
      
      let updatedRoutes = [...existing];
      const newRoute = {
        id: payloadData.id || `route_${payloadData.path.replace(/\//g, '_')}`,
        context: 'page_routes',
        data: {
          ...(index !== -1 ? existing[index].data : {}),
          ...payloadData
        }
      };

      if (index !== -1) {
        updatedRoutes[index] = newRoute;
      } else {
        updatedRoutes.push(newRoute);
      }

      await strategy.write({ 'page_routes': updatedRoutes });
      return NextResponse.json({ success: true, mutation: index !== -1 ? 'UPDATED' : 'CREATED', record: newRoute });
    }

    return NextResponse.json({ success: false, error: 'Unsupported patch action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Patch failed' }, { status: 500 });
  }
}
