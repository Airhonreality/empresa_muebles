import { NextRequest, NextResponse } from 'next/server';
import { getStrategy } from '@/server/getStrategy';
import { SYSTEM_NS } from '@/lib/agnostic/constants';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cliente_id = searchParams.get('cliente_id');

    if (!cliente_id) {
      return NextResponse.json({ error: 'cliente_id requerido' }, { status: 400 });
    }

    const strategy: any = getStrategy();
    const users = await strategy.read(SYSTEM_NS.USERS);

    const existe = Array.isArray(users) && users.some(
      (u: any) => u.data?.cliente_id === cliente_id
    );

    return NextResponse.json({ existe });
  } catch (err: any) {
    console.error('[Auth/CheckClienteAccess]', err);
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 });
  }
}
