import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/integrations/adapters.server';

export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id');
    const sourceId = req.nextUrl.searchParams.get('sourceId');
    if (!id || !sourceId) return NextResponse.json({ error: 'id y sourceId requeridos' }, { status: 400 });

    const adapter = getAdapter(id);
    if (!adapter?.getRecords) {
        return NextResponse.json({ error: `Integración ${id} no soporta getRecords` }, { status: 404 });
    }

    try {
        const records = await adapter.getRecords(sourceId);
        return NextResponse.json({ records, capped: records.length >= 5000 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
    }
}
