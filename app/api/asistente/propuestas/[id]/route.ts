import { NextResponse } from 'next/server'
import { requireSesionEmpleado } from '@/lib/auth/session'
import { resolverPropuestaHttp } from '@/lib/asistente/ruta'
import { resolverPropuesta } from '@/lib/asistente/produccion'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requireSesionEmpleado()
  const { id } = await params
  const cuerpo = (await request.json().catch(() => null)) as { accion?: unknown } | null
  const r = await resolverPropuestaHttp(sesion, id, cuerpo?.accion, resolverPropuesta)
  return NextResponse.json(r.body, { status: r.status })
}
