import { NextResponse } from 'next/server'
import { requireSesionEmpleado } from '@/lib/auth/session'
import { agregarClaveHttp, eliminarClaveHttp } from '@/lib/asistente/ruta'
import { depsClaves } from '@/lib/asistente/produccion'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const sesion = await requireSesionEmpleado()
  const cuerpo = await request.json().catch(() => null)
  const r = await agregarClaveHttp(sesion, cuerpo, depsClaves)
  return NextResponse.json(r.body, { status: r.status })
}

export async function DELETE(request: Request) {
  const sesion = await requireSesionEmpleado()
  const id = new URL(request.url).searchParams.get('id') ?? ''
  const r = await eliminarClaveHttp(sesion, id, depsClaves)
  return NextResponse.json(r.body, { status: r.status })
}
