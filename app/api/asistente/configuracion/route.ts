import { NextResponse } from 'next/server'
import { requireSesionEmpleado } from '@/lib/auth/session'
import { guardarConfiguracionHttp, leerConfiguracionHttp } from '@/lib/asistente/ruta'
import { depsConfiguracion } from '@/lib/asistente/produccion'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sesion = await requireSesionEmpleado()
  const r = await leerConfiguracionHttp(sesion, depsConfiguracion)
  return NextResponse.json(r.body, { status: r.status })
}

export async function PUT(request: Request) {
  const sesion = await requireSesionEmpleado()
  const cuerpo = await request.json().catch(() => null)
  const r = await guardarConfiguracionHttp(sesion, cuerpo, depsConfiguracion)
  return NextResponse.json(r.body, { status: r.status })
}
