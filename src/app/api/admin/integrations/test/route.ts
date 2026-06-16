import { NextRequest, NextResponse } from 'next/server';
import { getAdapter } from '@/lib/integrations/adapters.server';

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const { integrationId, credentials } = body ?? {};

    if (!integrationId || typeof credentials !== 'object') {
        return NextResponse.json({ error: 'integrationId y credentials requeridos' }, { status: 400 });
    }

    const adapter = getAdapter(integrationId, credentials);
    if (!adapter) {
        return NextResponse.json({ error: `Integración desconocida: ${integrationId}` }, { status: 404 });
    }

    const result = await adapter.testConnection().catch((e: any) => ({ ok: false, message: e.message }));
    return NextResponse.json(result);
}
