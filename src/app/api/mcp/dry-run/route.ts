import { NextRequest, NextResponse } from 'next/server';
import { AgnosticDNA_Mutator } from '@/core/mcp/mutator';
import { getStrategy } from '@/server/getStrategy';

/**
 * 🏛️ ARTEFACTO: route.ts (MCP Dry-Run)
 * ────────────
 * CAPA: Server (Agnostic MCP / The Guardian)
 * VERSIÓN: 1.1.0
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const host = req.headers.get('host') ?? undefined;
    const strategy = await getStrategy(host);

    if (action === 'DRY_RUN_SCHEMA') {
      const canonicalSchema = AgnosticDNA_Mutator.applyIntent(payload);
      const existingData = await strategy.read('schema_definitions');
      const existing = existingData['schema_definitions'] || [];
      const collision = existing.find((s: any) => s.id === canonicalSchema.id || s.data.name === canonicalSchema.data.name);

      return NextResponse.json({
        success: true,
        status: collision ? 'UPDATE_PENDING' : 'CREATE_PENDING',
        preview: canonicalSchema,
        analysis: {
          impact: collision ? 'UPDATE' : 'CREATE',
          field_count: canonicalSchema.data.fields.length,
          warning: collision ? `El esquema "${canonicalSchema.data.name}" será modificado.` : null
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported dry-run action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Dry-run failed' }, { status: 500 });
  }
}
