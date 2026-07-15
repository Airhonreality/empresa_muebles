import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { getStrategy } from '@/server/getStrategy';
import { sessionOptions, type SessionData } from '@/lib/agnostic/session';

/** Authenticated, minimum disclosure client portal projection. Never exposes Vault records. */
export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const clienteId = session.user?.role === 'cliente' ? session.user.cliente_id : undefined;
  if (!clienteId) return NextResponse.json({ error: 'Sesión de cliente requerida.' }, { status: 401 });
  const records = await getStrategy().read('proyectos');
  const projects = records.flatMap((record) => {
    const data = record.data ?? {};
    if (data.cliente_id !== clienteId) return [];
    return [{ nombre_proyecto: typeof data.nombre_proyecto === 'string' ? data.nombre_proyecto : 'Proyecto', estado: typeof data.estado === 'string' ? data.estado : 'activa', dias_entrega_estimados: typeof data.dias_entrega_estimados === 'number' ? data.dias_entrega_estimados : undefined }];
  });
  return NextResponse.json({ projects });
}
