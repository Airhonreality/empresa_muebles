import { NextResponse } from 'next/server'
import { requireSesionEmpleado } from '@/lib/auth/session'
import { detalleConversacionHttp } from '@/lib/asistente/ruta'
import { detalle } from '@/lib/asistente/produccion'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await requireSesionEmpleado()
  const { id } = await params
  const r = await detalleConversacionHttp(sesion, id, detalle)
  return NextResponse.json(r.body, { status: r.status })
}
