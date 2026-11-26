import { NextResponse } from 'next/server'
import { requireSesionEmpleado } from '@/lib/auth/session'
import { listarConversacionesHttp } from '@/lib/asistente/ruta'
import { listar } from '@/lib/asistente/produccion'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sesion = await requireSesionEmpleado()
  const r = await listarConversacionesHttp(sesion, listar)
  return NextResponse.json(r.body, { status: r.status })
}
