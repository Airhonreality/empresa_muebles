import { NextResponse } from 'next/server'
import { requireSesionEmpleado } from '@/lib/auth/session'
import { turnoHttp } from '@/lib/asistente/ruta'
import { atender } from '@/lib/asistente/produccion'

// Un turno puede encadenar varias llamadas al modelo y herramientas.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const sesion = await requireSesionEmpleado()
  const cuerpo = await request.json().catch(() => null)
  const r = await turnoHttp(sesion, cuerpo, atender)
  return NextResponse.json(r.body, { status: r.status })
}
