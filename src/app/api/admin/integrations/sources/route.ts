import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/integrations/adapters.server';

export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const adapter = getAdapter(id);
    if (!adapter?.listSources) {
        return NextResponse.json({ error: `Integración ${id} no soporta listSources` }, { status: 404 });
    }

    try {
        const sources = await adapter.listSources();
        return NextResponse.json({ sources });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
    }
}
